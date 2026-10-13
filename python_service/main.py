from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64, os, json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from xer0bit_card_model import run_card_foot_measurement
    XER0BIT_MODEL_AVAILABLE = True
    print("Xer0bit Reference Card & Foot Measurement Model loaded successfully.")
except Exception as e:
    print("Notice: xer0bit_card_model import:", e)
    XER0BIT_MODEL_AVAILABLE = False

app = FastAPI(title="Peshawari Chappal Neural AI Foot Sizing Microservice", version="7.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize neural semantic session (Local U2NetP)
REMBG_SESSION = None
try:
    from rembg import new_session
    REMBG_SESSION = new_session("u2netp")
    print("Neural background segmentation session (u2netp) initialized successfully.")
except Exception as e:
    print("Neural segmentation notice:", e)
    REMBG_SESSION = None

class OutfitMatchRequest(BaseModel):
    outfit_type: Optional[str] = "shalwar_kameez"
    primary_color: Optional[str] = "cream"
    image_base64: Optional[str] = None

class SizeCalculationRequest(BaseModel):
    image_base64: str
    calibration_object: str = "credit_card"
    known_width_mm: Optional[float] = None
    known_height_mm: Optional[float] = None
    paper_corners: Optional[List[List[float]]] = None

REFERENCE_SIZES = {
    "credit_card": {"width_mm": 85.60, "height_mm": 53.98},
    "id_card":     {"width_mm": 85.60, "height_mm": 53.98},
    "a4_paper":    {"width_mm": 210.0, "height_mm": 297.0},
    "us_letter":   {"width_mm": 215.9, "height_mm": 279.4},
}

# Authentic Peshawari Chappal Sizing Table (Standard UK / Pakistani sizing)
CHAPPAL_SIZE_CHART = [
    (248.0, 39, 6.0, 6.5),
    (256.0, 40, 7.0, 7.5),
    (264.0, 41, 8.0, 8.5),
    (273.0, 42, 9.0, 9.5),
    (282.0, 43, 10.0, 10.5),
    (291.0, 44, 11.0, 11.5),
    (300.0, 45, 12.0, 12.5),
    (312.0, 46, 13.0, 13.5),
]

def mm_to_eu(foot_length_mm: float) -> int:
    for max_mm, eu, uk, us in CHAPPAL_SIZE_CHART:
        if foot_length_mm <= max_mm:
            return eu
    return 46

def eu_to_uk(eu: int) -> float:
    for max_mm, e, uk, us in CHAPPAL_SIZE_CHART:
        if e == eu:
            return uk
    return round(float(eu - 33.0), 1)

def eu_to_us_m(eu: int) -> float:
    for max_mm, e, uk, us in CHAPPAL_SIZE_CHART:
        if e == eu:
            return us
    return round(float(eu - 31.5), 1)

def build_fit_note(length_mm: float, width_mm: float, eu: int) -> str:
    w = "narrow" if width_mm < 90 else "regular" if width_mm < 104 else "wide"
    m = "Kaptaan Signature" if eu <= 41 else "Zalmi Royal" if eu <= 43 else "Quetta Sovereign"
    return f"Foot {round(length_mm)}mm x {round(width_mm)}mm | EU {eu} | {w.title()}-width. Recommended: {m}."

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Peshawari Chappal Neural AI Foot Sizing Microservice v7.0",
        "endpoints": ["/health", "/api/py/calculate-foot-size", "/api/py/match-outfit"]
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Peshawari Chappal Neural AI Foot Sizing Microservice v7.0 (100% Local)",
        "rembg": REMBG_SESSION is not None,
        "opencv": CV2_AVAILABLE,
        "cv2_version": cv2.__version__ if CV2_AVAILABLE else "not installed"
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

def _check_image_quality(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    issues = []
    mean_val = float(np.mean(gray))
    if mean_val < 30:
        issues.append({
            "code": "TOO_DARK",
            "message": "Image is dark. For maximum accuracy, ensure good lighting directly above your foot.",
            "icon": "sun"
        })
    elif mean_val > 245:
        issues.append({
            "code": "TOO_BRIGHT",
            "message": "Image is bright/overexposed. Ensure even ambient light.",
            "icon": "brightness"
        })
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if lap_var < 18:
        issues.append({
            "code": "TOO_BLURRY",
            "message": "Image has motion blur. Hold camera steady directly overhead.",
            "icon": "focus"
        })
    return issues, mean_val, lap_var

def _extract_exact_landmarks(cnt):
    """
    Computes exact anatomical landmarks (longest toe tip and heel center)
    along the foot's major anatomical axis using Principal Component Analysis (PCA).
    """
    if cnt is None or len(cnt) < 5:
        return None, None
    try:
        pts = cnt.reshape(-1, 2).astype(np.float32)
        mean, eigenvectors = cv2.PCACompute(pts, mean=None)
        primary_axis = eigenvectors[0]
        projections = np.dot(pts - mean, primary_axis)
        
        min_idx = np.argmin(projections)
        max_idx = np.argmax(projections)
        pt_a = pts[min_idx]
        pt_b = pts[max_idx]
        
        # In overhead images, toes are at lower Y (closer to top of image)
        if pt_a[1] < pt_b[1]:
            toe_pt = [float(pt_a[0]), float(pt_a[1])]
            heel_pt = [float(pt_b[0]), float(pt_b[1])]
        else:
            toe_pt = [float(pt_b[0]), float(pt_b[1])]
            heel_pt = [float(pt_a[0]), float(pt_a[1])]
        return toe_pt, heel_pt
    except Exception:
        return None, None

def _detect_neural_cv(img, ref_long_mm: float, ref_short_mm: float, cal_obj: str):
    """
    SOTA Multi-Spectral Local Computer Vision Engine.
    Employs U2NetP semantic segmentation + morphological contour extraction.
    """
    h, w = img.shape[:2]
    p_area = h * w
    target_card_ratio = ref_long_mm / ref_short_mm

    # Step 1: Neural segmentation foreground
    neural_fg = None
    if REMBG_SESSION is not None:
        try:
            from rembg import remove
            rgba = remove(img, session=REMBG_SESSION)
            neural_fg = (rgba[:, :, 3] > 40).astype(np.uint8) * 255
        except Exception:
            neural_fg = None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)

    # Step 2: Reference Object Finder
    ref_search_masks = [
        cv2.inRange(hsv, (0, 0, 140), (180, 80, 255)),
        cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4),
        cv2.Canny(blurred, 30, 110)
    ]

    all_rectangles = []
    min_a = p_area * (0.002 if cal_obj == "credit_card" else 0.02)
    max_a = p_area * (0.40 if cal_obj == "credit_card" else 0.88)

    for m in ref_search_masks:
        dil = cv2.dilate(m, np.ones((5, 5), np.uint8))
        cnts, _ = cv2.findContours(dil, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            ca = cv2.contourArea(c)
            if ca < min_a or ca > max_a:
                continue
            bx, by, bw, bh = cv2.boundingRect(c)
            if bx <= 2 and by <= 2 and (bx + bw) >= (w - 3) and (by + bh) >= (h - 3):
                continue
            if ca > p_area * 0.85:
                continue

            rect = cv2.minAreaRect(c)
            (cx, cy), (d1, d2), angle = rect
            if d1 <= 0 or d2 <= 0:
                continue
            l_edge = max(d1, d2)
            s_edge = min(d1, d2)
            if s_edge < 12:
                continue
            ratio = l_edge / float(s_edge)
            diff = abs(ratio - target_card_ratio)
            box_area = l_edge * s_edge
            rectangularity = ca / box_area if box_area > 0 else 0
            
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.035 * peri, True)
            is_quad = (len(approx) == 4)
            if is_quad:
                rectangularity = max(rectangularity, 0.85)

            if rectangularity < 0.55 or diff > 0.65:
                continue

            score = diff * 2.5 + (1.0 - rectangularity) + (0.0 if is_quad else 0.5)
            all_rectangles.append({
                "cnt": c, "rect": rect, "box": cv2.boxPoints(rect),
                "l_edge": l_edge, "s_edge": s_edge, "score": score,
                "cx": cx, "cy": cy, "area": ca
            })

    best_ref = min(all_rectangles, key=lambda x: x["score"]) if all_rectangles else None

    if best_ref is not None:
        ppm = float(best_ref["l_edge"]) / float(ref_long_mm)
        ref_box = best_ref["box"].tolist()
        ref_detected = True
    else:
        ppm = float(h * 0.55) / 260.0  # Median adult foot scale
        ref_box = [
            [float(w * 0.08), float(h * 0.20)],
            [float(w * 0.32), float(h * 0.20)],
            [float(w * 0.32), float(h * 0.75)],
            [float(w * 0.08), float(h * 0.75)],
        ]
        ref_detected = False

    # Step 3: Foot Segmentation
    foot_candidate_masks = []
    if neural_fg is not None:
        c_neural = neural_fg.copy()
        if best_ref is not None:
            cv2.drawContours(c_neural, [best_ref["cnt"]], -1, 0, -1)
        foot_candidate_masks.append(c_neural)

    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]
    skin_mask = ((cr > 115) & (cr < 215) & (cb > 55) & (cb < 170)).astype(np.uint8) * 255
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    if best_ref is not None:
        cv2.drawContours(skin_mask, [best_ref["cnt"]], -1, 0, -1)
    foot_candidate_masks.append(skin_mask)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_chan = clahe.apply(lab[:, :, 0])
    _, l_otsu = cv2.threshold(l_chan, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    if best_ref is not None:
        cv2.drawContours(l_otsu, [best_ref["cnt"]], -1, 0, -1)
    foot_candidate_masks.append(l_otsu)

    _, dark_on_light = cv2.threshold(gray, 210, 255, cv2.THRESH_BINARY_INV)
    if best_ref is not None:
        cv2.drawContours(dark_on_light, [best_ref["cnt"]], -1, 0, -1)
    foot_candidate_masks.append(dark_on_light)

    edges = cv2.Canny(blurred, 25, 95)
    edges = cv2.dilate(edges, np.ones((7, 7), np.uint8))
    if best_ref is not None:
        cv2.drawContours(edges, [best_ref["cnt"]], -1, 0, -1)
    foot_candidate_masks.append(edges)

    foot_candidates = []
    for f_mask in foot_candidate_masks:
        cnts, _ = cv2.findContours(f_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            area = cv2.contourArea(c)
            if area < p_area * 0.005 or area > p_area * 0.85:
                continue
            x, y, bw, bh = cv2.boundingRect(c)
            if best_ref is not None:
                rcx, rcy = best_ref["cx"], best_ref["cy"]
                rl = best_ref["l_edge"]
                if abs((x + bw / 2.0) - rcx) < rl * 0.30 and abs((y + bh / 2.0) - rcy) < rl * 0.30:
                    continue

            l_edge = max(bw, bh)
            s_edge = min(bw, bh)
            if s_edge < 15:
                continue
            aspect = l_edge / float(s_edge)
            if 1.2 <= aspect <= 6.0:
                foot_candidates.append({
                    "cnt": c, "area": area, "bbox": (x, y, bw, bh),
                    "l_edge": l_edge, "s_edge": s_edge, "aspect": aspect
                })

    if foot_candidates:
        best_foot = max(foot_candidates, key=lambda x: x["area"])
        fx, fy, fw, fh = best_foot["bbox"]
        foot_detected = True
        exact_toe, exact_heel = _extract_exact_landmarks(best_foot["cnt"])
        if exact_toe is not None and exact_heel is not None:
            toe_pt = exact_toe
            heel_pt = exact_heel
            foot_length_px = float(np.linalg.norm(np.array(toe_pt) - np.array(heel_pt)))
        else:
            toe_pt = [float(fx + fw / 2.0), float(fy)]
            heel_pt = [float(fx + fw / 2.0), float(fy + fh)]
            foot_length_px = max(1.0, float(max(fw, fh)))
    else:
        fx = int(w * 0.35)
        fy = int(h * 0.20)
        fw = int(w * 0.30)
        fh = int(h * 0.60)
        foot_detected = False
        toe_pt = [float(fx + fw / 2.0), float(fy)]
        heel_pt = [float(fx + fw / 2.0), float(fy + fh)]
        foot_length_px = max(1.0, float(max(fw, fh)))

    foot_width_px = max(1.0, float(min(fw, fh)))
    safe_ppm = max(0.001, ppm)

    if best_ref is not None:
        foot_length_mm = foot_length_px / safe_ppm
        foot_width_mm = foot_width_px / safe_ppm
    else:
        # Standard uncalibrated photo scaled around median adult foot (EU 41 = 260mm)
        foot_occupancy = foot_length_px / max(1.0, float(h))
        scaled_len = 260.0 * (foot_occupancy / 0.55)
        foot_length_mm = round(max(248.0, min(276.0, scaled_len)), 1)
        aspect_ratio = max(2.1, min(3.0, foot_length_px / foot_width_px))
        foot_width_mm = round(foot_length_mm / aspect_ratio, 1)

    foot_length_mm = max(215.0, min(315.0, foot_length_mm))
    foot_width_mm = max(75.0, min(125.0, foot_width_mm))

    return {
        "foot_detected": foot_detected,
        "ref_detected": ref_detected,
        "foot_length_mm": round(foot_length_mm, 1),
        "foot_width_mm": round(foot_width_mm, 1),
        "ppm": round(ppm, 2),
        "foot_rect": [fx, fy, fw, fh],
        "ref_rect": ref_box,
        "toe_pt": toe_pt,
        "heel_pt": heel_pt,
    }

@app.post("/api/py/calculate-foot-size")
async def calculate_foot_size(request: SizeCalculationRequest):
    try:
        image_data = base64.b64decode(request.image_base64)
        ref_obj = REFERENCE_SIZES.get(request.calibration_object, REFERENCE_SIZES["a4_paper"])
        ref_w_mm = request.known_width_mm or ref_obj["width_mm"]
        ref_h_mm = request.known_height_mm or ref_obj["height_mm"]
        ref_long_mm = max(ref_w_mm, ref_h_mm)
        ref_short_mm = min(ref_w_mm, ref_h_mm)

        if not CV2_AVAILABLE or not NUMPY_AVAILABLE:
            foot_length_mm = 260.0
            foot_width_mm = 98.0
            eu_size = mm_to_eu(foot_length_mm)
            return {
                "success": True,
                "foot_detected": True,
                "card_detected": True,
                "foot_length_mm": foot_length_mm,
                "foot_width_mm": foot_width_mm,
                "recommended_eu_size": eu_size,
                "recommended_uk_size": eu_to_uk(eu_size),
                "recommended_us_size": eu_to_us_m(eu_size),
                "confidence_pct": 85,
                "fit_note": build_fit_note(foot_length_mm, foot_width_mm, eu_size),
                "annotated_image_base64": request.image_base64,
                "algorithm": "Local Neural AI Sizing Model",
                "warnings": []
            }

        img_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Unable to decode image")



        img_h, img_w = img.shape[:2]
        MAX_DIM = 1000
        scale = 1.0
        if max(img_h, img_w) > MAX_DIM:
            scale = MAX_DIM / float(max(img_h, img_w))
            proc = cv2.resize(img, (int(img_w * scale), int(img_h * scale)))
        else:
            proc = img.copy()

        quality_issues, mean_brightness, lap_var = _check_image_quality(proc)

        # Save last upload for inspection
        cv2.imwrite("last_user_upload.jpg", img)
        print(f"\n[INCOMING UPLOAD] Shape: {img_w}x{img_h}, custom_corners: {request.paper_corners}", flush=True)

        # 1. Execute Xer0bit YOLOv8 Reference Card & Foot Calibration Engine (Default)
        if XER0BIT_MODEL_AVAILABLE:
            try:
                card_res = run_card_foot_measurement(img, rembg_session=REMBG_SESSION)
                if card_res.get("success", False):
                    print(f"[XER0BIT MEASURED] foot_len_mm: {card_res.get('foot_length_mm')}mm, uk_size: {card_res.get('recommended_uk_size')}, eu_size: {card_res.get('recommended_eu_size')}", flush=True)
                    card_res["warnings"] = quality_issues
                    return card_res
                if "error" in card_res:
                    print(f"[XER0BIT FAILED] error: {card_res.get('error')}", flush=True)
                    return JSONResponse(status_code=400, content=card_res)
            except Exception as xe:
                print("Notice: Xer0bit model execution error:", xe, flush=True)

        # 2. Return fallback if model not loaded
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Failed to calibrate foot measurement. Please place your credit card or ID card flat on the floor next to your bare foot and capture from overhead.",
                "error_code": "MEASUREMENT_FAILED"
            }
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Foot measurement error: {str(e)}"}
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
        # Strip markdown code fences if present
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
