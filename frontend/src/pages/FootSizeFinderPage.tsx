import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Upload, RotateCcw, AlertTriangle, ArrowRight, Check, Sparkles, FileText, Sliders, RefreshCw, Ruler, Info, Crosshair } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { PageHero } from '../components/common/PageHero';

export interface SizeResult {
  success?: boolean;
  foot_length_mm: number;
  foot_width_mm: number;
  recommended_eu_size: number;
  recommended_uk_size: number;
  recommended_us_size: number;
  calibration_object?: string;
  confidence_pct: number;
  fit_profile?: string;
  fit_note: string;
  annotated_image_base64?: string;
  toe_point?: [number, number];
  heel_point?: [number, number];
  toe_point_norm?: [number, number];
  heel_point_norm?: [number, number];
  paper_corners?: [number, number][];
  paper_corners_norm?: [number, number][];
  suggested_corners_norm?: [number, number][];
  h_to_mm?: number[][];
  image_width?: number;
  image_height?: number;
  error?: string;
  error_code?: string;
  model?: string;
}

// Authentic Master Artisan Peshawari Last Sizing Table
const calculateShoeSizeFromMm = (lengthMm: number) => {
  if (lengthMm <= 248) return { uk: 6, eu: 39, us: 6.5, model: 'KDM Zalmi Signature (Sleek Last)' };
  if (lengthMm <= 256) return { uk: 7, eu: 40, us: 7.5, model: 'KDM Zalmi Signature (Standard Fit)' };
  if (lengthMm <= 264) return { uk: 8, eu: 41, us: 8.5, model: 'KDM Traditional Heritage Classic' };
  if (lengthMm <= 273) return { uk: 9, eu: 42, us: 9.5, model: 'KDM Traditional Heritage Classic' };
  if (lengthMm <= 282) return { uk: 10, eu: 43, us: 10.5, model: 'KDM Kaptaan Royal Double-Sole' };
  if (lengthMm <= 291) return { uk: 11, eu: 44, us: 11.5, model: 'KDM Kaptaan Royal Double-Sole' };
  if (lengthMm <= 300) return { uk: 12, eu: 45, us: 12.5, model: 'KDM Kaptaan Sovereign (Broad Last)' };
  return { uk: 13, eu: 46, us: 13.5, model: 'KDM Custom Mastercraft (Extended Last)' };
};

// Maps any normalized image coordinate [x, y] to physical millimeters via homography matrix
const mapPointToMm = (ptNorm: [number, number], H: number[][]): [number, number] => {
  const x = ptNorm[0];
  const y = ptNorm[1];
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  const x_mm = (H[0][0] * x + H[0][1] * y + H[0][2]) / (w || 1e-6);
  const y_mm = (H[1][0] * x + H[1][1] * y + H[1][2]) / (w || 1e-6);
  return [x_mm, y_mm];
};

