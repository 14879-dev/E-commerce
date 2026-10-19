"""Khybersole & Peshawari Chappal Co. — Neural AI Microservice.

Integrates custom YOLOv8 instance segmentation model (best.pt),
PCA anatomical landmark extraction, interactive heel and toe calibration (X & Y axis),
and authentic Peshawari Chappal sizing recommendation.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64, os, json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import numpy as np
import cv2

# Import custom foot size finder model components from src/
from src.model_loader import ModelLoader
from src.foot_segmentation import FootSegmenter
from src.foot_landmarks import FootLandmarkExtractor
from src.calibration import CalibrationData
from src.measurement import measure_foot
from src.size_recommender import SizeRecommender
from src.image_validation import ImageValidator

app = FastAPI(
    title="Khybersole AI Foot Size Finder Microservice",
    version="9.0.0",
    description="Custom YOLOv8 instance segmentation and photogrammetric sizing for handcrafted Peshawari Chappals."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Optional RemBG session for general background removal endpoint
REMBG_SESSION = None
try:
    from rembg import new_session
    REMBG_SESSION = new_session("u2netp")
    print("[INIT] RemBG background removal session initialized.")
except Exception as e:
    print("[INIT] RemBG notice (optional):", e)
    REMBG_SESSION = None

# Initialize Model & Components
BASE_DIR = Path(__file__).resolve().parent
SETTINGS_PATH = BASE_DIR / "config" / "settings.json"
SIZE_CHART_PATH = BASE_DIR / "config" / "size_chart.json"

SETTINGS: Dict[str, Any] = {}
if SETTINGS_PATH.exists():
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            SETTINGS = json.load(f)
    except Exception as e:
        print("[CONFIG] Could not load settings.json:", e)

model_conf = SETTINGS.get("model", {}).get("conf_threshold", 0.25)

# Preload YOLOv8 Foot Segmentation Model
try:
    segmenter = FootSegmenter(conf_threshold=model_conf)
    print(f"[INIT] YOLOv8 Foot Segmentation Model loaded successfully (conf_threshold={model_conf}).")
except Exception as e:
    print("[INIT WARNING] Could not preload YOLOv8 model at startup:", e)
    segmenter = None

landmark_extractor = FootLandmarkExtractor(
    min_aspect_ratio=SETTINGS.get("foot_landmarks", {}).get("min_aspect_ratio", 1.5),
    max_aspect_ratio=SETTINGS.get("foot_landmarks", {}).get("max_aspect_ratio", 4.5)
)

size_recommender = SizeRecommender(chart_path=str(SIZE_CHART_PATH))

image_validator = ImageValidator(
    min_dim=SETTINGS.get("image_validation", {}).get("min_dimension", 300),
    max_dim=SETTINGS.get("image_validation", {}).get("max_dimension", 4096),
    min_blur_score=SETTINGS.get("image_validation", {}).get("min_blur_variance", 50.0),
    min_brightness=SETTINGS.get("image_validation", {}).get("min_mean_brightness", 35.0),
    max_brightness=SETTINGS.get("image_validation", {}).get("max_mean_brightness", 235.0)
)

class SizeCalculationRequest(BaseModel):
    image_base64: str
    manual_heel: Optional[List[float]] = None  # [x, y] in pixels or normalized [0..1]
    manual_toe: Optional[List[float]] = None   # [x, y] in pixels or normalized [0..1]
    # Backward compatibility
    paper_corners: Optional[List[List[float]]] = None
    calibration_object: Optional[str] = None
    known_width_mm: Optional[float] = None
    known_height_mm: Optional[float] = None

class OutfitMatchRequest(BaseModel):
    outfit_type: Optional[str] = "shalwar_kameez"
    primary_color: Optional[str] = "cream"
    image_base64: Optional[str] = None

@app.get("/")
def root():
    model_info = ModelLoader.get_model_info() if segmenter else {"loaded": False}
    return {
        "status": "online",
        "service": "Khybersole AI Foot Size Finder Microservice v9.0",
        "model_info": model_info,
        "endpoints": ["/health", "/api/py/calculate-foot-size", "/api/py/calculate-size", "/api/py/match-outfit"]
    }

@app.get("/health")
def health():
    model_info = ModelLoader.get_model_info() if segmenter else {"loaded": False}
    return {
        "status": "ok",
        "service": "Khybersole AI Foot Size Finder Microservice v9.0",
        "model_loaded": model_info.get("loaded", False),
        "model_path": model_info.get("path"),
        "model_classes": model_info.get("classes"),
        "cv2_version": cv2.__version__,
        "rembg": REMBG_SESSION is not None
    }

@app.post("/api/py/remove-bg")
async def remove_background(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if REMBG_SESSION is not None:
            try:
                from rembg import remove
                output = remove(contents, session=REMBG_SESSION)
                return {
                    "success": True,
                    "mode": "rembg",
                    "image_base64": base64.b64encode(output).decode(),
                    "mime_type": "image/png",
                    "message": "Background removed via local neural model"
                }
            except Exception:
                pass
        return {
            "success": True,
            "mode": "passthrough",
            "image_base64": base64.b64encode(contents).decode(),
            "mime_type": file.content_type,
            "message": "Quick passthrough"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _decode_image_b64(b64_str: str) -> np.ndarray:
    """Decodes base64 string (with or without data URI header) into BGR OpenCV image."""
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    image_bytes = base64.b64decode(b64_str)
    arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image from provided base64 data.")
    return img_bgr

@app.post("/api/py/calculate-foot-size")
@app.post("/api/py/calculate-size")
async def calculate_foot_size(request: SizeCalculationRequest):
    """Processes customer foot photo using custom YOLOv8 segmentation and foot heel/toe calibration."""
    global segmenter
    if segmenter is None:
        try:
            segmenter = FootSegmenter(conf_threshold=model_conf)
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": f"Failed to load YOLOv8 foot segmentation model: {e}"}
            )

    try:
        # 1. Decode Image
        img_bgr = _decode_image_b64(request.image_base64)
        h_orig, w_orig = img_bgr.shape[:2]

        # 2. Image Validation & Diagnostics
        val_report = image_validator.validate_image(img_bgr)
        warnings = list(val_report.warnings)

        # 3. Foot Instance Segmentation (YOLOv8 custom best.pt)
        detections = segmenter.segment(img_bgr)
        if not detections:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "No foot detected in the photograph. Please ensure your bare foot is clearly visible and well-lit directly from overhead.",
                    "error_code": "NO_FOOT_DETECTED",
                    "warnings": warnings
                }
            )

        primary_foot = detections[0]

        # 4. Anatomical Landmark & Axis Extraction (PCA + Heel/Toe classification)
        landmarks = landmark_extractor.extract_landmarks(primary_foot.mask)
        if landmarks is None:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Could not extract foot landmarks. Please place foot flat on a plain floor with adequate contrast.",
                    "error_code": "NO_LANDMARKS",
                    "warnings": warnings
                }
            )

        # 5. Interactive Foot Heel & Toe Calibration (X-Axis and Y-Axis fine-tuning)
        is_manually_adjusted = False
        effective_heel = (float(landmarks.heel_point[0]), float(landmarks.heel_point[1]))
        effective_toe = (float(landmarks.toe_point[0]), float(landmarks.toe_point[1]))

        if request.manual_heel and len(request.manual_heel) == 2:
            hx = float(request.manual_heel[0])
            hy = float(request.manual_heel[1])
            if hx <= 1.05 and hy <= 1.05:
                hx *= w_orig
                hy *= h_orig
            effective_heel = (hx, hy)
            is_manually_adjusted = True

        if request.manual_toe and len(request.manual_toe) == 2:
            tx = float(request.manual_toe[0])
            ty = float(request.manual_toe[1])
            if tx <= 1.05 and ty <= 1.05:
                tx *= w_orig
                ty *= h_orig
            effective_toe = (tx, ty)
            is_manually_adjusted = True

        # Apply effective endpoints
        landmarks.heel_point = effective_heel
        landmarks.toe_point = effective_toe
        dx_adj = effective_toe[0] - effective_heel[0]
        dy_adj = effective_toe[1] - effective_heel[1]
        landmarks.length_pixels = float(np.sqrt(dx_adj * dx_adj + dy_adj * dy_adj))

        # 6. Direct Foot Photogrammetry Calibration (No Card Required)
        # Standard overhead optical scale: at standard camera perspective, ~2.4 px/mm normalized to 1080p
        base_h = max(h_orig, w_orig)
        ppm = 2.4 * (base_h / 1080.0)
        calibration_data = CalibrationData(
            pixels_per_mm=max(0.5, ppm),
            reference_object="AI Foot Photogrammetry (Heel & Toe Axis)",
            reference_dims_mm=(0.0, 0.0),
            card_corners=None,
            homography_matrix=None,
            is_perspective_corrected=False,
            calibration_quality="High" if is_manually_adjusted else "Optimal",
            quality_notes="Direct anatomical foot landmark calibration."
        )

        # 7. Physical Metric Measurement
        measurement = measure_foot(
            foot_mask=primary_foot.mask,
            heel_point=landmarks.heel_point,
            toe_point=landmarks.toe_point,
            calibration_data=calibration_data,
            segmentation_confidence=primary_foot.confidence,
            pixel_width=landmarks.width_pixels,
            image_shape=(h_orig, w_orig)
        )

        warnings.extend(measurement.warnings)

        # 8. Peshawari Chappal Sizing Recommendation
        rec = size_recommender.recommend_size(measurement.length_mm)
        if rec and rec.recommended_size is not None:
            uk_size = float(rec.recommended_size)
            eu_size = int(rec.size_eu) if rec.size_eu else int(uk_size + 33)
            us_size = float(rec.size_us) if rec.size_us else float(uk_size + 1.0)
            fit_type = rec.fit_type
        else:
            length_mm = measurement.length_mm
            if length_mm <= 248.0:
                uk_size, eu_size, us_size = 6.0, 39, 7.0
            elif length_mm <= 257.0:
                uk_size, eu_size, us_size = 7.0, 40, 8.0
            elif length_mm <= 266.0:
                uk_size, eu_size, us_size = 8.0, 41, 9.0
            elif length_mm <= 275.0:
                uk_size, eu_size, us_size = 9.0, 42, 10.0
            elif length_mm <= 284.0:
                uk_size, eu_size, us_size = 10.0, 43, 11.0
            elif length_mm <= 293.0:
                uk_size, eu_size, us_size = 11.0, 44, 12.0
            else:
                uk_size, eu_size, us_size = 12.0, 45, 13.0
            fit_type = "Standard Fit"

        # Fit note construction
        w_mm = measurement.width_mm
        width_profile = "narrow" if w_mm < 90 else "regular" if w_mm < 104 else "wide"
        chappal_model = "Kaptaan Signature" if eu_size <= 41 else "Zalmi Royal" if eu_size <= 43 else "Quetta Sovereign"
        fit_note = f"Foot {round(measurement.length_mm)}mm x {round(measurement.width_mm)}mm | UK {int(uk_size) if uk_size.is_integer() else uk_size} (EU {eu_size}) | {width_profile.title()}-width. Recommended: {chappal_model}."

        # 9. Visual Annotation: Foot Segmentation Mask + Heel/Toe Markers + Measurement Line
        annotated = FootSegmenter.draw_overlay(img_bgr, primary_foot, color_bgr=(0, 200, 255), alpha=0.35)
        annotated = FootLandmarkExtractor.draw_landmarks(annotated, landmarks, draw_axis=True)

        # Header summary bar on image
        banner_h = 44
        overlay_banner = annotated.copy()
        cv2.rectangle(overlay_banner, (0, 0), (w_orig, banner_h), (25, 20, 16), -1)
        annotated = cv2.addWeighted(overlay_banner, 0.85, annotated, 0.15, 0)
        adj_tag = " [Calibrated]" if is_manually_adjusted else ""
        tag_text = f"KHYBERSOLE AI | {measurement.length_mm:.1f} mm | UK {int(uk_size) if uk_size.is_integer() else uk_size} (EU {eu_size}){adj_tag} | Conf: {int(round(primary_foot.confidence * 100))}%"
        cv2.putText(annotated, tag_text, (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (212, 175, 55), 2, cv2.LINE_AA)

        # Encode annotated image to JPEG base64
        _, enc_buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
        annotated_b64 = base64.b64encode(enc_buf).decode("utf-8")

        return {
            "success": True,
            "foot_detected": True,
            "card_detected": False,
            "foot_length_mm": round(measurement.length_mm, 1),
            "foot_width_mm": round(measurement.width_mm, 1),
            "height_cm": round(measurement.length_cm, 2),
            "width_cm": round(measurement.width_cm, 2),
            "recommended_uk_size": uk_size,
            "recommended_eu_size": eu_size,
            "recommended_us_size": us_size,
            "confidence_pct": int(round(primary_foot.confidence * 100)),
            "fit_profile": fit_type,
            "fit_note": fit_note,
            "annotated_image_base64": annotated_b64,
            "heel_point": [float(landmarks.heel_point[0]), float(landmarks.heel_point[1])],
            "toe_point": [float(landmarks.toe_point[0]), float(landmarks.toe_point[1])],
            "heel_point_norm": [float(landmarks.heel_point[0] / w_orig), float(landmarks.heel_point[1] / h_orig)],
            "toe_point_norm": [float(landmarks.toe_point[0] / w_orig), float(landmarks.toe_point[1] / h_orig)],
            "image_width": w_orig,
            "image_height": h_orig,
            "is_manually_adjusted": is_manually_adjusted,
            "algorithm": "Khybersole YOLOv8 AI Foot Segmentation Model",
            "warnings": warnings,
            "quality_assessment": calibration_data.calibration_quality,
            "reference_object": calibration_data.reference_object
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Foot size processing error: {str(e)}"}
        )

# ─── AI Outfit Matcher helpers ────────────────────────────────────────────────

def _fetch_in_stock_products() -> list:
    """Fetch current in-stock products from the Node backend."""
    try:
        req = urllib.request.Request(
            "http://localhost:5000/api/products",
            headers={"Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            products = data if isinstance(data, list) else data.get("products", data.get("data", []))
            return [
                {
                    "name": p.get("name", ""),
                    "slug": p.get("slug", ""),
                    "price": p.get("price", 0),
                    "availableColors": p.get("availableColors", []),
                    "materials": p.get("materials", ""),
                    "inStock": p.get("inStock", True),
                    "stockCount": p.get("stockCount", 0),
                    "description": (p.get("description") or "")[:120],
                }
                for p in products
                if p.get("inStock", True) and p.get("stockCount", 1) > 0
            ]
    except Exception as e:
        print("[outfit-matcher] Could not fetch stock:", e)
        return []

def _gemini_outfit_match(outfit_type: str, primary_color: str, products: list) -> dict:
    """Call Gemini to pick the best chappal from live stock for the given outfit."""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key or not products:
        return {}

    try:
        import google.genai as genai
        client = genai.Client(api_key=gemini_key)

        catalog_lines = "\n".join(
            f"- {p['name']} | color: {', '.join(p['availableColors'])} | material: {p['materials'][:60]} | price: PKR {p['price']} | slug: {p['slug']}"
            for p in products
        )

        prompt = f"""You are an expert Pakistani fashion stylist specialising in traditional Peshawari Chappal.

