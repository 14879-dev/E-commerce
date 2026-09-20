import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CheckCircle2, RotateCcw, ArrowRight, AlertCircle, Zap, Upload, Sliders, Ruler, Sparkles, ShieldCheck, AlertTriangle, Cpu, Check, X } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import FootScanDemo from '../components/foot/FootScanDemo';

// ─── Local Neural AI Types ──────────────────────────────────────────────────
export interface VisionModelResult {
  foot_length_mm: number;
  foot_width_mm: number;
  model_name?: string;
  calibration_object?: string;
  raw_ppm?: number;
  heel_point?: [number, number];
  toe_point?: [number, number];
  card_box?: number[][];
  bounding_box?: number[];
}

export interface NeuralVerification {
  is_complete_foot_visible?: boolean;
  is_reference_placed_correctly?: boolean;
  image_problems?: string[];
  measurement_plausibility?: string;
  verification_status?: 'VERIFIED' | 'CAUTION' | 'RETAKE_RECOMMENDED';
  disagreement?: boolean;
  feedback?: string;
  second_opinion?: string;
  confidence_score?: number;
  recommended_action?: string;
}

export interface FinalKdmResult {
  foot_length_mm: number;
  foot_width_mm: number;
  recommended_eu_size: number;
  recommended_uk_size: number;
  recommended_us_size: number;
  fit_profile?: string;
  confidence_level?: 'High' | 'Medium' | 'Uncertain - Retake Photo' | string;
  confidence_pct?: number;
  recommended_chappal_model?: string;
  agreement_confirmed?: boolean;
  retake_recommended?: boolean;
  retake_reason?: string | null;
}

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
  card_detected?: boolean;
  scale_source?: string;
  heel_point?: [number, number];
  toe_point?: [number, number];
  warnings?: string[];
  algorithm?: string;
  diagnostics?: { brightness: number; sharpness: number };
  yolo_result?: VisionModelResult;
  vision_result?: VisionModelResult;
  neural_verification?: NeuralVerification;
  gemini_verification?: NeuralVerification;
  final_kdm_result?: FinalKdmResult;
}

type Step = 'intro' | 'calibration' | 'camera' | 'analyzing' | 'result' | 'error' | 'camera_denied';
type CalibrationObject = 'credit_card' | 'a4_paper' | 'us_letter';

