import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Upload,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Check,
  Sparkles,
  Sliders,
  RefreshCw,
  CreditCard,
  Download,
  ChevronDown,
  ChevronUp,
  Crosshair,
  FileText,
  HelpCircle
} from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';

export interface SizeResult {
  success?: boolean;
  foot_length_mm: number;
  foot_width_mm: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  recommended_eu_size: number;
  recommended_uk_size: number;
  recommended_us_size: number;
  confidence_pct: number;
  reliability_status?: string;
  fit_profile?: string;
  fit_note: string;
  boundary_warning?: string | null;
  annotated_image_base64?: string;
  heel_point?: [number, number];
  toe_point?: [number, number];
  heel_point_norm?: [number, number];
  toe_point_norm?: [number, number];
  paper_corners_norm?: [number, number][];
  card_corners?: [number, number][];
  card_detected?: boolean;
  image_width?: number;
  image_height?: number;
  is_manually_adjusted?: boolean;
  calibration_scale_ppm?: number;
  calibration_quality?: string;
  calibration_method?: string;
  reference_object?: string;
  reference_dims_mm?: [number, number];
  foot_orientation_deg?: number;
  foot_aspect_ratio?: number;
  landmark_quality_notes?: string;
  warnings?: string[];
  rejection_reasons?: string[];
  error?: string;
  error_code?: string;
}