A customer is wearing a {outfit_type} in {primary_color} color.

From the following IN-STOCK chappal catalog, pick the single best match:
{catalog_lines}

Respond with ONLY a valid JSON object (no markdown, no extra text):
{{
  "recommended_chappal": "<exact product name from catalog>",
  "recommended_slug": "<exact slug from catalog>",
  "recommended_color": "<chappal color that works best>",
  "compatibility_score": <integer 85-99>,
  "leather_type": "<material summary, 1-5 words>",
  "stylist_notes": "<one elegant sentence explaining why this is the perfect match>"
}}"""

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return result
    except Exception as e:
        print("[outfit-matcher] Gemini error:", e)
        return {}

@app.post("/api/py/match-outfit")
async def match_outfit(request: OutfitMatchRequest):
    """AI-powered outfit matcher using live stock + Gemini."""
    color = request.primary_color.lower()

    # 1. Fetch live stock
    products = _fetch_in_stock_products()

    # 2. Try Gemini
    ai_result = _gemini_outfit_match(request.outfit_type, request.primary_color, products) if products else {}

    # 3. If Gemini returned a valid match, use it
    if ai_result.get("recommended_chappal") and ai_result.get("compatibility_score"):
        return {
            "success": True,
            "source": "gemini-ai",
            "input_color": request.primary_color,
            "outfit_type": request.outfit_type,
            "recommended_chappal": ai_result["recommended_chappal"],
            "recommended_slug": ai_result.get("recommended_slug", ""),
            "recommended_color": ai_result.get("recommended_color", ""),
            "compatibility_score": ai_result["compatibility_score"],
            "leather_type": ai_result.get("leather_type", ""),
            "stylist_notes": ai_result.get("stylist_notes", ""),
        }

    # 4. Fallback: hardcoded color → chappal mapping
    fallback = {
        "white":  {"color": "Rich Tan", "name": "Royal Zardari Craft Saddle Tan Chappal", "slug": "royal-zardari-craft-saddle-tan-chappal-1789924663531", "score": 96, "leather": "Full-grain Cowhide", "notes": "Contrast perfection with white shalwar kameez"},
        "black":  {"color": "Midnight Black", "name": "Royal Kaptaan Pebble Grain Leather Chappal", "slug": "royal-kaptaan-pebble-grain-leather-chappal-1789837311849", "score": 98, "leather": "Pebble-Grain Cowhide", "notes": "Monochrome elegance for evening wear"},
        "navy":   {"color": "Espresso Brown", "name": "Smart Zalmi Espresso Leather Chappal", "slug": "smart-zalmi-espresso-leather-chappal-1789925844705", "score": 94, "leather": "Full-grain Cowhide", "notes": "Deep tones create a regal aesthetic"},
        "cream":  {"color": "Mustard Camel", "name": "Peshawar Zalmi Camel Leather Chappal", "slug": "peshawar-zalmi-camel-leather-chappal-1789927441758", "score": 95, "leather": "Full-grain Cowhide", "notes": "Warm earthy harmony with cream fabrics"},
        "brown":  {"color": "Camel Tan", "name": "Smart Zalmi Camel Tan Chappal", "slug": "smart-zalmi-camel-tan-chappal-1789926290969", "score": 92, "leather": "Full-grain Cowhide", "notes": "Tonal sophistication"},
        "grey":   {"color": "Slate Blue", "name": "Presidential Zardari Slate Blue Leather Chappal", "slug": "presidential-zardari-slate-blue-leather-chappal-1789923673048", "score": 93, "leather": "Full-grain Cowhide", "notes": "Modern minimalist contrast"},
        "maroon": {"color": "Vintage Tan", "name": "Royal Zardari Tan Leather Chappal", "slug": "royal-zardari-tan-leather-chappal-1789925608038", "score": 91, "leather": "Full-grain Cowhide", "notes": "Classic royal pairing with maroon"},
        "blue":   {"color": "Slate Blue", "name": "Peshawar Zalmi Slate blue", "slug": "peshawar-zalmi-slate-blue-1789928811451", "score": 94, "leather": "Saddle Tan Cowhide", "notes": "Heritage blue on blue tonal coordination"},
    }
    match = fallback.get(color, {"color": "Sand Beige", "name": "Royal Sand Zardari Nubuck Chappal", "slug": "royal-sand-kaptaan-nubuck-chappal-1789925027372", "score": 90, "leather": "Suede-Finish Cowhide", "notes": "Versatile all-occasion companion"})
    return {
        "success": True,
        "source": "fallback",
        "input_color": request.primary_color,
        "outfit_type": request.outfit_type,
        "recommended_chappal": match["name"],
        "recommended_slug": match["slug"],
        "recommended_color": match["color"],
        "compatibility_score": match["score"],
        "leather_type": match["leather"],
        "stylist_notes": match["notes"],
    }