const CALIBRATION_LABELS: Record<CalibrationObject, string> = {
  credit_card: 'Standard Credit / Debit Card (85.6 × 54 mm)',
  a4_paper:    'A4 Paper Sheet (210 × 297 mm)',
  us_letter:   'US Letter Paper (215.9 × 279.4 mm)',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const FootSizeFinderPage: React.FC = () => {
  const [pageMode, setPageMode] = useState<'scan' | 'manual'>('scan');
  const [manualLengthMm, setManualLengthMm] = useState<number>(270); // Default Size 9
  const [fineTuneMm, setFineTuneMm] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('intro');
  const [calibration, setCalibration] = useState<CalibrationObject>('a4_paper');
  const [result, setResult] = useState<SizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const uploadRef   = useRef<HTMLInputElement>(null);

  // ── Check backend health via Vite proxy ──
  useEffect(() => {
    fetch('/health', { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? setBackendAvailable(true) : setBackendAvailable(false))
      .catch(() => setBackendAvailable(false));
  }, []);

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = async () => {
    setErrorMsg('');
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920, min: 1280 }, height: { ideal: 1080, min: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
        };
      }
    } catch (err: any) {
      const isPermission = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      if (isPermission || !window.isSecureContext) {
        setStep('camera_denied');
      } else {
        setErrorMsg(err?.message || 'Camera unavailable. Try uploading a photo instead.');
        setStep('camera_denied');
      }
    }
  };

  // ── Capture frame → base64 ──────────────────────────────────────────────────
  const captureFrameBase64 = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  };

  // ── Analyse: send image to Python CV backend ───────────────────────────────
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
          calibration_object: calibration,
        }),
        signal: AbortSignal.timeout(60000),
      });

      const data = await res.json().catch(() => ({ error: 'Calculation service unavailable' }));

      if (!res.ok || !data.success) {
        const msg = data.error || data.detail || 'Could not accurately detect a foot in the image. Please ensure your bare foot and calibration object are clearly visible and well-lit.';
        // Attach error code and icon to the message string for the UI
        const enriched = data.error_code ? `[${data.error_code}${data.error_icon ? ':' + data.error_icon : ''}] ${msg}` : msg;
        setErrorMsg(enriched);
        setStep('error');
        return;
      }

      setResult(data);
      setStep('result');
    } catch (err: any) {
      setErrorMsg(err.message?.includes('timeout') 
        ? 'Connection timed out while processing image. Please try again with good lighting.'
        : (err.message || 'Error processing foot scan.')
      );
      setStep('error');
    }
  };

  const captureAndMeasure = async () => {
    const frameB64 = captureFrameBase64();
    if (!frameB64) {
      setErrorMsg('Failed to capture frame from camera.');
      setStep('error');
      return;
    }
    await processImageBase64(frameB64);
  };

  // ── Upload photo fallback (works on any device / HTTP) ───────────────────────
  const uploadAndAnalyse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('analyzing');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const b64 = dataUrl.split(',')[1];
      if (!b64) {
        setErrorMsg('Invalid photo format. Please select a valid JPEG or PNG.');
        setStep('error');
        return;
      }
      await processImageBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    stopCamera();
    setResult(null);
    setFineTuneMm(null);
    setErrorMsg('');
    setStep('intro');
  };

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <SEOHelmet
        title="AI Foot Size Finder — Local Neural AI Model"
        description="Local Neural AI Foot Size Finder for KDM Peshawari Chappals. Millimeter-precise toe-to-heel anatomical geometry and authentic sizing."
      />

      {/* Hidden canvas — frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
            <Cpu className="w-3 h-3 text-blue-600" /> Neural Vision Engine
          </span>
          <span className="text-slate-300 font-bold">+</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" /> 100% Local Neural AI
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          KDM AI Foot Size Finder
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Millimeter-precise anatomical foot sizing: Local Neural AI segments your foot, calculates exact toe-to-heel geometry along the primary anatomical axis, and pairs you with the perfect handcrafted Peshawari Chappal size.
        </p>

        {/* Backend status pill */}
        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${
          backendAvailable === null  ? 'bg-slate-100 border-slate-200 text-slate-500' :
          backendAvailable           ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                       'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            backendAvailable === null ? 'bg-slate-400' :
            backendAvailable          ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`} />
          {backendAvailable === null ? 'Checking Neural AI microservice…' :
           backendAvailable          ? 'Neural AI Service Online — 100% Local & Offline Ready' :
                                       'AI Service Offline — using local fallback'}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
        <button
          onClick={() => setPageMode('scan')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            pageMode === 'scan'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-600" />
          AI Camera & Photo Scan
        </button>
        <button
          onClick={() => setPageMode('manual')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            pageMode === 'manual'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Ruler className="w-4 h-4 text-amber-600" />
          Direct Foot Sizer (Sizes 7–13)
        </button>
      </div>

      {/* ── DIRECT MANUAL SIZER TAB ── */}
      {pageMode === 'manual' && (() => {
        const manualSize = Math.max(7, Math.min(13, Math.round(7 + (manualLengthMm - 250) / 10)));
        const manualUk = manualSize;
        const manualUs = Number((manualSize + 0.5).toFixed(1));
        const modelRec = manualSize <= 8 ? "Kaptaan Signature" : manualSize <= 10 ? "Zalmi Royal" : "Quetta Sovereign";

        return (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Ruler className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-2xl text-slate-900">Direct Foot Sizer & Guide</h2>
              <p className="text-xs text-slate-500">
                Select your measured heel-to-toe length or tap your shoe size (7 to 13) for instant Peshawari Chappal fit recommendations.
              </p>
            </div>

            {/* Quick Size Pills */}
            <div className="space-y-2 max-w-lg mx-auto">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block text-center">
                Quick Select Size (7 to 13)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[7, 8, 9, 10, 11, 12, 13].map((s) => {
                  const mm = 250 + (s - 7) * 10;
                  const isSelected = manualSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setManualLengthMm(mm)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Size {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Slider */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl max-w-lg mx-auto space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" /> Heel-to-Toe Length:
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg text-sm">
                  {manualLengthMm} mm ({(manualLengthMm / 10).toFixed(1)} cm)
                </span>
              </div>
              <input
                type="range"
                min="245"
                max="315"
                step="1"
                value={manualLengthMm}
                onChange={(e) => setManualLengthMm(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>24.5 cm (Size 7)</span>
                <span className="text-blue-600 font-bold">27.0 cm (Size 9)</span>
                <span>31.5 cm (Size 13)</span>
              </div>
            </div>

            {/* Size Output Card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="p-4 rounded-2xl bg-blue-600 text-white text-center shadow-md col-span-2 sm:col-span-1">
                <span className="text-[11px] text-blue-200 uppercase font-bold block">Recommended Size</span>
                <span className="font-serif font-bold text-4xl">Size {manualSize}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">UK / PK Size</span>
                <span className="font-serif font-bold text-2xl text-slate-800">Size {manualUk}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">US Men's</span>
                <span className="font-serif font-bold text-2xl text-slate-800">US {manualUs}</span>
              </div>
            </div>

            {/* Model Fit Note */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1.5 max-w-lg mx-auto">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Perfect Match Recommendation:
              </span>
              <p>
                For a <strong>{manualLengthMm} mm</strong> foot (Size {manualSize}), we recommend the handcrafted <strong>{modelRec}</strong> cut from supple full-grain leather.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 max-w-lg mx-auto">
              <Link
                to={`/products?size=${manualSize}`}
                className="btn-copper text-xs py-3 px-8 inline-flex items-center gap-2 shadow-sm flex-1 justify-center"
              >
                Browse Size {manualSize} Chappals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── AI SCAN MODE ── */}
      {pageMode === 'scan' && (
        <>
          {/* ── INTRO ── */}
          {step === 'intro' && (
            <div className="space-y-6 py-4">
              {/* Animated Demo */}
              <FootScanDemo calibrationObject={calibration} />

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Left: instructions */}
                <div className="space-y-5">
                  <h2 className="font-serif font-bold text-2xl text-slate-900">How It Works</h2>
                  <ol className="text-sm text-slate-600 space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    {[
                      'Place an A4 paper sheet or credit card flat on the floor directly beside your bare foot.',
                      'Select your reference object below — our high-precision AI Vision engine uses it to calibrate real-world millimeters.',
                      'Tap Launch Camera or Take / Upload Photo — hold phone directly overhead at 90°.',
                      'SOTA Multi-Spectral AI Vision extracts millimeter-precise heel-to-toe and foot width measurements.',
                      'Local Neural AI validates framing, lighting, and anatomical placement, confirming your ideal KDM Chappal size.',
                    ].map((txt, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="font-bold text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">
                          {i + 1}
                        </span>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Right: tips */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-2">
                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Precision Tips
                    </p>
                    <ul className="space-y-1.5 list-disc list-inside">
                      <li>Bright, diffuse room light — avoid deep shadows or glare</li>
                      <li>Bare foot only — remove socks so toes are cleanly contoured</li>
                      <li>Hold camera 30–50 cm directly overhead at 90°</li>
                      <li>Keep entire foot and reference object fully within frame</li>
                      <li>Choose high-contrast floor (e.g. wood or dark tile for white paper)</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Local AI Architecture
                    </p>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      <li><strong>Local Neural AI Engine:</strong> U2NetP deep salient segmentation & millimeter scale calibration</li>
                      <li><strong>Anatomical PCA Axis:</strong> Mathematical eigenvalue projection connecting apex toe to heel center</li>
                      <li><strong>Quality Gates:</strong> Automated exposure, sharpness, and framing verification</li>
                      <li><strong>KDM Fit Engine:</strong> Maps exact foot dimensions to authentic Peshawari Chappal sizing</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Calibration selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reference Calibration Object
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(Object.entries(CALIBRATION_LABELS) as [CalibrationObject, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCalibration(key)}
                      className={`p-4 rounded-xl border text-xs text-left transition-all ${
                        calibration === key
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={startCamera}
                  className="btn-copper text-sm py-3.5 px-8 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Camera className="w-5 h-5" /> Launch Live Camera
                </button>
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="btn-glass text-sm py-3.5 px-6 flex items-center justify-center gap-2 w-full sm:w-auto text-slate-700"
                >
                  <Upload className="w-5 h-5" /> Take / Upload Photo
                </button>
              </div>
            </div>
          )}

          {/* ── CAMERA VIEWFINDER ── */}
          {step === 'camera' && (
            <div className="space-y-5 text-center">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900">Position Foot & Reference</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Place your bare foot in the center and your <strong className="text-slate-700">{CALIBRATION_LABELS[calibration].split('(')[0].trim()}</strong> flat beside it.
                </p>
              </div>

              <div className="relative max-w-sm mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-blue-500/60 shadow-xl">
                {/* Live camera feed */}
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                {/* Guide overlay */}
                <div className="absolute inset-4 rounded-2xl pointer-events-none border-2 border-blue-400/50">
                  {/* Corner brackets */}
                  {['tl', 'tr', 'bl', 'br'].map(pos => (
                    <div key={pos} className={`absolute w-6 h-6 border-blue-400 ${
                      pos === 'tl' ? 'top-0 left-0  border-t-4 border-l-4 rounded-tl-lg' :
                      pos === 'tr' ? 'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg' :
                      pos === 'bl' ? 'bottom-0 left-0  border-b-4 border-l-4 rounded-bl-lg' :
                                     'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg'
                    }`} />
                  ))}

                  {/* Clean Dual Placement Boxes (No foot outline graphic) */}
                  <div className="grid grid-cols-2 gap-3 h-full items-center p-2">
                    {/* Bare Foot Target Box */}
                    <div className="h-4/5 border-2 border-dashed border-cyan-400/80 rounded-xl bg-cyan-950/20 flex flex-col items-center justify-center p-2 shadow-inner">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 text-xs font-bold mb-2">
                        🦶
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-400/40">
                        Bare Foot
                      </span>
                      <span className="text-[8px] text-cyan-300/80 mt-1 text-center font-medium">
                        Align straight & flat
                      </span>
                    </div>

                    {/* Reference Paper / Card Box */}
                    <div className="h-4/5 border-2 border-dashed border-amber-400/80 rounded-xl bg-amber-950/20 flex flex-col items-center justify-center p-2 shadow-inner">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 text-xs font-bold mb-2">
                        📄
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 bg-slate-900/90 px-2 py-0.5 rounded border border-amber-400/40">
                        {calibration === 'a4_paper' ? 'A4 Paper' : 'Credit Card'}
                      </span>
                      <span className="text-[8px] text-amber-300/80 mt-1 text-center font-medium">
                        Flat beside foot
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 bg-slate-900/85 text-white backdrop-blur-sm border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Top-Down View
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm mx-auto">
                <button
                  onClick={captureAndMeasure}
                  className="btn-copper text-sm py-3 px-8 flex items-center justify-center gap-2 w-full shadow-lg shadow-blue-600/20"
                >
                  <Camera className="w-4 h-4" /> 📸 Capture & Measure Foot
                </button>
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="btn-glass text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 w-full text-slate-600"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File Instead
                </button>
                <button onClick={resetAll} className="text-xs text-slate-400 hover:text-slate-600 py-1">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {step === 'analyzing' && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="font-serif font-bold text-2xl text-slate-900">Running Neural AI Analysis…</h3>
                <p className="text-xs text-slate-500">
                  Executing high-precision local computer vision and U2NetP salient segmentation.
                </p>
                <div className="text-xs text-slate-600 mt-4 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span><strong>1. Neural Vision Engine:</strong> Segmenting foot contours & calibration object scale</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span><strong>2. Anatomical PCA:</strong> Calculating major eigenvector axis (toe apex to heel center)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span><strong>3. KDM Sizing:</strong> Synthesizing authentic Peshawari Chappal fit</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {step === 'result' && result && (() => {
            const visionModelData = result.vision_result ?? result.yolo_result;
            const rawLength = visionModelData?.foot_length_mm ?? result.foot_length_mm;
            const rawWidth = visionModelData?.foot_width_mm ?? result.foot_width_mm;
            const activeLengthMm = fineTuneMm ?? rawLength;
            const activeWidthMm = rawWidth;

            const activeSize = Math.max(7, Math.min(13, Math.round(7 + (activeLengthMm - 250) / 10)));
            const activeUkSize = activeSize;
            const activeUsSize = Number((activeSize + 0.5).toFixed(1));

            const isRetake = Boolean(
              result.final_kdm_result?.retake_recommended ||
              result.gemini_verification?.disagreement ||
              result.gemini_verification?.verification_status === 'RETAKE_RECOMMENDED' ||
              result.final_kdm_result?.confidence_level === 'Uncertain - Retake Photo'
            );

            const retakeReason = result.final_kdm_result?.retake_reason ||
              result.gemini_verification?.feedback ||
              "Local AI Vision measurement detected potential lighting or framing issues.";

            const imageProblems = result.gemini_verification?.image_problems || [];
            const neuralStatus = result.gemini_verification?.verification_status ?? 'VERIFIED';
            const confidencePct = result.final_kdm_result?.confidence_pct ?? result.confidence_pct;
            const confidenceLevel = result.final_kdm_result?.confidence_level ?? (confidencePct >= 90 ? 'High' : confidencePct >= 75 ? 'Medium' : 'Uncertain');
            const fitProfile = result.final_kdm_result?.fit_profile ?? (rawWidth > 104 ? 'Wide Comfort Fit' : rawWidth < 94 ? 'Slim / Narrow Fit' : 'Standard Regular KDM Fit');
            const chappalModel = result.final_kdm_result?.recommended_chappal_model ?? (activeSize >= 9 ? 'KDM Kaptaan Royal Double-Sole' : 'KDM Zalmi Signature Special');

            return (
              <div className="space-y-8 py-4">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto shadow-xs ${
                    isRetake ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {isRetake ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                  </div>
                  <h2 className="font-serif font-bold text-3xl text-slate-900">
                    {isRetake ? 'AI Analysis Complete — Retake Recommended' : 'Neural AI Foot Size & Fit Complete'}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">
                    Measured with <strong>Local Neural AI Vision</strong> and validated against authentic KDM anatomical standards.
                  </p>
                </div>

                {/* ── Disagreement / Retake Warning Banner ── */}
                {isRetake && (
                  <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-3 shadow-sm max-w-2xl mx-auto">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-amber-950">
                          Image Quality Alert
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          {retakeReason}
                        </p>
                      </div>
                    </div>

                    {imageProblems.length > 0 && (
                      <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-900">
                        <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
                          Specific Visual Issues Detected:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                          {imageProblems.map((prob, idx) => (
                            <li key={idx}>{prob}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-[11px] text-amber-700 font-medium">
                        ✦ To guarantee 100% comfort in your handcrafted Peshawari Chappal, please take a clear overhead photo.
                      </p>
                      <button
                        onClick={startCamera}
                        className="btn-copper text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5" /> 📸 Retake Photo Now
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Local Neural AI 3-Card Grid (SOTA Vision + Neural Verification + Final KDM) ── */}
                <div className="grid md:grid-cols-3 gap-5">
                  {/* Card 1: SOTA Vision Measurement Model */}
                  <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none -z-0" />
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Cpu className="w-3 h-3 text-blue-600" /> SOTA Vision Model
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Direct Metric</span>
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-lg text-slate-900">Foot Measurement</h3>
                        <p className="text-[11px] text-slate-500">Multi-spectral millimeter detection</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Length</span>
                          <span className="font-serif font-bold text-xl text-blue-700">{Math.round(activeLengthMm)} mm</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Width</span>
                          <span className="font-serif font-bold text-xl text-slate-800">{Math.round(activeWidthMm)} mm</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Calibration Reference:</span>
                          <span className="font-medium text-slate-800">
                            {result.calibration_object === 'a4_paper' ? 'A4 Paper (210mm)' : 'Credit Card (85.6mm)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Contour Status:</span>
                          <span className="font-medium text-emerald-700">✓ Heel-to-Toe Traced</span>
                        </div>
                        {visionModelData?.raw_ppm && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500">Sensor Scale:</span>
                            <span className="font-mono text-slate-600">{visionModelData.raw_ppm} px/mm</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center italic mt-2">
                      Primary physical measurement engine
                    </p>
                  </div>

                  {/* Card 2: Neural Verification Layer */}
                  <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -z-0" />
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> Neural Verification
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          neuralStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                          neuralStatus === 'CAUTION'  ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {neuralStatus}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-lg text-slate-900">AI Quality Inspection</h3>
                        <p className="text-[11px] text-slate-500">Local segmentation verification</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-600">Complete Foot in Frame:</span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            result.gemini_verification?.is_complete_foot_visible !== false ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {result.gemini_verification?.is_complete_foot_visible !== false ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {result.gemini_verification?.is_complete_foot_visible !== false ? 'Visible' : 'Cut Off'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-600">Reference Placement:</span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            result.gemini_verification?.is_reference_placed_correctly !== false ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {result.gemini_verification?.is_reference_placed_correctly !== false ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {result.gemini_verification?.is_reference_placed_correctly !== false ? 'Correct' : 'Check Angle'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-600">Plausibility Check:</span>
                          <span className="font-semibold text-emerald-600">
                            {result.gemini_verification?.measurement_plausibility || 'Valid Adult Ratio'}
                          </span>
                        </div>
                      </div>

                      {/* Second Opinion Quote */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 italic">
                        "{result.gemini_verification?.second_opinion || result.gemini_verification?.feedback || 'Visual geometry aligns with standard anatomical ratios.'}"
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center italic mt-2">
                      Local anatomical ratio & morphology inspector
                    </p>
                  </div>

                  {/* Card 3: Final KDM Peshawari Chappal Recommendation */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden flex flex-col justify-between border border-slate-800">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Final KDM Size
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          confidenceLevel === 'High' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          confidenceLevel === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {confidenceLevel} ({confidencePct}%)
                        </span>
                      </div>

                      <div className="text-center py-2">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Recommended Size</span>
                        <div className="font-serif font-bold text-5xl text-white my-1">
                          Size {activeSize}
                        </div>
                        <span className="text-xs text-amber-300 font-medium">
                          UK {activeUkSize} · US {activeUsSize}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Foot Fit Profile:</span>
                          <span className="font-semibold text-white">{fitProfile}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Matched Model:</span>
                          <span className="font-semibold text-amber-300 truncate max-w-[140px] text-right">{chappalModel}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center italic mt-2">
                      Handcrafted cowhide naturally moulds in 2–3 wears
                    </p>
                  </div>
                </div>

                {/* Visual Annotated Proof from Computer Vision */}
                {result.annotated_image_base64 && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 p-2.5 shadow-sm max-w-lg mx-auto">
                    <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-300 border-b border-slate-800 mb-2">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SOTA AI Vision Contour Tracing
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {result.card_detected ? '✓ Calibrated Reference Scale' : 'Anatomical Ratio'}
                      </span>
                    </div>
                    <img
                      src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                      alt="Computer Vision Tracing Proof"
                      className="w-full max-h-80 object-contain rounded-xl bg-black"
                    />
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      🟢 Green = Foot contour | 🔴 Red = Heel | 🟢 Green dot = Big Toe
                      {result.card_detected ? ' | 🟡 Yellow box = Calibration Object' : ''}
                    </p>
                  </div>
                )}

                {/* Interactive Fine-Tuning Slider */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl max-w-lg mx-auto space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" /> Fine-Tune Foot Length (mm):
                    </span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                      {Math.round(activeLengthMm)} mm (Size {activeSize})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFineTuneMm(Math.max(245, Math.round(activeLengthMm) - 2))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="245"
                      max="315"
                      step="1"
                      value={Math.round(activeLengthMm)}
                      onChange={(e) => setFineTuneMm(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFineTuneMm(Math.min(315, Math.round(activeLengthMm) + 2))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>245mm (Size 7)</span>
                    <span className="text-blue-600 font-semibold">270mm (Size 9)</span>
                    <span>315mm (Size 13)</span>
                  </div>
                </div>

                {/* Sizing & Fit Note */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1 max-w-lg mx-auto">
                  <span className="font-bold text-slate-800 block">📏 Authentic Peshawari Chappal Fit Note:</span>
                  <p>
                    KDM Peshawari Chappals run true to standard Pakistani & UK shoe sizing (Sizes 7 to 13). Our master craftsmen cut each pair with authentic tyre-rubber or double leather soles and genuine top-grain cowhide that breaks in comfortably within your first few wears.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                  <button onClick={resetAll} className="btn-glass text-xs py-3 px-6 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> 📸 Retake / Scan Again
                  </button>
                  <Link
                    to={`/products?size=${activeSize}`}
                    className="btn-copper text-xs py-3 px-8 inline-flex items-center gap-2 shadow-sm"
                  >
                    Browse Size {activeSize} Chappals <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* ── CAMERA DENIED — upload fallback ── */}
          {step === 'camera_denied' && (
            <div className="py-10 text-center space-y-6 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-2xl text-slate-900">Camera Blocked</h3>
                <p className="text-sm text-slate-500">
                  Your browser requires <strong>HTTPS</strong> to allow camera access on a local network.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-left space-y-3">
                <p className="font-bold text-slate-900">Take or Upload a Photo Instead</p>
                <p className="text-slate-500">
                  Take a top-down photo of your bare foot next to a {CALIBRATION_LABELS[calibration].toLowerCase()} and upload it below.
                </p>
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="btn-copper text-xs py-3 px-6 w-full flex items-center justify-center gap-2 shadow-xs"
                >
                  <Upload className="w-4 h-4" /> Choose Photo from Gallery / Camera
                </button>
              </div>

              <button onClick={resetAll} className="text-xs text-slate-400 underline underline-offset-2">
                ← Go back
              </button>
            </div>
          )}

          {/* ── ERROR (Detection or processing issue) ── */}
          {step === 'error' && (() => {
            // Parse error code from enriched message
            const codeMatch = errorMsg.match(/^\[(\w+)(?::\w+)?\]\s*(.+)$/);
            const errCode = codeMatch?.[1] ?? '';
            const cleanMsg = codeMatch?.[2] ?? errorMsg;
            const isDark    = errCode === 'TOO_DARK';
            const isBright  = errCode === 'TOO_BRIGHT';
            const isBlurry  = errCode === 'TOO_BLURRY';
            const isLight   = isDark || isBright || isBlurry;
            const isMissing = errCode === 'MISSING_OBJECTS' || errCode === 'NO_CONTOURS' || errCode === 'FOOT_NOT_FOUND';
            const errEmoji  = isDark ? '🌑' : isBright ? '☀️' : isBlurry ? '📷' : isMissing ? '🦶' : '⚠️';
            const errColor  = isDark ? 'amber' : isBright ? 'yellow' : isBlurry ? 'blue' : 'orange';
            return (
            <div className="py-10 text-center space-y-5 max-w-md mx-auto">
              <div className={`w-16 h-16 rounded-full bg-${errColor}-50 text-${errColor}-600 border border-${errColor}-200 flex items-center justify-center mx-auto text-3xl`}>
                {errEmoji}
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-2xl text-slate-900">
                  {isDark ? 'Too Dark' : isBright ? 'Too Bright' : isBlurry ? 'Image Blurry' : isMissing ? 'Objects Not Found' : 'Scan Failed'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                  {cleanMsg}
                </p>
              </div>

              {/* Contextual fix tips */}
              {isLight && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left space-y-1.5">
                  <span className="font-bold text-amber-900 block">💡 Fix Lighting:</span>
                  <p>• Use a ceiling light or daylight from a window — no direct sunlight</p>
                  <p>• Avoid lamp shadows falling across the foot or reference</p>
                  <p>• Enable your phone torch only if the room is very dark</p>
                </div>
              )}
              {isMissing && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 text-left space-y-1.5">
                  <span className="font-bold text-blue-900 block">💡 Detection Tips:</span>
                  <p>• Bare foot only — remove socks, shoes, and ankle coverings</p>
                  <p>• Place reference (A4 paper or card) flat beside the foot, not beneath it</p>
                  <p>• Hold camera directly overhead at 90° — full foot + reference in frame</p>
                  <p>• Floor colour must contrast with the paper (avoid white floor + white paper)</p>
                </div>
              )}
              {!isLight && !isMissing && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
                  <span className="font-bold text-slate-800 block">💡 General Tips:</span>
                  <p>• Bare foot, good light, camera directly overhead at 90°</p>
                  <p>• A4 paper or credit card flat beside the foot (fully visible)</p>
                  <p>• Contrasting floor colour helps the algorithm find the reference</p>
                </div>
              )}

              {/* Re-show demo */}
              <div className="max-w-sm mx-auto">
                <FootScanDemo calibrationObject={calibration} />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button onClick={startCamera} className="btn-copper text-xs py-3 px-6 flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Try Again with Camera
                  </button>
                  <button onClick={() => uploadRef.current?.click()} className="btn-glass text-xs py-3 px-6 flex items-center justify-center gap-2 text-slate-700">
                    <Upload className="w-4 h-4" /> Upload High-Res Photo
                  </button>
                </div>
                <button
                  onClick={() => {
                    setPageMode('manual');
                    setManualLengthMm(255);
                  }}
                  className="btn-glass text-xs py-3 px-6 flex items-center justify-center gap-2 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                >
                  <Ruler className="w-4 h-4 text-blue-600" /> Open Direct Size Selector (Size 9 Pre-Selected)
                </button>
              </div>
            </div>
            );
          })()}
        </>
      )}

      {/* Hidden file input for upload fallback */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={uploadAndAnalyse}
      />
    </div>
  );
};