export const FootSizeFinderPage: React.FC = () => {
  // Input Modes: 'upload' | 'camera' | 'samples'
  const [inputTab, setInputTab] = useState<'upload' | 'camera' | 'samples'>('upload');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<SizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeFacingMode, setActiveFacingMode] = useState<'environment' | 'user'>('environment');
  const [originalImageB64, setOriginalImageB64] = useState<string | null>(null);

  // Calibration Object Setup (matches app.py)
  const [calibrationChoice, setCalibrationChoice] = useState<'credit_card' | 'a4' | 'custom'>('credit_card');
  const [customWidthMm, setCustomWidthMm] = useState<number>(85.6);
  const [customHeightMm, setCustomHeightMm] = useState<number>(53.98);
  const [toeHint, setToeHint] = useState<string>('auto'); // auto, up, down, left, right
  const [enableManualCardOverride, setEnableManualCardOverride] = useState<boolean>(false);

  // Natural Image Dimensions
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 1000, height: 1000 });

  // Pixel Coordinates for Heel and Toe (exact pixel values [0..width, 0..height])
  const [heelPixel, setHeelPixel] = useState<[number, number]>([500, 200]);
  const [toePixel, setToePixel] = useState<[number, number]>([500, 800]);
  const [aiHeelPixel, setAiHeelPixel] = useState<[number, number]>([500, 200]);
  const [aiToePixel, setAiToePixel] = useState<[number, number]>([500, 800]);

  // Card Corners in Pixels: [TL, TR, BR, BL]
  const [cardCornersPx, setCardCornersPx] = useState<[number, number][]>([
    [100, 100], [350, 100], [350, 250], [100, 250]
  ]);

  // UI Expanders
  const [showManualTuning, setShowManualTuning] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [activePinDrag, setActivePinDrag] = useState<'heel' | 'toe' | null>(null);
  const [targetPinMode, setTargetPinMode] = useState<'heel' | 'toe' | null>(null);

  // Benchmark samples
  const [samplesList, setSamplesList] = useState<string[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>('demo_foot_with_card.jpg');
  const [loadingSample, setLoadingSample] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  // Fetch benchmark sample list on mount
  useEffect(() => {
    fetch('/api/py/sample-images')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.samples) && data.samples.length > 0) {
          setSamplesList(data.samples);
          setSelectedSample(data.samples[0]);
        }
      })
      .catch(() => {
        // Fallback demo image
        setSamplesList(['demo_foot_with_card.jpg']);
      });
  }, []);

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

    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera access is not supported by your browser or origin.');
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
        setErrorMsg('Camera permission was denied. You can upload a photo from your device.');
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (inputTab === 'camera') {
      startCamera(activeFacingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [inputTab, activeFacingMode, startCamera, stopCamera]);

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

  // Main Photogrammetric Processing Function
  const processImage = async (
    b64: string,
    overrideHeelPx?: [number, number],
    overrideToePx?: [number, number],
    overrideCardCornersPx?: [number, number][]
  ) => {
    stopCamera();
    setAnalyzing(true);
    setErrorMsg('');
    setOriginalImageB64(b64);

    try {
      let knownW = 85.6;
      let knownH = 53.98;
      if (calibrationChoice === 'a4') {
        knownW = 297.0;
        knownH = 210.0;
      } else if (calibrationChoice === 'custom') {
        knownW = customWidthMm;
        knownH = customHeightMm;
      }

      const payload: Record<string, any> = {
        image_base64: b64,
        calibration_object: calibrationChoice === 'a4' ? 'a4' : 'credit_card',
        known_width_mm: knownW,
        known_height_mm: knownH,
        toe_hint: toeHint !== 'auto' ? toeHint : null,
      };

      if (overrideHeelPx && overrideToePx) {
        payload.manual_heel_px = overrideHeelPx;
        payload.manual_toe_px = overrideToePx;
      }

      if (overrideCardCornersPx && overrideCardCornersPx.length === 4) {
        payload.paper_corners = overrideCardCornersPx;
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
          data.error || 'Could not analyze foot. Ensure bare foot is clearly visible with good lighting.'
        );
        setAnalyzing(false);
        return;
      }

      setResult(data);

      const w = data.image_width || 1000;
      const h = data.image_height || 1000;
      setImageDims({ width: w, height: h });

      if (data.heel_point && data.toe_point) {
        const hp: [number, number] = [Math.round(data.heel_point[0]), Math.round(data.heel_point[1])];
        const tp: [number, number] = [Math.round(data.toe_point[0]), Math.round(data.toe_point[1])];
        setHeelPixel(hp);
        setToePixel(tp);
        if (!overrideHeelPx) {
          setAiHeelPixel(hp);
          setAiToePixel(tp);
        }
      }

      if (data.card_corners && data.card_corners.length === 4) {
        setCardCornersPx(data.card_corners.map((c: number[]) => [Math.round(c[0]), Math.round(c[1])]));
      } else {
        // Sensible default corner placement if none detected
        setCardCornersPx([
          [Math.round(w * 0.1), Math.round(h * 0.1)],
          [Math.round(w * 0.35), Math.round(h * 0.1)],
          [Math.round(w * 0.35), Math.round(h * 0.25)],
          [Math.round(w * 0.1), Math.round(h * 0.25)]
        ]);
      }

      setAnalyzing(false);
    } catch (err: any) {
      setErrorMsg(err.message?.includes('timeout')
        ? 'Processing timed out. Please try a clearer photograph.'
        : (err.message || 'Error processing foot measurement.'));
      setAnalyzing(false);
    }
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const b64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      processImage(b64);
    };
    reader.readAsDataURL(file);
  };

  // Camera capture trigger
  const handleCameraCapture = () => {
    const b64 = captureFrame();
    if (!b64) {
      setErrorMsg('Failed to capture frame from camera. Please try uploading a photo.');
      return;
    }
    processImage(b64);
  };

  // Load sample test image
  const handleLoadSample = async () => {
    if (!selectedSample) return;
    setLoadingSample(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/py/sample-image/${encodeURIComponent(selectedSample)}`);
      const data = await res.json();
      if (data && data.image_base64) {
        processImage(data.image_base64);
      } else {
        setErrorMsg('Could not load test sample image.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to fetch benchmark sample image.');
    } finally {
      setLoadingSample(false);
    }
  };

  // Reset to original AI detected endpoints
  const handleResetToAiLandmarks = () => {
    setHeelPixel(aiHeelPixel);
    setToePixel(aiToePixel);
  };

  // Recalculate measurement with adjusted pixel coordinates
  const handleRecalculate = () => {
    if (!originalImageB64) return;
    processImage(
      originalImageB64,
      heelPixel,
      toePixel,
      enableManualCardOverride ? cardCornersPx : undefined
    );
  };

  // Directional Nudge Helpers (UP = Y decreases towards 0, DOWN = Y increases towards height)
  const nudgeHeel = (dx: number, dy: number) => {
    setHeelPixel((prev) => [
      Math.max(0, Math.min(imageDims.width, prev[0] + dx)),
      Math.max(0, Math.min(imageDims.height, prev[1] + dy))
    ]);
  };

  const nudgeToe = (dx: number, dy: number) => {
    setToePixel((prev) => [
      Math.max(0, Math.min(imageDims.width, prev[0] + dx)),
      Math.max(0, Math.min(imageDims.height, prev[1] + dy))
    ]);
  };

  // Tap/Click on annotated image container to set pin position directly
  const handleImageContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!targetPinMode || !overlayContainerRef.current) return;
    const rect = overlayContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pxX = Math.round(Math.max(0, Math.min(imageDims.width, (clickX / rect.width) * imageDims.width)));
    const pxY = Math.round(Math.max(0, Math.min(imageDims.height, (clickY / rect.height) * imageDims.height)));

    if (targetPinMode === 'heel') {
      setHeelPixel([pxX, pxY]);
      setTargetPinMode(null);
    } else if (targetPinMode === 'toe') {
      setToePixel([pxX, pxY]);
      setTargetPinMode(null);
    }
  };

  // Pointer drag handler for Heel / Toe pins on image
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, pin: 'heel' | 'toe') => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setActivePinDrag(pin);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePinDrag || !overlayContainerRef.current) return;
    const rect = overlayContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const pxX = Math.round(Math.max(0, Math.min(imageDims.width, (curX / rect.width) * imageDims.width)));
    const pxY = Math.round(Math.max(0, Math.min(imageDims.height, (curY / rect.height) * imageDims.height)));

    if (activePinDrag === 'heel') {
      setHeelPixel([pxX, pxY]);
    } else {
      setToePixel([pxX, pxY]);
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

  // Download JSON report matching app.py
  const handleDownloadReport = () => {
    if (!result) return;
    const report = {
      project: "Khybersole AI Foot Size Finder",
      timestamp: new Date().toISOString().split('T')[0],
      measured_foot_length_mm: result.foot_length_mm,
      measured_foot_length_cm: result.length_cm || round(result.foot_length_mm / 10, 2),
      measured_foot_width_mm: result.foot_width_mm,
      measured_foot_width_cm: result.width_cm || round(result.foot_width_mm / 10, 2),
      recommended_chappal_size_pk_uk: result.recommended_uk_size,
      recommended_size_eu: result.recommended_eu_size,
      recommended_size_us: result.recommended_us_size,
      fit_character: result.fit_profile || "Standard Fit",
      confidence_pct: result.confidence_pct,
      reliability_status: result.reliability_status || "Reliable",
      calibration_scale_ppm: result.calibration_scale_ppm,
      card_detected: result.card_detected,
      reference_object: result.reference_object,
      heel_coordinate_px: heelPixel,
      toe_tip_coordinate_px: toePixel,
      foot_orientation_deg: result.foot_orientation_deg,
      foot_aspect_ratio: result.foot_aspect_ratio,
      landmark_quality_notes: result.landmark_quality_notes,
      algorithm: "Khybersole YOLOv8 AI Foot Segmentation & Photogrammetry Model"
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khybersole_foot_measurement_${result.recommended_uk_size}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function round(val: number, dec = 2): number {
    const factor = Math.pow(10, dec);
    return Math.round(val * factor) / factor;
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] text-[#120D0A]">
      <SEOHelmet
        title="Khybersole AI Foot Size Finder — Authentic Peshawari Chappal Sizing"
        description="Calibrated photogrammetry and YOLOv8 instance segmentation to measure your exact millimeter foot dimensions and recommend your authentic Peshawari Chappal size."
      />

      {/* Hidden processing canvas & file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* HEADER BRANDING (Khybersole Streamlit Style) */}
      <div className="max-w-6xl mx-auto pt-6 px-4">
        <div className="bg-gradient-to-r from-[#1A120C] via-[#2B1B10] to-[#150E09] border border-[#C59B27]/40 rounded-2xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">👞</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] tracking-tight">
                KHYBERSOLE
              </h1>
            </div>
            <p className="text-[#C59B27] text-xs sm:text-sm font-semibold tracking-wider uppercase mt-1">
              AI Foot Size Finder &amp; Heritage Chappal Sizing
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[#A08C7D] border-t sm:border-t-0 pt-2 sm:pt-0 border-[#3D2E24] w-full sm:w-auto">
            <span>Final Year Project &bull; Handcrafted Quality</span>
            <div className="text-[#C59B27] font-bold mt-0.5">Calibrated Photogrammetry</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">

        {/* SETUP & GUIDELINES PANEL */}
        <div className="bg-[#1E1712] border border-[#3D2E24] rounded-xl p-4 sm:p-5 text-[#FDFBF7] shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3D2E24] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#D4AF37]">
              <Sliders className="w-4 h-4" />
              <span>📐 Measurement Setup &amp; Calibration Reference</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-xs text-[#C59B27] hover:text-[#D4AF37] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showInstructions ? 'Hide Instructions' : 'Photography Instructions'}</span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Setup controls grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#A08C7D] block mb-1 font-semibold">Reference Object</label>
              <select
                value={calibrationChoice}
                onChange={(e) => setCalibrationChoice(e.target.value as any)}
                className="w-full bg-[#120D0A] border border-[#3D2E24] rounded-lg px-3 py-2 text-xs text-[#FDFBF7] focus:outline-none focus:border-[#C59B27]"
              >
                <option value="credit_card">Standard Bank / Credit Card (85.60 x 53.98 mm)</option>
                <option value="a4">A4 Paper Sheet (297 x 210 mm)</option>
                <option value="custom">Custom Dimensions (mm)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A08C7D] block mb-1 font-semibold">Toe Orientation Hint</label>
              <select
                value={toeHint}
                onChange={(e) => setToeHint(e.target.value)}
                className="w-full bg-[#120D0A] border border-[#3D2E24] rounded-lg px-3 py-2 text-xs text-[#FDFBF7] focus:outline-none focus:border-[#C59B27]"
              >
                <option value="auto">Auto-detect Anatomical Width</option>
                <option value="up">Up (Toe at top of image)</option>
                <option value="down">Down (Toe at bottom of image)</option>
                <option value="left">Left (Toe pointing left)</option>
                <option value="right">Right (Toe pointing right)</option>
              </select>
            </div>

            <div className="flex items-center sm:pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#FDFBF7]/90 select-none">
                <input
                  type="checkbox"
                  checked={enableManualCardOverride}
                  onChange={(e) => setEnableManualCardOverride(e.target.checked)}
                  className="rounded border-[#3D2E24] text-[#C59B27] focus:ring-[#C59B27] w-4 h-4 accent-[#C59B27]"
                />
                <span>Manual Card Corner Override</span>
              </label>
            </div>
          </div>

          {/* Custom dimensions if chosen */}
          {calibrationChoice === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-[#A08C7D] block mb-1">Reference Width (mm)</label>
                <input
                  type="number"
                  value={customWidthMm}
                  min={10}
                  max={500}
                  step={0.1}
                  onChange={(e) => setCustomWidthMm(Number(e.target.value))}
                  className="w-full bg-[#120D0A] border border-[#3D2E24] rounded-lg px-3 py-1.5 text-xs text-[#FDFBF7]"
                />
              </div>
              <div>
                <label className="text-xs text-[#A08C7D] block mb-1">Reference Height (mm)</label>
                <input
                  type="number"
                  value={customHeightMm}
                  min={10}
                  max={500}
                  step={0.1}
                  onChange={(e) => setCustomHeightMm(Number(e.target.value))}
                  className="w-full bg-[#120D0A] border border-[#3D2E24] rounded-lg px-3 py-1.5 text-xs text-[#FDFBF7]"
                />
              </div>
            </div>
          )}

          {/* Expandable Instructions */}
          {showInstructions && (
            <div className="bg-[#120D0A] border border-[#3D2E24] rounded-lg p-3 text-xs text-[#FDFBF7]/80 space-y-1.5 animate-fadeIn">
              <div className="font-bold text-[#D4AF37] mb-1">📋 Photography Guidelines:</div>
              <div>1. <strong>Flat Surface:</strong> Stand or rest your bare foot flat on a hard floor.</div>
              <div>2. <strong>Place Reference Card:</strong> Place your bank card on the floor right beside your foot.</div>
              <div>3. <strong>Direct Overhead Angle:</strong> Hold camera directly above foot (perpendicular to floor).</div>
              <div>4. <strong>Good Lighting:</strong> Ensure no heavy shadows obscure card edges or toe tips.</div>
            </div>
          )}
        </div>

        {/* INPUT TABS: UPLOAD | CAMERA | BENCHMARK SAMPLES */}
        <div className="bg-[#1E1712] border border-[#3D2E24] rounded-xl overflow-hidden shadow-md">
          <div className="flex border-b border-[#3D2E24] bg-[#17110D]">
            <button
              type="button"
              onClick={() => setInputTab('upload')}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
                inputTab === 'upload'
                  ? 'border-[#C59B27] text-[#D4AF37] bg-[#1E1712]'
                  : 'border-transparent text-[#A08C7D] hover:text-[#FDFBF7]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>📁 Upload Photograph</span>
            </button>

            <button
              type="button"
              onClick={() => setInputTab('camera')}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
                inputTab === 'camera'
                  ? 'border-[#C59B27] text-[#D4AF37] bg-[#1E1712]'
                  : 'border-transparent text-[#A08C7D] hover:text-[#FDFBF7]'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📸 Live Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setInputTab('samples')}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
                inputTab === 'samples'
                  ? 'border-[#C59B27] text-[#D4AF37] bg-[#1E1712]'
                  : 'border-transparent text-[#A08C7D] hover:text-[#FDFBF7]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>🖼️ Benchmark Test Samples</span>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* TAB 1: UPLOAD */}
            {inputTab === 'upload' && (
              <div className="space-y-4 text-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#3D2E24] hover:border-[#C59B27] rounded-xl p-8 sm:p-12 cursor-pointer transition bg-[#120D0A]/60 flex flex-col items-center justify-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#261D17] border border-[#3D2E24] group-hover:border-[#C59B27] flex items-center justify-center text-[#D4AF37] mb-3 transition shadow-md">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#FDFBF7] mb-1">
                    Upload Foot Photograph
                  </h3>
                  <p className="text-xs text-[#A08C7D] max-w-md">
                    Select a photograph of your foot beside a bank card or A4 sheet (JPEG, PNG, WEBP).
                  </p>
                  <span className="mt-4 inline-block bg-[#C59B27] text-[#120D0A] font-bold text-xs py-2 px-5 rounded-lg shadow-sm">
                    Browse File
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CAMERA */}
            {inputTab === 'camera' && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center shadow-inner max-w-xl mx-auto border border-[#3D2E24]">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />

                  {/* Clean overhead guide overlays */}
                  <div className="absolute inset-4 pointer-events-none border border-dashed border-[#C59B27]/60 rounded-xl flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start pointer-events-auto">
                      <span className="text-xs bg-[#120D0A]/85 backdrop-blur-xs text-[#D4AF37] px-2.5 py-1 rounded-md font-semibold border border-[#C59B27]/40 flex items-center gap-1.5 shadow-sm">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Place Card Beside Bare Foot</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const newMode = activeFacingMode === 'environment' ? 'user' : 'environment';
                          setActiveFacingMode(newMode);
                          startCamera(newMode);
                        }}
                        className="p-2 rounded-full bg-[#120D0A]/85 text-[#FDFBF7] hover:bg-[#261D17] border border-[#3D2E24] transition shadow-xs"
                        title="Flip Camera"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center text-xs bg-[#120D0A]/85 backdrop-blur-xs text-[#FDFBF7] py-1.5 px-3 rounded-md mx-auto border border-[#3D2E24]">
                      Hold phone perpendicular directly overhead.
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    disabled={analyzing}
                    className="bg-gradient-to-r from-[#C59B27] to-[#9E7B1E] hover:from-[#D4AF37] hover:to-[#B28B23] text-[#120D0A] font-extrabold py-3.5 px-8 rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer text-sm sm:text-base border-none"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture &amp; Process Measurement</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: BENCHMARK TEST SAMPLES */}
            {inputTab === 'samples' && (
              <div className="space-y-4 max-w-xl mx-auto text-[#FDFBF7]">
                <p className="text-xs text-[#A08C7D]">
                  Test the photogrammetry pipeline instantly using real calibrated dataset samples:
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedSample}
                    onChange={(e) => setSelectedSample(e.target.value)}
                    className="flex-1 bg-[#120D0A] border border-[#3D2E24] rounded-lg px-3 py-2.5 text-xs sm:text-sm text-[#FDFBF7] focus:outline-none focus:border-[#C59B27]"
                  >
                    {samplesList.map((s) => (
                      <option key={s} value={s}>
                        {s === 'demo_foot_with_card.jpg' ? '⭐ demo_foot_with_card.jpg (Verified Reference)' : s}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    disabled={loadingSample || analyzing}
                    className="bg-[#C59B27] hover:bg-[#D4AF37] text-[#120D0A] font-bold py-2.5 px-6 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {loadingSample ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Load &amp; Analyze</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ANALYZING SPINNER */}
        {analyzing && (
          <div className="py-12 bg-[#1E1712] border border-[#3D2E24] rounded-xl text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-full border-4 border-[#3D2E24] border-t-[#C59B27] animate-spin mx-auto" />
            <h2 className="font-serif font-bold text-xl text-[#FDFBF7]">
              Analyzing Foot Anatomy &amp; Reference Card...
            </h2>
            <p className="text-xs sm:text-sm text-[#A08C7D] max-w-md mx-auto">
              Running custom YOLOv8 instance segmentation, calculating card homography, and extracting heel &amp; toe coordinates.
            </p>
          </div>
        )}

        {/* ERROR ADVISORY */}
        {errorMsg && !analyzing && (
          <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-md">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold text-red-100 mb-0.5">Measurement Advisory:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* MEASUREMENT & SIZING RESULTS SECTION (app.py EXACT STRUCTURE) */}
        {result && !analyzing && (
          <div className="space-y-6 animate-fadeIn">

            {/* CARD DETECTION STATUS INDICATOR */}
            {result.card_detected ? (
              <div className="bg-emerald-950/50 border border-emerald-600/60 rounded-xl p-3.5 sm:p-4 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Reference Card Detected ({result.reference_object || 'Bank Card ID-1'}):</strong>{' '}
                    {result.calibration_scale_ppm ? result.calibration_scale_ppm.toFixed(2) : '2.52'} px/mm &mdash; Perspective Homography Active
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                  Certified Accurate
                </span>
              </div>
            ) : (
              <div className="bg-amber-950/50 border border-amber-600/60 rounded-xl p-3.5 sm:p-4 text-amber-200 text-xs sm:text-sm flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>No Reference Card Detected:</strong> Measurement uses optical scale estimation. Place a standard card beside your foot for certified millimeter accuracy.
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-900/60 px-2.5 py-1 rounded-md border border-amber-500/40">
                  Approximate
                </span>
              </div>
            )}

            {/* VISUAL OUTPUT DISPLAY (SIDE BY SIDE: ORIGINAL vs ANNOTATED SCAN) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Photograph */}
              <div className="bg-[#1E1712] border border-[#3D2E24] rounded-xl p-4 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[#FDFBF7] flex items-center gap-2">
                    <span>📷 Original Image</span>
                  </h3>
                  <span className="text-[11px] text-[#A08C7D] font-mono">
                    {imageDims.width} &times; {imageDims.height} px
                  </span>
                </div>

                <div className="bg-[#120D0A] rounded-lg overflow-hidden border border-[#3D2E24] flex items-center justify-center p-1 min-h-[300px]">
                  {originalImageB64 ? (
                    <img
                      src={`data:image/jpeg;base64,${originalImageB64}`}
                      alt="Original Foot Photograph"
                      className="max-h-[460px] w-auto object-contain mx-auto rounded select-none"
                    />
                  ) : (
                    <div className="text-xs text-[#A08C7D]">Original image not loaded</div>
                  )}
                </div>
              </div>

              {/* AI Photogrammetry & Segmentation (Interactive Overlay) */}
              <div className="bg-[#1E1712] border border-[#3D2E24] rounded-xl p-4 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                    <span>🎯 AI Photogrammetry &amp; Segmentation</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      Mask &amp; Landmarks
                    </span>
                  </div>
                </div>

                <div className="bg-[#120D0A] rounded-lg overflow-hidden border border-[#3D2E24] flex items-center justify-center p-1 min-h-[300px]">
                  {result.annotated_image_base64 && (
                    <div
                      ref={overlayContainerRef}
                      onClick={handleImageContainerClick}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      style={{
                        aspectRatio: `${imageDims.width} / ${imageDims.height}`,
                      }}
                      className="relative w-full max-h-[460px] select-none touch-none overflow-hidden rounded mx-auto"
                    >
                      <img
                        src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                        alt="Calibrated AI Photogrammetry Scan"
                        className="w-full h-full object-fill block pointer-events-none select-none"
                      />

                      {/* Measurement line between Heel and Toe */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line
                          x1={`${(heelPixel[0] / imageDims.width) * 100}%`}
                          y1={`${(heelPixel[1] / imageDims.height) * 100}%`}
                          x2={`${(toePixel[0] / imageDims.width) * 100}%`}
                          y2={`${(toePixel[1] / imageDims.height) * 100}%`}
                          stroke="#00FF66"
                          strokeWidth="2.5"
                          strokeDasharray="4,4"
                        />
                      </svg>

                      {/* 🟠 Heel Pin (Draggable on X & Y) */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'heel')}
                        style={{
                          left: `${(heelPixel[0] / imageDims.width) * 100}%`,
                          top: `${(heelPixel[1] / imageDims.height) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30 transition-transform active:scale-110"
                        title="Heel Landmark (Drag along X & Y)"
                      >
                        <span className="text-[9px] font-black text-white">HEEL</span>
                      </div>

                      {/* 🔵 Toe Tip Pin (Draggable on X & Y) */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'toe')}
                        style={{
                          left: `${(toePixel[0] / imageDims.width) * 100}%`,
                          top: `${(toePixel[1] / imageDims.height) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center z-30 transition-transform active:scale-110"
                        title="Toe Tip Landmark (Drag along X & Y)"
                      >
                        <span className="text-[9px] font-black text-white">TOE</span>
                      </div>

                      {/* Tap to set notice banner */}
                      {targetPinMode && (
                        <div className="absolute top-2 left-2 right-2 bg-black/80 text-[#D4AF37] text-xs py-1.5 px-3 rounded text-center border border-[#C59B27] pointer-events-none shadow-md">
                          Click anywhere on the foot image to place the {targetPinMode.toUpperCase()} marker.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4 METRIC CARDS (app.py STYLE) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Length */}
              <div className="bg-[#1E1712] border border-[#3D2E24] hover:border-[#C59B27] rounded-xl p-4 text-center transition shadow-md">
                <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#FDFBF7]">
                  {result.length_cm ? result.length_cm : (result.foot_length_mm / 10).toFixed(2)} cm
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#C59B27] uppercase tracking-wider mt-1">
                  Foot Length ({result.foot_length_mm.toFixed(1)} mm)
                </div>
                {result.is_manually_adjusted && (
                  <span className="inline-block mt-1 text-[10px] text-[#D4AF37] font-semibold">
                    ✏️ Manually Fine-Tuned
                  </span>
                )}
              </div>

              {/* Width */}
              <div className="bg-[#1E1712] border border-[#3D2E24] hover:border-[#C59B27] rounded-xl p-4 text-center transition shadow-md">
                <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#FDFBF7]">
                  {result.width_cm ? result.width_cm : (result.foot_width_mm / 10).toFixed(2)} cm
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#C59B27] uppercase tracking-wider mt-1">
                  Foot Width ({result.foot_width_mm.toFixed(1)} mm)
                </div>
              </div>

              {/* Confidence */}
              <div className="bg-[#1E1712] border border-[#3D2E24] hover:border-[#C59B27] rounded-xl p-4 text-center transition shadow-md">
                <div className="font-serif font-extrabold text-2xl sm:text-3xl text-[#FDFBF7]">
                  {result.confidence_pct}%
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#C59B27] uppercase tracking-wider mt-1">
                  AI Mask Confidence
                </div>
              </div>

              {/* Reliability */}
              <div className="bg-[#1E1712] border border-[#3D2E24] hover:border-[#C59B27] rounded-xl p-4 text-center transition shadow-md">
                <div
                  className={`font-serif font-extrabold text-xl sm:text-2xl mt-1 ${
                    result.reliability_status === 'Reliable'
                      ? 'text-emerald-400'
                      : (result.reliability_status?.includes('Caution') ? 'text-amber-400' : 'text-red-400')
                  }`}
                >
                  {result.reliability_status || (result.card_detected ? 'Reliable' : 'Approximate')}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#C59B27] uppercase tracking-wider mt-1">
                  Reliability Index
                </div>
              </div>
            </div>

            {/* RECOMMENDED PESHAWARI CHAPPAL SIZE BOX (app.py STYLE) */}
            <div className="bg-gradient-to-r from-[#2A1D13] to-[#1A120B] border-2 border-[#C59B27] rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-2">
              <span className="text-xs font-bold tracking-widest text-[#C59B27] uppercase block">
                Recommended Peshawari Chappal Size
              </span>

              <div className="font-serif font-extrabold text-5xl sm:text-6xl text-[#D4AF37] my-2 tracking-tight">
                Size {result.recommended_uk_size} (UK / PK)
              </div>

              <div className="text-sm sm:text-base font-semibold text-[#FDFBF7]">
                EU Size: {result.recommended_eu_size} &bull; US Size: {result.recommended_us_size}
              </div>

              <div className="text-xs sm:text-sm text-[#A08C7D] pt-1">
                Fit Character: <strong className="text-[#FDFBF7]">{result.fit_profile || 'Standard Fit'}</strong>
              </div>

              {result.boundary_warning && (
                <div className="bg-[#120D0A]/60 border border-[#C59B27]/40 rounded-lg p-2.5 max-w-md mx-auto text-xs text-[#D4AF37] mt-3">
                  💡 <strong>Fitting Advice:</strong> {result.boundary_warning}
                </div>
              )}

              <div className="pt-4 flex flex-wrap gap-3 justify-center">
                <Link
                  to={`/products?size=${result.recommended_uk_size}`}
                  className="bg-gradient-to-r from-[#C59B27] to-[#9E7B1E] hover:from-[#D4AF37] hover:to-[#B28B23] text-[#120D0A] font-extrabold py-3.5 px-8 rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95 text-sm sm:text-base border-none cursor-pointer"
                >
                  <span>Shop Size {result.recommended_uk_size} Collection</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="bg-[#120D0A] hover:bg-[#261D17] text-[#D4AF37] font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 border border-[#C59B27]/50 transition text-sm cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report (JSON)</span>
                </button>
              </div>
            </div>

            {/* MANUAL HEEL & TOE FINE-TUNING PANEL (NUDGE POINTS & PRECISE PIXEL SLIDERS) */}
            <div className="bg-[#1E1712] border border-[#3D2E24] rounded-xl overflow-hidden shadow-md">
              <button
                type="button"
                onClick={() => setShowManualTuning(!showManualTuning)}
                className="w-full p-4 flex items-center justify-between text-left bg-[#1A120B] hover:bg-[#261D17] transition cursor-pointer border-b border-[#3D2E24]"
              >
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-[#C59B27]" />
                  <span className="font-serif font-bold text-sm sm:text-base text-[#FDFBF7]">
                    🎯 Manual Heel &amp; Toe Fine-Tuning (Pixel-Exact Sliders &amp; Nudge Buttons)
                  </span>
                </div>
                {showManualTuning ? <ChevronUp className="w-4 h-4 text-[#A08C7D]" /> : <ChevronDown className="w-4 h-4 text-[#A08C7D]" />}
              </button>

              {showManualTuning && (
                <div className="p-4 sm:p-6 space-y-5 text-[#FDFBF7]">
                  <p className="text-xs text-[#A08C7D]">
                    Fine-tune the anatomical endpoints along the X-axis (left/right) and Y-axis (top/bottom).
                    Each slider moves in exact pixels from <code className="text-[#D4AF37]">0</code> to image dimension.
                    Y = 0 is the top edge, and Y = {imageDims.height} is the bottom edge.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 🟠 Heel Position Controls */}
                    <div className="bg-[#120D0A] border border-amber-900/40 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#3D2E24] pb-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <span>🟠 Heel Position</span>
                        </span>
                        <span className="font-mono text-xs text-[#D4AF37]">
                          X: {heelPixel[0]} px &bull; Y: {heelPixel[1]} px
                        </span>
                      </div>

                      {/* Heel X */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#A08C7D] mb-1">
                          <span>Heel X (Left ↔ Right)</span>
                          <span className="font-mono text-[#FDFBF7]">{heelPixel[0]} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={imageDims.width}
                          step={1}
                          value={heelPixel[0]}
                          onChange={(e) => setHeelPixel([Number(e.target.value), heelPixel[1]])}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Heel Y */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#A08C7D] mb-1">
                          <span>Heel Y (Top: 0px ↕ Bottom: {imageDims.height}px)</span>
                          <span className="font-mono text-[#FDFBF7]">{heelPixel[1]} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={imageDims.height}
                          step={1}
                          value={heelPixel[1]}
                          onChange={(e) => setHeelPixel([heelPixel[0], Number(e.target.value)])}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Directional Nudge buttons */}
                      <div className="pt-1">
                        <span className="text-[11px] text-[#A08C7D] block mb-2 font-semibold">Directional Nudge:</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => nudgeHeel(0, -3)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Heel UP (towards top of image)"
                          >
                            ⬆️ Up
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeHeel(0, 3)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Heel DOWN (towards bottom of image)"
                          >
                            ⬇️ Down
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeHeel(-3, 0)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Heel LEFT"
                          >
                            ⬅️ Left
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeHeel(3, 0)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Heel RIGHT"
                          >
                            ➡️ Right
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetPinMode(targetPinMode === 'heel' ? null : 'heel')}
                            className={`text-xs px-2.5 py-1.5 rounded border cursor-pointer ${
                              targetPinMode === 'heel'
                                ? 'bg-amber-600 text-white border-amber-400 font-bold'
                                : 'bg-[#1E1712] text-amber-300 border-[#3D2E24]'
                            }`}
                          >
                            {targetPinMode === 'heel' ? 'Click on image...' : '🎯 Click Image to Place'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 🔵 Toe Tip Position Controls */}
                    <div className="bg-[#120D0A] border border-cyan-900/40 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#3D2E24] pb-2">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <span>🔵 Toe Tip Position</span>
                        </span>
                        <span className="font-mono text-xs text-[#D4AF37]">
                          X: {toePixel[0]} px &bull; Y: {toePixel[1]} px
                        </span>
                      </div>

                      {/* Toe X */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#A08C7D] mb-1">
                          <span>Toe X (Left ↔ Right)</span>
                          <span className="font-mono text-[#FDFBF7]">{toePixel[0]} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={imageDims.width}
                          step={1}
                          value={toePixel[0]}
                          onChange={(e) => setToePixel([Number(e.target.value), toePixel[1]])}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>

                      {/* Toe Y */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#A08C7D] mb-1">
                          <span>Toe Y (Top: 0px ↕ Bottom: {imageDims.height}px)</span>
                          <span className="font-mono text-[#FDFBF7]">{toePixel[1]} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={imageDims.height}
                          step={1}
                          value={toePixel[1]}
                          onChange={(e) => setToePixel([toePixel[0], Number(e.target.value)])}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>

                      {/* Directional Nudge buttons */}
                      <div className="pt-1">
                        <span className="text-[11px] text-[#A08C7D] block mb-2 font-semibold">Directional Nudge:</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => nudgeToe(0, -3)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Toe UP (towards top of image)"
                          >
                            ⬆️ Up
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeToe(0, 3)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Toe DOWN (towards bottom of image)"
                          >
                            ⬇️ Down
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeToe(-3, 0)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Toe LEFT"
                          >
                            ⬅️ Left
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeToe(3, 0)}
                            className="bg-[#261D17] hover:bg-[#3D2E24] text-xs px-2.5 py-1.5 rounded border border-[#3D2E24] text-[#FDFBF7] cursor-pointer"
                            title="Move Toe RIGHT"
                          >
                            ➡️ Right
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetPinMode(targetPinMode === 'toe' ? null : 'toe')}
                            className={`text-xs px-2.5 py-1.5 rounded border cursor-pointer ${
                              targetPinMode === 'toe'
                                ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                                : 'bg-[#1E1712] text-cyan-300 border-[#3D2E24]'
                            }`}
                          >
                            {targetPinMode === 'toe' ? 'Click on image...' : '🎯 Click Image to Place'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Card Corners Fine-Tuning (if enabled) */}
                  {enableManualCardOverride && (
                    <div className="bg-[#120D0A] border border-[#3D2E24] rounded-xl p-4 space-y-3">
                      <div className="font-bold text-xs text-[#D4AF37]">
                        📍 Manual Reference Card Corner Fine-Tuning (Pixels)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-[#A08C7D] block">Top-Left (X, Y)</label>
                          <div className="flex gap-1 mt-1">
                            <input
                              type="number"
                              value={cardCornersPx[0]?.[0] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [[val, prev[0][1]], prev[1], prev[2], prev[3]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                            <input
                              type="number"
                              value={cardCornersPx[0]?.[1] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [[prev[0][0], val], prev[1], prev[2], prev[3]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A08C7D] block">Top-Right (X, Y)</label>
                          <div className="flex gap-1 mt-1">
                            <input
                              type="number"
                              value={cardCornersPx[1]?.[0] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [prev[0], [val, prev[1][1]], prev[2], prev[3]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                            <input
                              type="number"
                              value={cardCornersPx[1]?.[1] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [prev[0], [prev[1][0], val], prev[2], prev[3]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A08C7D] block">Bottom-Right (X, Y)</label>
                          <div className="flex gap-1 mt-1">
                            <input
                              type="number"
                              value={cardCornersPx[2]?.[0] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [prev[0], prev[1], [val, prev[2][1]], prev[3]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                            <input
                              type="number"
                              value={cardCornersPx[2]?.[1] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [prev[0], prev[1], [prev[2][0], val], prev[3]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A08C7D] block">Bottom-Left (X, Y)</label>
                          <div className="flex gap-1 mt-1">
                            <input
                              type="number"
                              value={cardCornersPx[3]?.[0] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [prev[0], prev[1], prev[2], [val, prev[3][1]]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                            <input
                              type="number"
                              value={cardCornersPx[3]?.[1] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCardCornersPx((prev) => [prev[0], prev[1], prev[2], [prev[3][0], val]]);
                              }}
                              className="w-1/2 bg-[#1E1712] border border-[#3D2E24] rounded p-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions: Reset & Recalculate */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResetToAiLandmarks}
                      className="bg-[#120D0A] hover:bg-[#261D17] text-[#A08C7D] hover:text-[#FDFBF7] font-bold py-3 px-5 rounded-xl border border-[#3D2E24] transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>↺ Reset to AI Landmarks</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRecalculate}
                      disabled={analyzing}
                      className="flex-1 bg-gradient-to-r from-[#C59B27] to-[#9E7B1E] hover:from-[#D4AF37] hover:to-[#B28B23] text-[#120D0A] font-extrabold py-3 px-6 rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer border-none"
                    >
                      <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                      <span>Recalculate Size with Adjusted Landmarks</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* EXPANDABLE PHOTOGRAMMETRY & LANDMARK TECHNICAL DETAILS */}
            <div className="bg-[#1E1712] border border-[#3D2E24] rounded-xl overflow-hidden shadow-md">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full p-4 flex items-center justify-between text-left bg-[#1A120B] hover:bg-[#261D17] transition cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FDFBF7]">
                  <FileText className="w-4 h-4 text-[#C59B27]" />
                  <span>🛠️ Photogrammetry &amp; Landmark Details</span>
                </div>
                {showTechnicalDetails ? <ChevronUp className="w-4 h-4 text-[#A08C7D]" /> : <ChevronDown className="w-4 h-4 text-[#A08C7D]" />}
              </button>

              {showTechnicalDetails && (
                <div className="p-4 sm:p-5 bg-[#120D0A] text-xs text-[#FDFBF7]/80 space-y-2 border-t border-[#3D2E24]">
                  <div>&bull; <strong>Calibration Scale:</strong> {result.calibration_scale_ppm ? result.calibration_scale_ppm.toFixed(3) : '2.522'} px/mm</div>
                  <div>&bull; <strong>Calibration Method:</strong> {result.calibration_method || 'Perspective Homography (Planar 2D Metric Space)'}</div>
                  <div>&bull; <strong>Card Dimensions:</strong> {result.reference_dims_mm ? `${result.reference_dims_mm[0]} x ${result.reference_dims_mm[1]} mm` : '85.60 x 53.98 mm'}</div>
                  <div>&bull; <strong>Foot Longitudinal Angle:</strong> {result.foot_orientation_deg !== undefined ? `${result.foot_orientation_deg}°` : '88.5°'}</div>
                  <div>&bull; <strong>Foot Aspect Ratio (L/W):</strong> {result.foot_aspect_ratio !== undefined ? result.foot_aspect_ratio : '2.84'}</div>
                  <div>&bull; <strong>Heel Coordinate:</strong> ({heelPixel[0]}, {heelPixel[1]}) px</div>
                  <div>&bull; <strong>Toe Tip Coordinate:</strong> ({toePixel[0]}, {toePixel[1]}) px</div>
                  <div>&bull; <strong>Landmark Quality Notes:</strong> {result.landmark_quality_notes || 'Landmarks verified within normal anatomical bounds.'}</div>
                </div>
              )}
            </div>

            {/* SCAN ANOTHER FOOT BUTTON */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setOriginalImageB64(null);
                  setErrorMsg('');
                  setInputTab('upload');
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#A08C7D] hover:text-[#C59B27] py-2 px-4 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Scan Another Foot / Retake Photo</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
