import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Upload, RotateCcw, AlertTriangle, ArrowRight, Check, Sparkles } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';

export interface SizeResult {
  success?: boolean;
  foot_length_mm: number;
  foot_width_mm: number;
  recommended_eu_size: number;
  recommended_uk_size: number;
  recommended_us_size: number;
  calibration_object?: string;
  confidence_pct: number;
  fit_note: string;
  annotated_image_base64?: string;
  error?: string;
  error_code?: string;
  model?: string;
}

export const FootSizeFinderPage: React.FC = () => {
  const [step, setStep] = useState<'camera' | 'analyzing' | 'result' | 'error' | 'camera_denied'>('camera');
  const [result, setResult] = useState<SizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFacingMode, setActiveFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    startCamera('environment');
    return () => stopCamera();
  }, [startCamera, stopCamera]);

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

  // Process image with backend model
  const processImageBase64 = async (b64: string) => {
    stopCamera();
    setStep('analyzing');
    setErrorMsg('');

    try {
      const res = await fetch('/api/py/calculate-foot-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: b64,
          calibration_object: 'a4_paper',
        }),
        signal: AbortSignal.timeout(45000),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Service temporarily unavailable.' }));

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Could not detect foot on A4 paper. Please place your bare foot flat directly on top of a standard white A4 sheet.');
        setStep('error');
        return;
      }

      setResult(data);
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

  return (
    <>
      <SEOHelmet
        title="Foot Size Scanner — Peshawari Chappal Co."
        description="Instant camera-based foot size measurement using A4 paper calibration."
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

        {/* Clean Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-widest text-[#1A1A18] uppercase mb-1 block">
            Computer Vision Sizing
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A18]">
            Find Your Exact Shoe Size
          </h1>
          <p className="text-sm text-[#1A1A18]/80 mt-1 max-w-md mx-auto">
            Place your bare foot on a plain <span className="font-semibold text-[#1A1A18]">white A4 paper sheet</span> and point your camera straight down.
          </p>
        </div>

        {/* Main Step Container (Warm Taupe Section Contrast) */}
        <div className="bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] shadow-md p-4 sm:p-6 backdrop-blur-xs">

          {/* 1. CAMERA CAPTURE STEP */}
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
                <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-[#F7F4EB]/60 rounded-xl flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs bg-[#565449]/85 backdrop-blur-xs text-[#F7F4EB] px-2.5 py-1 rounded-md font-medium border border-[#F7F4EB]/30">
                      📄 White A4 Paper Area
                    </span>
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="pointer-events-auto p-2 rounded-full bg-[#565449]/85 text-[#F7F4EB] hover:bg-[#45433A] border border-[#F7F4EB]/30 transition"
                      title="Flip camera"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center text-xs bg-[#565449]/85 backdrop-blur-xs text-[#F7F4EB] py-1.5 px-3 rounded-md mx-auto border border-[#F7F4EB]/30">
                    Keep the entire A4 sheet and bare foot inside the frame
                  </div>
                </div>
              </div>

              {/* Action Buttons: Strict Olive Drab Primary Button */}
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
                  className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer"
                  title="Upload photo from gallery"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline">Upload Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. ANALYZING STEP */}
          {step === 'analyzing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 border-4 border-[#A0988A] border-t-[#565449] rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-[#1A1A18] absolute inset-0 m-auto animate-pulse" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#1A1A18]">
                Measuring Foot Dimensions...
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A18]/70 max-w-sm mx-auto">
                Running computer vision pipeline to isolate the A4 reference scale and compute millimeter dimensions.
              </p>
            </div>
          )}

          {/* 3. RESULT STEP */}
          {step === 'result' && result && (() => {
            const ukSize = Math.round(result.recommended_uk_size || 7);
            const euSize = result.recommended_eu_size || (ukSize + 33);
            const lengthMm = Math.round(result.foot_length_mm);
            const widthMm = Math.round(result.foot_width_mm);

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#A0988A]/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#A0988A]/40 text-[#1A1A18] flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1A1A18]">Measurement Successful</h3>
                      <p className="text-xs text-[#1A1A18]/70">Calibrated via A4 Reference</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1A1A18] bg-[#A0988A]/30 px-3 py-1 rounded-full border border-[#565449]">
                    Accurate Fit
                  </span>
                </div>

                {/* Main Recommended Size Card (Bone Card) */}
                <div className="text-center py-6 bg-[#F7F4EB] rounded-xl border border-[#A0988A]">
                  <span className="text-xs uppercase tracking-wider text-[#1A1A18]/80 font-bold block mb-1">
                    Recommended Peshawari Chappal Size
                  </span>
                  <div className="font-serif font-bold text-5xl sm:text-6xl text-[#1A1A18] my-2">
                    Size {ukSize}
                  </div>
                  <p className="text-xs sm:text-sm text-[#1A1A18]/80 font-medium">
                    Pak / UK {ukSize} &nbsp;·&nbsp; EU {euSize} &nbsp;·&nbsp; US {Number((ukSize + 0.5).toFixed(1))}
                  </p>
                </div>

                {/* Millimeter metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-center">
                    <span className="text-xs uppercase text-[#1A1A18]/80 block font-semibold">Foot Length</span>
                    <span className="font-bold text-xl text-[#1A1A18]">{lengthMm} mm</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-center">
                    <span className="text-xs uppercase text-[#1A1A18]/80 block font-semibold">Foot Width</span>
                    <span className="font-bold text-xl text-[#1A1A18]">{widthMm} mm</span>
                  </div>
                </div>

                {/* Annotated Proof Image */}
                {result.annotated_image_base64 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#1A1A18] block">
                      Detection Proof:
                    </span>
                    <div className="rounded-xl overflow-hidden border border-[#A0988A] bg-[#565449]/10 max-h-64 flex items-center justify-center">
                      <img
                        src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                        alt="Detection Proof"
                        className="max-h-64 w-auto object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons: Olive Drab */}
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

          {/* 4. ERROR STEP */}
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

              <div className="text-left text-xs text-[#1A1A18] bg-[#F7F4EB] p-4 rounded-xl border border-[#A0988A] space-y-1.5 max-w-md mx-auto">
                <span className="font-bold text-[#1A1A18] block">Tips for an accurate measurement:</span>
                <p>1. Use a standard plain white A4 paper sheet flat on the floor.</p>
                <p>2. Place your bare foot directly on top of the paper.</p>
                <p>3. Hold the camera directly overhead with good lighting.</p>
              </div>

              <div className="flex gap-3 justify-center pt-2 max-w-md mx-auto">
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
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. CAMERA DENIED STEP (Matches Image 1 exactly in Olive Drab, Warm Taupe, Bone) */}
          {step === 'camera_denied' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449]/30 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A18]">
                Camera Access Needed
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-sm mx-auto">
                Please allow camera access in your browser or choose a photo from your gallery.
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
    </>
  );
};

export default FootSizeFinderPage;