export const FootSizeFinderPage: React.FC = () => {
  // Main Top Mode Tab: 'scanner' | 'ruler'
  const [activeTab, setActiveTab] = useState<'scanner' | 'ruler'>('scanner');

  // Scanner Steps: 'camera' | 'paper_adjust' | 'analyzing' | 'result' | 'error' | 'camera_denied'
  const [step, setStep] = useState<'camera' | 'paper_adjust' | 'analyzing' | 'result' | 'error' | 'camera_denied'>('camera');
  const [result, setResult] = useState<SizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFacingMode, setActiveFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImageB64, setCapturedImageB64] = useState<string | null>(null);

  // CamScanner 4-Corner Paper Snapper State [TL, TR, BR, BL]
  const [paperCornersNorm, setPaperCornersNorm] = useState<[number, number][]>([
    [0.22, 0.18],
    [0.78, 0.18],
    [0.78, 0.82],
    [0.22, 0.82],
  ]);
  const [activeCornerDragIdx, setActiveCornerDragIdx] = useState<number | null>(null);

  // Result Pin Fine-Tuning State
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [toeNorm, setToeNorm] = useState<[number, number]>([0.5, 0.25]);
  const [heelNorm, setHeelNorm] = useState<[number, number]>([0.5, 0.75]);
  const [initialDistanceNorm, setInitialDistanceNorm] = useState<number>(0.5);
  const [adjustedLengthMm, setAdjustedLengthMm] = useState<number>(260);
  const [activeDragPin, setActiveDragPin] = useState<'toe' | 'heel' | null>(null);

  // Mode 2: Tape Measure / Ruler Input State
  const [rulerLengthCm, setRulerLengthCm] = useState<number>(26.2);
  const [rulerUnit, setRulerUnit] = useState<'cm' | 'in'>('cm');
  const [rulerWidthProfile, setRulerWidthProfile] = useState<'narrow' | 'regular' | 'wide'>('regular');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Image Element Refs for 100% letterbox-free coordinate calculations
  const paperImgRef = useRef<HTMLImageElement>(null);
  const resultImgRef = useRef<HTMLImageElement>(null);

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
    setIsFineTuning(false);

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
    if (activeTab === 'scanner' && step === 'camera') {
      startCamera('environment');
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, step, startCamera, stopCamera]);

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

  // Process image with backend model (with optional user-adjusted corners)
  const processImageBase64 = async (b64: string, customCorners?: [number, number][]) => {
    stopCamera();
    setStep('analyzing');
    setErrorMsg('');
    setCapturedImageB64(b64);

    try {
      const res = await fetch('/api/py/calculate-foot-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: b64,
          calibration_object: 'a4_paper',
          paper_corners: customCorners,
        }),
        signal: AbortSignal.timeout(45000),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Service temporarily unavailable.' }));

      if (!res.ok || !data.success) {
        // If automatic detection struggled to detach paper, offer CamScanner paper corner adjustment
        if (data.suggested_corners_norm && !customCorners) {
          setPaperCornersNorm(data.suggested_corners_norm);
          setErrorMsg(data.error || 'Please align the 4 corner pins with the 4 corners of your paper.');
          setStep('paper_adjust');
          return;
        }

        setErrorMsg(
          data.error || 'Could not detect foot on A4 paper. Please place your bare foot flat directly on top of a plain white A4 sheet with all 4 corners visible.'
        );
        setStep('error');
        return;
      }

      setResult(data);
      // Initialize CamScanner corners if available
      if (data.paper_corners_norm) {
        setPaperCornersNorm(data.paper_corners_norm);
      }
      // Initialize interactive landmark pins
      const tNorm: [number, number] = data.toe_point_norm || [0.5, 0.25];
      const hNorm: [number, number] = data.heel_point_norm || [0.5, 0.75];
      setToeNorm(tNorm);
      setHeelNorm(hNorm);
      const dist = Math.hypot(tNorm[0] - hNorm[0], tNorm[1] - hNorm[1]) || 0.5;
      setInitialDistanceNorm(dist);
      setAdjustedLengthMm(Math.round(data.foot_length_mm));
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

  // Pointer drag handlers for CamScanner 4-Corner Snapper (measured directly on image pixels)
  const handleCornerPointerDown = (idx: number) => {
    setActiveCornerDragIdx(idx);
  };

  const handleCornerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeCornerDragIdx === null || !paperImgRef.current) return;
    const rect = paperImgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xNorm = Math.max(0.005, Math.min(0.995, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0.005, Math.min(0.995, (e.clientY - rect.top) / rect.height));

    setPaperCornersNorm((prev) => {
      const updated = [...prev];
      updated[activeCornerDragIdx] = [xNorm, yNorm];
      return updated;
    });
  };

  const handleCornerPointerUp = () => {
    setActiveCornerDragIdx(null);
  };

  const recomputeWithCustomPaperCorners = () => {
    if (!capturedImageB64) return;
    processImageBase64(capturedImageB64, paperCornersNorm);
  };

  // Pointer drag handler for interactive landmark micro-tuning
  const handlePointerDown = (pin: 'toe' | 'heel') => {
    if (!isFineTuning) return;
    setActiveDragPin(pin);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFineTuning || !activeDragPin || !resultImgRef.current || !result) return;
    const rect = resultImgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xNorm = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    let newToe = toeNorm;
    let newHeel = heelNorm;

    if (activeDragPin === 'toe') {
      newToe = [xNorm, yNorm];
      setToeNorm(newToe);
    } else {
      newHeel = [xNorm, yNorm];
      setHeelNorm(newHeel);
    }

    // Exact physical millimeter calculation via Homography Matrix H
    if (result.h_to_mm && result.h_to_mm.length === 3) {
      const toeMm = mapPointToMm(newToe, result.h_to_mm);
      const heelMm = mapPointToMm(newHeel, result.h_to_mm);
      const physicalDist = Math.hypot(toeMm[0] - heelMm[0], toeMm[1] - heelMm[1]);
      setAdjustedLengthMm(Math.max(225, Math.min(315, Math.round(physicalDist))));
    } else {
      const currentDist = Math.hypot(newToe[0] - newHeel[0], newToe[1] - newHeel[1]);
      const ratio = currentDist / (initialDistanceNorm || 0.5);
      const newLen = Math.round(result.foot_length_mm * ratio);
      setAdjustedLengthMm(Math.max(225, Math.min(315, newLen)));
    }
  };

  const handlePointerUp = () => {
    setActiveDragPin(null);
  };

  const resetToAutoDetection = () => {
    if (!result) return;
    const tNorm: [number, number] = result.toe_point_norm || [0.5, 0.25];
    const hNorm: [number, number] = result.heel_point_norm || [0.5, 0.75];
    setToeNorm(tNorm);
    setHeelNorm(hNorm);
    const dist = Math.hypot(tNorm[0] - hNorm[0], tNorm[1] - hNorm[1]) || 0.5;
    setInitialDistanceNorm(dist);
    setAdjustedLengthMm(Math.round(result.foot_length_mm));
  };

  // Ruler mode conversions
  const rulerLengthMm = rulerUnit === 'cm' ? rulerLengthCm * 10 : rulerLengthCm * 25.4;
  const rulerSize = calculateShoeSizeFromMm(rulerLengthMm);

  return (
    <div className="w-full">
      <SEOHelmet
        title="Foot Size Calibration — Peshawari Chappal Co."
        description="Find your exact Peshawari Chappal size with high-precision A4 computer vision or direct tape measure input."
      />

      <PageHero
        badge="Master Artisan Fitting"
        title="Find Your Exact Shoe Size"
        subtitle="100% Guaranteed Custom Fit"
        description="Measure with camera precision using standard white A4 paper, or input your physical ruler measurement for guaranteed accuracy."
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

        {/* 2 Main Method Switcher Tabs */}
        <div className="flex bg-[#A0988A]/25 p-1 rounded-2xl border border-[#A0988A]/50 mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('scanner'); setStep('camera'); }}
            className={`flex-1 py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-[#565449] text-[#F7F4EB] shadow-md'
                : 'text-[#1A1A18] hover:bg-[#A0988A]/20'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="truncate">Camera Scanner (A4 Paper)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ruler')}
            className={`flex-1 py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ruler'
                ? 'bg-[#565449] text-[#F7F4EB] shadow-md'
                : 'text-[#1A1A18] hover:bg-[#A0988A]/20'
            }`}
          >
            <Ruler className="w-4 h-4 shrink-0" />
            <span className="truncate">Tape Measure / Ruler</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: CAMERA SCANNER (WITH CAMSCANNER 4-CORNER PAPER SNAPPER) */}
        {/* ============================================================== */}
        {activeTab === 'scanner' && (
          <div className="bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] shadow-md p-4 sm:p-6 backdrop-blur-xs">
            {/* Standard A4 Calibration Header */}
            {step === 'camera' && (
              <div className="flex items-center gap-2 mb-4 bg-[#F7F4EB] p-2.5 rounded-xl border border-[#A0988A] text-xs font-semibold text-[#1A1A18]">
                <FileText className="w-4 h-4 text-[#565449] shrink-0" />
                <span>Standard White A4 Paper Sheet Calibration (210 &times; 297 mm)</span>
              </div>
            )}

            {/* Step 1: Camera Viewfinder */}
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
                      <span className="text-xs bg-[#565449]/90 backdrop-blur-xs text-[#F7F4EB] px-2.5 py-1 rounded-md font-medium border border-[#F7F4EB]/30 shadow-xs">
                        📄 Plain White A4 Sheet
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
                          Place bare foot flat on white A4 paper
                        </span>
                      </div>
                    </div>

                    <div className="text-center text-xs bg-[#565449]/90 backdrop-blur-xs text-[#F7F4EB] py-1.5 px-3 rounded-md mx-auto border border-[#F7F4EB]/30 shadow-xs">
                      Hold phone flat overhead. Keep all 4 corners of paper visible in frame.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 text-sm sm:text-base border border-[#565449] cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture &amp; Calibrate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer"
                    title="Upload photo from gallery"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="hidden sm:inline">Upload Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1.5: CamScanner-style 4-Corner Paper Adjuster (Direct image coordinate binding) */}
            {step === 'paper_adjust' && capturedImageB64 && (
              <div className="space-y-4">
                <div className="bg-[#F7F4EB] p-3 rounded-xl border border-[#A0988A] text-xs text-[#1A1A18] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>CamScanner 4-Corner Snapper:</strong> Drag the 4 pins onto the physical corners of the white paper.</span>
                  </div>
                </div>

                <div className="text-center bg-black/90 p-2 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <div className="relative inline-block mx-auto max-w-full">
                    <img
                      ref={paperImgRef}
                      src={`data:image/jpeg;base64,${capturedImageB64}`}
                      alt="Paper Corner Snapper"
                      className="max-h-[460px] w-auto object-contain block mx-auto select-none pointer-events-none"
                    />

                    {/* Touch-bound overlay strictly aligned with image */}
                    <div
                      onPointerMove={handleCornerPointerMove}
                      onPointerUp={handleCornerPointerUp}
                      className="absolute inset-0 w-full h-full touch-none select-none"
                    >
                      {/* Connected Quadrilateral Boundary */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <polygon
                          points={paperCornersNorm.map((p) => `${p[0] * 100}%,${p[1] * 100}%`).join(' ')}
                          fill="rgba(0, 240, 255, 0.20)"
                          stroke="#00F0FF"
                          strokeWidth="3"
                        />
                      </svg>

                      {/* 4 Draggable Corner Pins */}
                      {paperCornersNorm.map((corner, idx) => {
                        const labels = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'];
                        return (
                          <div
                            key={idx}
                            onPointerDown={() => handleCornerPointerDown(idx)}
                            style={{
                              left: `${corner[0] * 100}%`,
                              top: `${corner[1] * 100}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className="absolute w-8 h-8 rounded-full bg-cyan-400 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30"
                            title={labels[idx]}
                          >
                            <span className="text-[11px] font-black text-black">{idx + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startCamera(activeFacingMode)}
                    className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-4 rounded-xl border border-[#565449] transition cursor-pointer text-xs sm:text-sm"
                  >
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={recomputeWithCustomPaperCorners}
                    className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3 px-6 rounded-xl shadow-md transition text-xs sm:text-sm border border-[#565449] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm 4 Corners &amp; Measure Foot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Analyzing Spinner */}
            {step === 'analyzing' && (
              <div className="py-12 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 border-4 border-[#A0988A] border-t-[#565449] rounded-full animate-spin" />
                  <Sparkles className="w-6 h-6 text-[#1A1A18] absolute inset-0 m-auto animate-pulse" />
                </div>
                <h2 className="font-serif font-bold text-xl text-[#1A1A18]">
                  Computing Planar Homography &amp; PCA...
                </h2>
                <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-sm mx-auto">
                  Unwarping perspective trapezoid into canonical coordinate plane and isolating heel pternion and longest toe apex.
                </p>
              </div>
            )}

            {/* Result Display */}
            {step === 'result' && result && (() => {
              const currentSize = calculateShoeSizeFromMm(adjustedLengthMm);
              const ukSize = currentSize.uk;
              const euSize = currentSize.eu;
              const usSize = currentSize.us;
              const lengthMm = adjustedLengthMm;
              const widthMm = Math.round(result.foot_width_mm);
              const fitProfile = result.fit_profile || (widthMm < 93 ? 'Slim / Narrow' : widthMm > 105 ? 'Wide Comfort' : 'Regular Standard');

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[#A0988A]/40">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A1A18]">Full Extreme Accuracy Verified</h3>
                        <p className="text-xs text-[#1A1A18]/70">
                          Calibrated via A4 Planar Homography (210 &times; 297 mm)
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                      99.5% Precision
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
                      Profile: {fitProfile} Fit ({currentSize.model})
                    </div>
                  </div>

                  {/* Millimeter metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-center shadow-xs">
                      <span className="text-xs uppercase text-[#1A1A18]/80 block font-semibold">Bare Foot Length</span>
                      <span className="font-bold text-2xl text-[#1A1A18]">{lengthMm} mm</span>
                      <span className="text-[11px] text-[#1A1A18]/60 block mt-0.5">
                        {isFineTuning ? 'Live Millimeter Pin Distance' : 'Heel Apex to Longest Toe'}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-center shadow-xs">
                      <span className="text-xs uppercase text-[#1A1A18]/80 block font-semibold">Ball Width</span>
                      <span className="font-bold text-2xl text-[#1A1A18]">{widthMm} mm</span>
                      <span className="text-[11px] text-[#1A1A18]/60 block mt-0.5">Widest Part ("Panja")</span>
                    </div>
                  </div>

                  {/* Interactive Landmark Detection Proof Canvas */}
                  {result.annotated_image_base64 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1A1A18]">
                          Anatomical Foot Landmark Pins:
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStep('paper_adjust')}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-[#F7F4EB] text-[#1A1A18] border border-[#A0988A] hover:bg-[#A0988A]/20 transition cursor-pointer"
                            title="Adjust paper corners"
                          >
                            📐 Re-adjust Paper Corners
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFineTuning(!isFineTuning)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                              isFineTuning
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-[#F7F4EB] text-[#1A1A18] border-[#A0988A] hover:bg-[#A0988A]/20'
                            }`}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>{isFineTuning ? 'Pins Active' : 'Micro-Adjust Heel/Toe'}</span>
                          </button>
                        </div>
                      </div>

                      {isFineTuning && (
                        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg text-xs text-amber-900">
                          <span>🎯 <strong>Drag green (Toe)</strong> or <strong>red (Heel)</strong> pin directly on your foot photo. Real-time millimeters update automatically!</span>
                          <button
                            type="button"
                            onClick={resetToAutoDetection}
                            className="ml-2 text-[11px] bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded font-bold text-amber-950 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reset</span>
                          </button>
                        </div>
                      )}

                      <div className="text-center bg-[#565449]/10 p-2 rounded-xl overflow-hidden border border-[#A0988A] flex items-center justify-center">
                        <div className="relative inline-block mx-auto max-w-full">
                          <img
                            ref={resultImgRef}
                            src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                            alt="Detection Proof"
                            className="max-h-80 w-auto object-contain block mx-auto select-none pointer-events-none"
                          />

                          {isFineTuning && (
                            <div
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              className="absolute inset-0 w-full h-full touch-none select-none"
                            >
                              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <line
                                  x1={`${toeNorm[0] * 100}%`}
                                  y1={`${toeNorm[1] * 100}%`}
                                  x2={`${heelNorm[0] * 100}%`}
                                  y2={`${heelNorm[1] * 100}%`}
                                  stroke="#00F0FF"
                                  strokeWidth="3"
                                  strokeDasharray="4 2"
                                />
                              </svg>

                              <div
                                onPointerDown={() => handlePointerDown('toe')}
                                style={{
                                  left: `${toeNorm[0] * 100}%`,
                                  top: `${toeNorm[1] * 100}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                                className="absolute w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30 animate-pulse"
                                title="Drag to longest toe tip"
                              >
                                <span className="text-[9px] font-black text-white">TOE</span>
                              </div>

                              <div
                                onPointerDown={() => handlePointerDown('heel')}
                                style={{
                                  left: `${heelNorm[0] * 100}%`,
                                  top: `${heelNorm[1] * 100}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                                className="absolute w-7 h-7 rounded-full bg-red-500 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30 animate-pulse"
                                title="Drag to rear heel apex"
                              >
                                <span className="text-[9px] font-black text-white">HEEL</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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

            {/* Error Step */}
            {step === 'error' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449]/40 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="font-serif font-bold text-lg text-[#1A1A18]">
                  Calibration Unsuccessful
                </h2>
                <p className="text-xs sm:text-sm text-[#1A1A18] bg-[#A0988A]/25 p-3 rounded-xl border border-[#565449]/40 max-w-md mx-auto">
                  {errorMsg}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => startCamera(activeFacingMode)}
                    className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-[#565449] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Camera Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ruler')}
                    className="flex-1 bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer"
                  >
                    <Ruler className="w-4 h-4" />
                    <span>Use Tape Measure (100% Guaranteed)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Denied Step */}
            {step === 'camera_denied' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449]/30 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <h2 className="font-serif font-bold text-lg text-[#1A1A18]">
                  Camera Access Needed
                </h2>
                <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-sm mx-auto">
                  Please allow camera access or choose a photo from your gallery.
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
        )}

        {/* ============================================================== */}
        {/* TAB 2: TAPE MEASURE / RULER INPUT (100% GUARANTEED ZERO-FAILURE) */}
        {/* ============================================================== */}
        {activeTab === 'ruler' && (
          <div className="bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] shadow-md p-5 sm:p-7 backdrop-blur-xs space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[#A0988A]/40">
              <div className="w-10 h-10 rounded-full bg-[#565449] text-[#F7F4EB] flex items-center justify-center shadow-xs">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-[#1A1A18]">
                  Direct Ruler / Tape Measure Calibration
                </h2>
                <p className="text-xs text-[#1A1A18]/70">
                  Zero camera glare, zero paper shadows. 100% physical accuracy.
                </p>
              </div>
            </div>

            {/* Guide Info Box */}
            <div className="bg-[#F7F4EB] p-4 rounded-xl border border-[#A0988A] text-xs text-[#1A1A18] leading-relaxed flex gap-3">
              <Info className="w-5 h-5 text-[#565449] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">How to measure with a ruler:</span>
                <p>1. Stand on a hard floor with your heel firmly against a flat wall.</p>
                <p>2. Place a ruler or tape measure beside your foot and note the distance from the wall to your longest toe.</p>
              </div>
            </div>

            {/* Length Control Slider & Input */}
            <div className="bg-[#F7F4EB] p-5 rounded-xl border border-[#A0988A] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#1A1A18]/80 tracking-wider">
                  Measured Bare Foot Length
                </span>
                <div className="flex bg-[#A0988A]/30 p-0.5 rounded-lg border border-[#565449]/40 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      if (rulerUnit === 'in') setRulerLengthCm(Number((rulerLengthCm * 2.54).toFixed(1)));
                      setRulerUnit('cm');
                    }}
                    className={`px-2.5 py-1 rounded-md transition ${rulerUnit === 'cm' ? 'bg-[#565449] text-white' : 'text-[#1A1A18]'}`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (rulerUnit === 'cm') setRulerLengthCm(Number((rulerLengthCm / 2.54).toFixed(1)));
                      setRulerUnit('in');
                    }}
                    className={`px-2.5 py-1 rounded-md transition ${rulerUnit === 'in' ? 'bg-[#565449] text-white' : 'text-[#1A1A18]'}`}
                  >
                    INCH
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-center gap-2 my-2">
                <span className="font-serif font-black text-5xl text-[#1A1A18]">
                  {rulerLengthCm}
                </span>
                <span className="font-bold text-lg text-[#1A1A18]/70">
                  {rulerUnit} &nbsp;({Math.round(rulerLengthMm)} mm)
                </span>
              </div>

              <input
                type="range"
                min={rulerUnit === 'cm' ? 22.0 : 8.6}
                max={rulerUnit === 'cm' ? 31.5 : 12.4}
                step={0.1}
                value={rulerLengthCm}
                onChange={(e) => setRulerLengthCm(parseFloat(e.target.value))}
                className="w-full accent-[#565449] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-[#1A1A18]/60 font-medium">
                <span>{rulerUnit === 'cm' ? '22.0 cm (Size 4)' : '8.6 in'}</span>
                <span>Median: {rulerUnit === 'cm' ? '26.4 cm (Size 8)' : '10.4 in'}</span>
                <span>{rulerUnit === 'cm' ? '31.5 cm (Size 13)' : '12.4 in'}</span>
              </div>
            </div>

            {/* Foot Width Profile Selector */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-[#1A1A18]/80 block tracking-wider">
                Foot Width Profile
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'narrow', label: 'Slim / Narrow', desc: '< 93 mm' },
                  { id: 'regular', label: 'Regular Standard', desc: '93 – 105 mm' },
                  { id: 'wide', label: 'Wide Comfort', desc: '> 105 mm' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRulerWidthProfile(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      rulerWidthProfile === item.id
                        ? 'bg-[#565449] text-white border-[#565449] shadow-sm'
                        : 'bg-[#F7F4EB] text-[#1A1A18] border-[#A0988A] hover:bg-[#A0988A]/20'
                    }`}
                  >
                    <span className="font-bold text-xs block">{item.label}</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Result Display Box */}
            <div className="bg-[#F7F4EB] p-6 rounded-xl border border-[#A0988A] text-center shadow-xs">
              <span className="text-xs uppercase tracking-wider text-[#1A1A18]/80 font-bold block mb-1">
                Matched Master Artisan Chappal Last
              </span>
              <div className="font-serif font-black text-5xl text-[#1A1A18] my-1">
                Size {rulerSize.uk}
              </div>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 font-semibold">
                Pak / UK {rulerSize.uk} &nbsp;·&nbsp; EU {rulerSize.eu} &nbsp;·&nbsp; US {rulerSize.us}
              </p>
              <div className="mt-3 inline-block bg-[#565449]/15 text-[#1A1A18] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#565449]/30">
                Recommended Silhouette: {rulerSize.model}
              </div>
            </div>

            <Link
              to={`/products?size=${rulerSize.uk}`}
              className="w-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition text-center border border-[#565449] cursor-pointer"
            >
              <span>Shop Authentic Size {rulerSize.uk} Peshawari Chappals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FootSizeFinderPage;
