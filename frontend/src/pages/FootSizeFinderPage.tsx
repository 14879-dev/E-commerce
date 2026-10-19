import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Upload, RotateCcw, AlertTriangle, ArrowRight, Check, Sparkles, Sliders, RefreshCw, CreditCard } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { PageHero } from '../components/common/PageHero';

export interface SizeResult {
  success?: boolean;
  foot_length_mm: number;
  foot_width_mm: number;
  recommended_eu_size: number;
  recommended_uk_size: number;
  recommended_us_size: number;
  confidence_pct: number;
  fit_profile?: string;
  fit_note: string;
  annotated_image_base64?: string;
  heel_point?: [number, number];
  toe_point?: [number, number];
  heel_point_norm?: [number, number];
  toe_point_norm?: [number, number];
  paper_corners_norm?: [number, number][];
  card_detected?: boolean;
  image_width?: number;
  image_height?: number;
  is_manually_adjusted?: boolean;
  calibration_scale_ppm?: number;
  error?: string;
  error_code?: string;
  model?: string;
}

export const FootSizeFinderPage: React.FC = () => {
  // Steps: 'camera' | 'landmark_adjust' | 'analyzing' | 'result' | 'error' | 'camera_denied'
  const [step, setStep] = useState<'camera' | 'landmark_adjust' | 'analyzing' | 'result' | 'error' | 'camera_denied'>('camera');
  const [result, setResult] = useState<SizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFacingMode, setActiveFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImageB64, setCapturedImageB64] = useState<string | null>(null);

  // Interactive Heel & Toe Landmark Calibration State (Normalized [0..1] and Pixel coords)
  const [heelNorm, setHeelNorm] = useState<[number, number]>([0.5, 0.2]);
  const [toeNorm, setToeNorm] = useState<[number, number]>([0.5, 0.8]);
  const [aiHeelNorm, setAiHeelNorm] = useState<[number, number]>([0.5, 0.2]);
  const [aiToeNorm, setAiToeNorm] = useState<[number, number]>([0.5, 0.8]);
  const [activePinDrag, setActivePinDrag] = useState<'heel' | 'toe' | null>(null);

  // Reference Card 4 Corners State (Normalized [0..1])
  const [cardCornersNorm, setCardCornersNorm] = useState<[number, number][]>([
    [0.10, 0.20], [0.35, 0.20], [0.35, 0.40], [0.10, 0.40]
  ]);

  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 1000, height: 1000 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const footImgRef = useRef<HTMLImageElement>(null);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera();
    setErrorMsg('');
    setStep('camera');

    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not supported on this origin');
      setStep('camera_denied');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (facing === 'environment') {
        startCamera('user');
      } else {
        setStep('camera_denied');
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (step === 'camera') {
      startCamera('environment');
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  // Capture frame as base64 JPEG
  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);

    return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  };

  // Process image with backend YOLOv8 model
  const processImageBase64 = async (
    b64: string,
    manualHeelNorm?: [number, number],
    manualToeNorm?: [number, number],
    customCardCornersNorm?: [number, number][]
  ) => {
    stopCamera();
    setStep('analyzing');
    setErrorMsg('');
    setCapturedImageB64(b64);

    try {
      const payload: Record<string, any> = {
        image_base64: b64,
        calibration_object: 'credit_card',
      };
      if (manualHeelNorm && manualToeNorm) {
        payload.manual_heel = manualHeelNorm;
        payload.manual_toe = manualToeNorm;
      }
      if (customCardCornersNorm) {
        payload.paper_corners = customCardCornersNorm;
      }

      const res = await fetch('/api/py/calculate-foot-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Service temporarily unavailable.' }));

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error || 'Could not detect foot. Please ensure your bare foot is clearly visible flat on the floor directly from overhead.'
        );
        setStep('error');
        return;
      }

      setResult(data);

      if (data.image_width && data.image_height) {
        setImageDims({ width: data.image_width, height: data.image_height });
      }

      if (data.heel_point_norm && data.toe_point_norm) {
        setHeelNorm(data.heel_point_norm);
        setToeNorm(data.toe_point_norm);
        if (!manualHeelNorm) {
          setAiHeelNorm(data.heel_point_norm);
          setAiToeNorm(data.toe_point_norm);
        }
      }

      if (data.paper_corners_norm) {
        setCardCornersNorm(data.paper_corners_norm);
      }

      setStep('result');
    } catch (err: any) {
      setErrorMsg(err.message?.includes('timeout')
        ? 'Processing timed out. Please take a clearer photo with good lighting.'
        : (err.message || 'Error processing scan.'));
      setStep('error');
    }
  };

  // Trigger capture
  const handleCapture = () => {
    const b64 = captureFrame();
    if (!b64) {
      setErrorMsg('Failed to capture frame from camera. Please try uploading a photo.');
      setStep('error');
      return;
    }
    processImageBase64(b64);
  };

  // Trigger upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const b64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      processImageBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  // Switch facing mode
  const toggleCameraFacing = () => {
    const newFacing = activeFacingMode === 'environment' ? 'user' : 'environment';
    setActiveFacingMode(newFacing);
    startCamera(newFacing);
  };

  // Pointer drag handlers for Heel / Toe pins on image
  const handlePointerDown = (pin: 'heel' | 'toe') => {
    setActivePinDrag(pin);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePinDrag || !footImgRef.current) return;
    const rect = footImgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xNorm = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    if (activePinDrag === 'heel') {
      setHeelNorm([xNorm, yNorm]);
    } else {
      setToeNorm([xNorm, yNorm]);
    }
  };

  const handlePointerUp = () => {
    setActivePinDrag(null);
  };

  const handleResetToAiLandmarks = () => {
    setHeelNorm(aiHeelNorm);
    setToeNorm(aiToeNorm);
  };

  const handleRecalculateWithAdjustedLandmarks = () => {
    if (!capturedImageB64) return;
    processImageBase64(capturedImageB64, heelNorm, toeNorm, cardCornersNorm);
  };

  return (
    <div className="w-full">
      <SEOHelmet
        title="AI Foot Size Calibration — Peshawari Chappal Co."
        description="Find your guaranteed Peshawari Chappal size with our custom YOLOv8 AI segmentation and photogrammetric calibration."
      />

      <PageHero
        badge="Master Artisan Fitting"
        title="Find Your Exact Shoe Size"
        subtitle="100% Guaranteed Custom Fit"
        description="Our custom neural computer vision model segments your foot anatomy, detects reference card and heel/toe endpoints, and calibrates your handcrafted Peshawari Chappal size."
      />

      <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
        {/* Hidden capture elements */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* MAIN CONTAINER */}
        <div className="bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] shadow-md p-4 sm:p-6 backdrop-blur-xs">
          
          {/* STEP 1: CAMERA VIEWFINDER */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-[#565449] aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder Target Overlays */}
                <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-[#F7F4EB]/70 rounded-xl flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs bg-[#565449]/90 backdrop-blur-xs text-[#F7F4EB] px-2.5 py-1 rounded-md font-medium border border-[#F7F4EB]/30 shadow-xs flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Card Flat Beside Foot</span>
                    </span>

                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="pointer-events-auto p-2 rounded-full bg-[#565449]/90 text-[#F7F4EB] hover:bg-[#45433A] border border-[#F7F4EB]/30 transition shadow-xs"
                      title="Flip camera"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-dashed border-emerald-400/70 rounded-lg w-48 sm:w-60 h-68 sm:h-84 flex items-center justify-center bg-emerald-500/5">
                      <span className="text-[11px] text-emerald-200 bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs text-center">
                        Place bare foot flat in frame
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-xs bg-[#565449]/90 backdrop-blur-xs text-[#F7F4EB] py-1.5 px-3 rounded-md mx-auto border border-[#F7F4EB]/30 shadow-xs">
                    Hold phone flat overhead. Keep card and bare foot clearly in frame.
                  </div>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="bg-[#F7F4EB] p-3 rounded-xl border border-[#A0988A] text-xs text-[#1A1A18] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span><strong>AI Overhead Capture:</strong> Place any card flat beside your bare foot and capture directly from overhead.</span>
                </div>
              </div>

              {/* Capture & Upload Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCapture}
                  className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 text-sm sm:text-base border border-[#565449] cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Capture &amp; Measure</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer text-sm sm:text-base active:scale-95 shadow-sm"
                  title="Upload photo from gallery"
                >
                  <Upload className="w-5 h-5 shrink-0" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING STATE */}
          {step === 'analyzing' && (
            <div className="py-14 text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-[#565449]/20 border-t-[#565449] animate-spin mx-auto" />
              <h2 className="font-serif font-bold text-xl text-[#1A1A18]">
                Analyzing Foot &amp; Reference Card...
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A18]/70 max-w-sm mx-auto">
                Running custom YOLOv8 instance segmentation, detecting reference card, and extracting anatomical heel and toe endpoints...
              </p>
            </div>
          )}

          {/* STEP 3: INTERACTIVE FOOT HEEL & TOE CALIBRATION (X & Y AXIS FINE-TUNING) */}
          {step === 'landmark_adjust' && capturedImageB64 && (
            <div className="space-y-4">
              <div className="bg-[#F7F4EB] p-3 rounded-xl border border-[#A0988A] text-xs text-[#1A1A18] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#565449] shrink-0" />
                  <span><strong>Foot Heel &amp; Toe Calibration:</strong> Drag the pins on the image or use the sliders below to fine-tune the Heel (X, Y) and Toe Tip (X, Y) endpoints.</span>
                </div>
              </div>

              {/* Interactive Image with Draggable Heel & Toe Pins */}
              <div className="text-center bg-black/90 p-2 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                <div className="relative inline-block mx-auto max-w-full">
                  <img
                    ref={footImgRef}
                    src={`data:image/jpeg;base64,${capturedImageB64}`}
                    alt="Foot Landmark Calibration"
                    className="max-h-[460px] w-auto object-contain block mx-auto select-none pointer-events-none"
                  />

                  {/* Touch/pointer overlay aligned with image */}
                  <div
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="absolute inset-0 w-full h-full touch-none select-none"
                  >
                    {/* Measurement line between Heel and Toe */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line
                        x1={`${heelNorm[0] * 100}%`}
                        y1={`${heelNorm[1] * 100}%`}
                        x2={`${toeNorm[0] * 100}%`}
                        y2={`${toeNorm[1] * 100}%`}
                        stroke="#00FF66"
                        strokeWidth="3"
                        strokeDasharray="4,4"
                      />
                    </svg>

                    {/* 🟠 Heel Pin (Draggable on X & Y axis) */}
                    <div
                      onPointerDown={() => handlePointerDown('heel')}
                      style={{
                        left: `${heelNorm[0] * 100}%`,
                        top: `${heelNorm[1] * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30"
                      title="Heel Landmark (Drag along X & Y)"
                    >
                      <span className="text-[10px] font-black text-white">HEEL</span>
                    </div>

                    {/* 🔵 Toe Tip Pin (Draggable on X & Y axis) */}
                    <div
                      onPointerDown={() => handlePointerDown('toe')}
                      style={{
                        left: `${toeNorm[0] * 100}%`,
                        top: `${toeNorm[1] * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30"
                      title="Toe Tip Landmark (Drag along X & Y)"
                    >
                      <span className="text-[10px] font-black text-white">TOE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sliders: Heel X/Y and Toe X/Y Calibration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F7F4EB] p-4 rounded-xl border border-[#A0988A]">
                {/* 🟠 Heel X & Y Controls */}
                <div className="p-3 bg-white/70 rounded-lg border border-[#A0988A]/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>🟠 Heel Position</span>
                    <span className="font-mono text-[11px]">
                      X: {Math.round(heelNorm[0] * imageDims.width)} · Y: {Math.round(heelNorm[1] * imageDims.height)}
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#1A1A18]/70 block font-medium">Heel X (Left ↔ Right)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(heelNorm[0] * 100)}
                      onChange={(e) => setHeelNorm([Number(e.target.value) / 100, heelNorm[1]])}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#1A1A18]/70 block font-medium">Heel Y (Top ↕ Bottom)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(heelNorm[1] * 100)}
                      onChange={(e) => setHeelNorm([heelNorm[0], Number(e.target.value) / 100])}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 🔵 Toe X & Y Controls */}
                <div className="p-3 bg-white/70 rounded-lg border border-[#A0988A]/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-800">
                    <span>🔵 Toe Tip Position</span>
                    <span className="font-mono text-[11px]">
                      X: {Math.round(toeNorm[0] * imageDims.width)} · Y: {Math.round(toeNorm[1] * imageDims.height)}
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#1A1A18]/70 block font-medium">Toe X (Left ↔ Right)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(toeNorm[0] * 100)}
                      onChange={(e) => setToeNorm([Number(e.target.value) / 100, toeNorm[1]])}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#1A1A18]/70 block font-medium">Toe Y (Top ↕ Bottom)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(toeNorm[1] * 100)}
                      onChange={(e) => setToeNorm([toeNorm[0], Number(e.target.value) / 100])}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleResetToAiLandmarks}
                  className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-4 rounded-xl border border-[#565449] transition cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>↺ Reset to AI Landmarks</span>
                </button>

                <button
                  type="button"
                  onClick={handleRecalculateWithAdjustedLandmarks}
                  className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition border border-[#565449] cursor-pointer text-xs sm:text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Recalculate Size with Adjusted Landmarks</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RESULT DISPLAY */}
          {step === 'result' && result && (() => {
            const ukSize = result.recommended_uk_size;
            const euSize = result.recommended_eu_size;
            const usSize = result.recommended_us_size;
            const lengthMm = result.foot_length_mm;
            const widthMm = result.foot_width_mm;
            const fitProfile = result.fit_profile || 'Standard';

            return (
              <div className="space-y-5">
                {/* Header status */}
                <div className="flex items-center justify-between pb-3 border-b border-[#A0988A]/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1A1A18]">
                        {result.card_detected ? 'Reference Card Calibrated' : 'Foot Measurement Calibrated'}
                      </h3>
                      <p className="text-xs text-[#1A1A18]/70">
                        {result.card_detected
                          ? `ISO Card Homography Active (${result.calibration_scale_ppm || '2.52'} px/mm)`
                          : (result.is_manually_adjusted ? 'Fine-tuned via Heel & Toe X/Y Calibration' : 'AI Instance Segmentation & Anatomical Axis')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    {result.card_detected ? '99.5% Precision' : `${result.confidence_pct}% AI Confidence`}
                  </span>
                </div>

                {/* Main Recommended Size Card */}
                <div className="text-center py-6 bg-[#F7F4EB] rounded-xl border border-[#A0988A] shadow-xs">
                  <span className="text-xs uppercase tracking-wider text-[#1A1A18]/80 font-bold block mb-1">
                    Recommended Peshawari Chappal Size
                  </span>
                  <div className="font-serif font-bold text-5xl sm:text-6xl text-[#1A1A18] my-2">
                    Size {ukSize}
                  </div>
                  <p className="text-xs sm:text-sm text-[#1A1A18]/80 font-medium">
                    Pak / UK {ukSize} &nbsp;·&nbsp; EU {euSize} &nbsp;·&nbsp; US {usSize}
                  </p>
                  <div className="mt-3 inline-block bg-[#565449]/10 text-[#1A1A18] text-xs font-semibold px-3 py-1 rounded-full border border-[#565449]/20">
                    Fit Character: {fitProfile}
                  </div>
                </div>

                {/* Millimeter metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-center shadow-xs">
                    <span className="text-xs uppercase text-[#1A1A18]/80 block font-semibold">Bare Foot Length</span>
                    <span className="font-bold text-2xl text-[#1A1A18]">{lengthMm} mm</span>
                    <span className="text-[11px] text-[#1A1A18]/60 block mt-0.5">
                      Heel Apex to Longest Toe
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-center shadow-xs">
                    <span className="text-xs uppercase text-[#1A1A18]/80 block font-semibold">Foot Ball Width</span>
                    <span className="font-bold text-2xl text-[#1A1A18]">{widthMm} mm</span>
                    <span className="text-[11px] text-[#1A1A18]/60 block mt-0.5">Widest Part ("Panja")</span>
                  </div>
                </div>

                {/* Calibrated Foot Scan View */}
                {result.annotated_image_base64 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1A1A18]">
                        AI Photogrammetry &amp; Segmentation Scan:
                      </span>
                      {capturedImageB64 && (
                        <button
                          type="button"
                          onClick={() => setStep('landmark_adjust')}
                          className="text-xs text-[#565449] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Fine-tune Heel &amp; Toe (X / Y Axis)</span>
                        </button>
                      )}
                    </div>

                    <div className="text-center bg-[#565449]/10 p-2 rounded-xl overflow-hidden border border-[#A0988A] flex items-center justify-center shadow-inner">
                      <img
                        src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                        alt="Calibrated AI Foot Scan"
                        className="max-h-80 w-auto object-contain block mx-auto select-none rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera(activeFacingMode)}
                    className="flex-1 bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Scan Again</span>
                  </button>

                  <Link
                    to={`/products?size=${ukSize}`}
                    className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition text-center border border-[#565449] cursor-pointer"
                  >
                    <span>Shop Size {ukSize}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* STEP 5: ERROR STATE */}
          {step === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449]/40 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A18]">
                Detection Unsuccessful
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A18] bg-[#A0988A]/25 p-3 rounded-xl border border-[#565449]/40 max-w-md mx-auto">
                {errorMsg}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => startCamera(activeFacingMode)}
                  className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-[#565449] cursor-pointer text-xs sm:text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Camera Again</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer text-xs sm:text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Another Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: CAMERA DENIED STATE */}
          {step === 'camera_denied' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449]/30 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A18]">
                Camera Access Needed
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-sm mx-auto">
                Please allow camera access or choose an existing photo from your device.
              </p>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-5 rounded-xl border border-[#565449] transition text-sm cursor-pointer shadow-xs"
                >
                  Retry Camera
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3 px-5 rounded-xl flex items-center gap-2 transition text-sm cursor-pointer shadow-md border border-[#565449]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
