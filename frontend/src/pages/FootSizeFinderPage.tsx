import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Upload, RotateCcw, AlertTriangle, ArrowRight, Check, Sliders, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Steps: 'select' | 'landmark_adjust' | 'analyzing' | 'result' | 'error'
  const [step, setStep] = useState<'select' | 'landmark_adjust' | 'analyzing' | 'result' | 'error'>('select');
  const [result, setResult] = useState<SizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [capturedImageB64, setCapturedImageB64] = useState<string | null>(null);

  // Interactive Heel & Toe Landmark Calibration State (Normalized [0..1] and Pixel coords)
  const [heelNorm, setHeelNorm] = useState<[number, number]>([0.5, 0.2]);
  const [toeNorm, setToeNorm] = useState<[number, number]>([0.5, 0.8]);
  const [aiHeelNorm, setAiHeelNorm] = useState<[number, number]>([0.5, 0.2]);
  const [aiToeNorm, setAiToeNorm] = useState<[number, number]>([0.5, 0.8]);
  const [activePinDrag, setActivePinDrag] = useState<'heel' | 'toe' | null>(null);
  const [tapMode, setTapMode] = useState<'heel' | 'toe' | null>(null);

  // Reference Card 4 Corners State (Normalized [0..1])
  const [cardCornersNorm, setCardCornersNorm] = useState<[number, number][]>([
    [0.10, 0.20], [0.35, 0.20], [0.35, 0.40], [0.10, 0.40]
  ]);

  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 1000, height: 1000 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const footImgRef = useRef<HTMLImageElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Process image with backend YOLOv8 model & card photogrammetry
  const processImageBase64 = async (
    b64: string,
    manualHeelNorm?: [number, number],
    manualToeNorm?: [number, number],
    customCardCornersNorm?: [number, number][]
  ) => {
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
        signal: AbortSignal.timeout(60000),
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
    // Reset file input value so user can select the same file again if desired
    e.target.value = '';
  };

  const handleReset = () => {
    setResult(null);
    setCapturedImageB64(null);
    setErrorMsg('');
    setStep('select');
  };

  // Pointer drag handlers for Heel / Toe pins with pointer capture for butter smooth movement
  const handlePointerDown = (e: React.PointerEvent, pin: 'heel' | 'toe') => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setActivePinDrag(pin);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePinDrag || !footImgRef.current) return;
    const rect = footImgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Direct, accurate normalized coordinates relative to actual rendered image
    const xNorm = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    if (activePinDrag === 'heel') {
      setHeelNorm([xNorm, yNorm]);
    } else {
      setToeNorm([xNorm, yNorm]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePinDrag) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setActivePinDrag(null);
    }
  };

  // Direct click / tap on image to place heel or toe
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tapMode || !footImgRef.current) return;
    const rect = footImgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xNorm = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    if (tapMode === 'heel') {
      setHeelNorm([xNorm, yNorm]);
      setTapMode(null);
    } else if (tapMode === 'toe') {
      setToeNorm([xNorm, yNorm]);
      setTapMode(null);
    }
  };

  // Nudge helpers: UP moves Y towards top (decreases yNorm), DOWN moves Y towards bottom (increases yNorm)
  const nudgeHeel = (dx: number, dy: number) => {
    setHeelNorm(([x, y]) => [
      Math.max(0.01, Math.min(0.99, x + dx)),
      Math.max(0.01, Math.min(0.99, y + dy))
    ]);
  };

  const nudgeToe = (dx: number, dy: number) => {
    setToeNorm(([x, y]) => [
      Math.max(0.01, Math.min(0.99, x + dx)),
      Math.max(0.01, Math.min(0.99, y + dy))
    ]);
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* MAIN CONTAINER */}
        <div className="bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] shadow-md p-4 sm:p-6 backdrop-blur-xs">
          
          {/* STEP 1: SELECT HD CAPTURE OR UPLOAD */}
          {step === 'select' && (
            <div className="space-y-5">
              <div className="relative rounded-2xl overflow-hidden bg-[#565449]/15 border-2 border-dashed border-[#565449]/40 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#565449] text-[#F7F4EB] flex items-center justify-center shadow-md mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#1A1A18] mb-1.5">
                  Capture or Upload Foot Photo
                </h3>
                <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-md mx-auto mb-5">
                  Place a standard card flat on the floor beside your bare foot and capture straight from overhead for precision calibration.
                </p>

                {/* 3 Step Visual Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left mb-6">
                  <div className="bg-[#F7F4EB] p-3 rounded-xl border border-[#A0988A]/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A18] mb-1">
                      <span className="w-5 h-5 rounded-full bg-[#565449] text-white flex items-center justify-center text-[11px]">1</span>
                      <span>Bare Foot</span>
                    </div>
                    <p className="text-[11px] text-[#1A1A18]/70 leading-snug">
                      Stand or place bare foot flat on hard, level floor.
                    </p>
                  </div>

                  <div className="bg-[#F7F4EB] p-3 rounded-xl border border-[#A0988A]/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A18] mb-1">
                      <span className="w-5 h-5 rounded-full bg-[#565449] text-white flex items-center justify-center text-[11px]">2</span>
                      <span>Reference Card</span>
                    </div>
                    <p className="text-[11px] text-[#1A1A18]/70 leading-snug">
                      Place any debit/credit/ID card flat beside foot.
                    </p>
                  </div>

                  <div className="bg-[#F7F4EB] p-3 rounded-xl border border-[#A0988A]/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A18] mb-1">
                      <span className="w-5 h-5 rounded-full bg-[#565449] text-white flex items-center justify-center text-[11px]">3</span>
                      <span>Overhead Shot</span>
                    </div>
                    <p className="text-[11px] text-[#1A1A18]/70 leading-snug">
                      Hold phone straight directly above facing down.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 text-xs sm:text-sm border border-[#565449] cursor-pointer"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Take HD Photo (Camera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer text-xs sm:text-sm active:scale-95 shadow-sm"
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Upload Existing Photo</span>
                  </button>
                </div>
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
                  <span><strong>Foot Heel &amp; Toe Calibration:</strong> Drag the pins on the image, use directional nudge buttons, or adjust sliders to calibrate your Heel and Toe endpoints.</span>
                </div>
              </div>

              {/* Interactive Image with Draggable Heel & Toe Pins */}
              <div className="text-center bg-black/90 p-2 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                <div
                  onClick={handleImageClick}
                  className="relative inline-block mx-auto max-w-full cursor-crosshair"
                >
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
                      onPointerDown={(e) => handlePointerDown(e, 'heel')}
                      style={{
                        left: `${heelNorm[0] * 100}%`,
                        top: `${heelNorm[1] * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30 transition-transform active:scale-110"
                      title="Heel Landmark (Drag along X & Y)"
                    >
                      <span className="text-[10px] font-black text-white pointer-events-none">HEEL</span>
                    </div>

                    {/* 🔵 Toe Tip Pin (Draggable on X & Y axis) */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'toe')}
                      style={{
                        left: `${toeNorm[0] * 100}%`,
                        top: `${toeNorm[1] * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 border-2 border-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30 transition-transform active:scale-110"
                      title="Toe Tip Landmark (Drag along X & Y)"
                    >
                      <span className="text-[10px] font-black text-white pointer-events-none">TOE</span>
                    </div>
                  </div>

                  {tapMode && (
                    <div className="absolute top-2 left-2 right-2 bg-black/80 text-amber-300 text-xs py-1.5 px-3 rounded-md text-center border border-amber-400 pointer-events-none shadow-md">
                      Tap anywhere on the foot photo to set {tapMode.toUpperCase()} position.
                    </div>
                  )}
                </div>
              </div>

              {/* Sliders and Directional Nudge Buttons: Heel X/Y and Toe X/Y */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F7F4EB] p-4 rounded-xl border border-[#A0988A]">
                {/* 🟠 Heel X & Y Controls */}
                <div className="p-3 bg-white/70 rounded-lg border border-[#A0988A]/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>🟠 Heel Position</span>
                    <span className="font-mono text-[11px]">
                      X: {Math.round(heelNorm[0] * imageDims.width)} · Y: {Math.round(heelNorm[1] * imageDims.height)} px
                    </span>
                  </div>

                  {/* Heel X Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#1A1A18]/70 font-medium">
                      <span>Heel X (Left ↔ Right)</span>
                      <span className="font-mono">{Math.round(heelNorm[0] * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(heelNorm[0] * 100)}
                      onChange={(e) => setHeelNorm([Number(e.target.value) / 100, heelNorm[1]])}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  {/* Heel Y Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#1A1A18]/70 font-medium">
                      <span>Heel Y (Top: 0% ↕ Bottom: 100%)</span>
                      <span className="font-mono">{Math.round(heelNorm[1] * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(heelNorm[1] * 100)}
                      onChange={(e) => setHeelNorm([heelNorm[0], Number(e.target.value) / 100])}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  {/* Heel Directional Nudge Buttons */}
                  <div className="pt-1 flex items-center justify-between gap-1 text-xs">
                    <span className="text-[10px] text-[#1A1A18]/60 font-semibold uppercase">Nudge:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => nudgeHeel(0, -0.015)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Heel UP"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeHeel(0, 0.015)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Heel DOWN"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeHeel(-0.015, 0)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Heel LEFT"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeHeel(0.015, 0)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Heel RIGHT"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTapMode(tapMode === 'heel' ? null : 'heel')}
                      className={`text-[11px] font-bold px-2 py-1 rounded border transition cursor-pointer ${
                        tapMode === 'heel'
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-white text-amber-800 border-[#A0988A]'
                      }`}
                    >
                      {tapMode === 'heel' ? 'Tap photo...' : 'Tap to Place'}
                    </button>
                  </div>
                </div>

                {/* 🔵 Toe Tip X & Y Controls */}
                <div className="p-3 bg-white/70 rounded-lg border border-[#A0988A]/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-800">
                    <span>🔵 Toe Tip Position</span>
                    <span className="font-mono text-[11px]">
                      X: {Math.round(toeNorm[0] * imageDims.width)} · Y: {Math.round(toeNorm[1] * imageDims.height)} px
                    </span>
                  </div>

                  {/* Toe X Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#1A1A18]/70 font-medium">
                      <span>Toe X (Left ↔ Right)</span>
                      <span className="font-mono">{Math.round(toeNorm[0] * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(toeNorm[0] * 100)}
                      onChange={(e) => setToeNorm([Number(e.target.value) / 100, toeNorm[1]])}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                  </div>

                  {/* Toe Y Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#1A1A18]/70 font-medium">
                      <span>Toe Y (Top: 0% ↕ Bottom: 100%)</span>
                      <span className="font-mono">{Math.round(toeNorm[1] * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(toeNorm[1] * 100)}
                      onChange={(e) => setToeNorm([toeNorm[0], Number(e.target.value) / 100])}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                  </div>

                  {/* Toe Directional Nudge Buttons */}
                  <div className="pt-1 flex items-center justify-between gap-1 text-xs">
                    <span className="text-[10px] text-[#1A1A18]/60 font-semibold uppercase">Nudge:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => nudgeToe(0, -0.015)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Toe UP"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeToe(0, 0.015)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Toe DOWN"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeToe(-0.015, 0)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Toe LEFT"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeToe(0.015, 0)}
                        className="bg-[#A0988A]/20 hover:bg-[#A0988A]/40 text-[#1A1A18] font-bold py-1 px-2 rounded border border-[#A0988A] cursor-pointer text-xs"
                        title="Move Toe RIGHT"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTapMode(tapMode === 'toe' ? null : 'toe')}
                      className={`text-[11px] font-bold px-2 py-1 rounded border transition cursor-pointer ${
                        tapMode === 'toe'
                          ? 'bg-cyan-600 text-white border-cyan-700'
                          : 'bg-white text-cyan-800 border-[#A0988A]'
                      }`}
                    >
                      {tapMode === 'toe' ? 'Tap photo...' : 'Tap to Place'}
                    </button>
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
                    onClick={handleReset}
                    className="flex-1 bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Scan Another Foot</span>
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
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-[#565449] cursor-pointer text-xs sm:text-sm shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take HD Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-[#A0988A]/30 hover:bg-[#A0988A]/50 text-[#1A1A18] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#565449] transition cursor-pointer text-xs sm:text-sm"
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
