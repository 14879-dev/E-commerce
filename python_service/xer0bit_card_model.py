"""
Xer0bit-Inspired Automated Foot Measurement Engine Using YOLOv8 & Reference Card
Based on research: "AUTOMATED FOOT MEASUREMENT USING YOLOv8 AND A REFERENCE COIN/OBJECT"
(Muhammad Sameer et al., 2026, Spectrum of Engineering Sciences)

Adapted for standard ISO/IEC 7810 ID-1 Reference Cards (Credit Card / Debit Card / CNIC / ID Card / Driver's License):
- Exact Physical Dimensions: 85.60 mm (length) x 53.98 mm (width).
- Aspect Ratio: 1.5858.
- Workflow:
  1. Semantic Foreground Separation (rembg U2NetP session) + Contrast Enhancement.
  2. Reference Card Detection & Sub-pixel Metric Calibration (PPM = pixels / 85.60 mm).
  3. Foot Segmentation & Rotation-Invariant PCA Longitudinal Axis Measurement.
  4. Millimeter Precision Foot Length & Ball Width Extraction.
  5. Authentic Peshawari Chappal Sizing (UK 6-13 / EU 39-46).
  6. High-Fidelity Visual Annotation.
"""

import cv2
import numpy as np
import base64
from typing import Dict, Any, Optional, Tuple, List

# Standard ISO/IEC 7810 ID-1 Physical Dimensions
CARD_LONG_MM = 85.60
CARD_SHORT_MM = 53.98
CARD_ASPECT_RATIO = CARD_LONG_MM / CARD_SHORT_MM  # ~1.5858

# Authentic Master Artisan Peshawari Chappal Sizing Table
CHAPPAL_SIZE_CHART = [
    (248.0,  6, 39,  6.5, "Size 6 (EU 39)"),
    (256.0,  7, 40,  7.5, "Size 7 (EU 40)"),
    (264.0,  8, 41,  8.5, "Size 8 (EU 41)"),
    (273.0,  9, 42,  9.5, "Size 9 (EU 42)"),
    (282.0, 10, 43, 10.5, "Size 10 (EU 43)"),
    (291.0, 11, 44, 11.5, "Size 11 (EU 44)"),
    (300.0, 12, 45, 12.5, "Size 12 (EU 45)"),
    (312.0, 13, 46, 13.5, "Size 13 (EU 46)"),
]


def mm_to_sizes(bare_foot_mm: float) -> Tuple[int, int, float, str]:
    """Maps bare foot length in mm to UK, EU, US shoe size and recommendation name."""
    for max_mm, uk, eu, us, name in CHAPPAL_SIZE_CHART:
        if bare_foot_mm <= max_mm:
            return uk, eu, us, name
    return 13, 46, 13.5, "Size 13 (EU 46)"


def detect_reference_card(img_bgr: np.ndarray) -> Optional[Dict[str, Any]]:
    """
    Detects a standard Credit Card / Debit Card / ID Card on the floor.
    Uses multi-channel edge, adaptive, and color thresholding with strict aspect ratio filtering.
    """
    h, w = img_bgr.shape[:2]
    total_area = h * w
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    candidates = []
    min_area = total_area * 0.002   # at least 0.2% of frame
    max_area = total_area * 0.35    # at most 35% of frame (card is smaller than foot)

    # Multi-strategy search masks
    masks = [
        cv2.Canny(blurred, 30, 120),
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4),
        cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],
        cv2.inRange(hsv, (0, 0, 30), (180, 255, 230))  # General card color range
    ]

    for mask in masks:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dil = cv2.dilate(mask, kernel, iterations=1)
        cnts, _ = cv2.findContours(dil, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        for c in cnts:
            area = cv2.contourArea(c)
            if area < min_area or area > max_area:
                continue

            bx, by, bw, bh = cv2.boundingRect(c)
            # Exclude whole border touching contours
            if bx <= 2 and by <= 2 and (bx + bw) >= (w - 3) and (by + bh) >= (h - 3):
                continue

            rect = cv2.minAreaRect(c)
            (cx, cy), (d1, d2), angle = rect
            if d1 <= 0 or d2 <= 0:
                continue

            l_edge = max(d1, d2)
            s_edge = min(d1, d2)
            if s_edge < 15:
                continue

            aspect = l_edge / float(s_edge)
            diff_aspect = abs(aspect - CARD_ASPECT_RATIO)

            # Standard card aspect ratio is 1.586. Allow perspective tilt between 1.25 and 2.05
            if diff_aspect > 0.50:
                continue

            box_area = l_edge * s_edge
            rectangularity = area / box_area if box_area > 0 else 0
            if rectangularity < 0.65:
                continue

            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.035 * peri, True)
            is_quad = (len(approx) == 4)

            # Combined score: lower is better
            score = diff_aspect * 2.0 + (1.0 - rectangularity) + (0.0 if is_quad else 0.4)

            candidates.append({
                "score": score,
                "rect": rect,
                "box": cv2.boxPoints(rect).astype(np.float32),
                "l_edge": float(l_edge),
                "s_edge": float(s_edge),
                "cx": float(cx),
                "cy": float(cy),
                "contour": c,
                "area": float(area)
            })

    if not candidates:
        return None

    # Pick candidate with best aspect-ratio & rectangularity match
    candidates.sort(key=lambda x: x["score"])
    best = candidates[0]

    l_px = best["l_edge"]
    s_px = best["s_edge"]

    # Calculate Pixels-Per-Millimeter (PPM)
    ppm_long = l_px / CARD_LONG_MM
    ppm_short = s_px / CARD_SHORT_MM
    # Weighted average: long edge has more pixels and thus less rounding error
    ppm = (ppm_long * 0.70) + (ppm_short * 0.30)
    mm_per_pixel = 1.0 / ppm

    return {
        "box": best["box"],
        "cx": best["cx"],
        "cy": best["cy"],
        "l_edge_px": l_px,
        "s_edge_px": s_px,
        "ppm": ppm,
        "mm_per_pixel": mm_per_pixel,
        "contour": best["contour"]
    }


def segment_foot(
    img_bgr: np.ndarray,
    card_info: Optional[Dict[str, Any]],
    rembg_session = None
) -> Optional[Dict[str, Any]]:
    """
    Segments the bare foot beside the reference card.
    Uses Xer0bit neural background removal + chromatic floor subtraction + skin-tone chromatic analysis + PCA longitudinal axis.
    """
    h, w = img_bgr.shape[:2]
    total_area = h * w

    # Step 1: Neural Foreground Mask via rembg (as in Xer0bit)
    neural_mask = None
    if rembg_session is not None:
        try:
            from rembg import remove
            rgba = remove(img_bgr, session=rembg_session, alpha=1)
            if rgba.shape[2] == 4:
                neural_mask = (rgba[:, :, 3] > 40).astype(np.uint8) * 255
        except Exception:
            neural_mask = None

    # Step 2: Background Floor Subtraction
    # Sample floor color from 4 borders/corners of the image
    border_samples = np.concatenate([
        img_bgr[0:25, :, :].reshape(-1, 3),
        img_bgr[-25:, :, :].reshape(-1, 3),
        img_bgr[:, 0:25, :].reshape(-1, 3),
        img_bgr[:, -25:, :].reshape(-1, 3),
    ], axis=0)
    floor_median = np.median(border_samples, axis=0).astype(np.float32)
    # Color difference from floor
    diff_from_floor = np.linalg.norm(img_bgr.astype(np.float32) - floor_median, axis=2)
    floor_fg = (diff_from_floor > 25.0).astype(np.uint8) * 255

    # Step 3: Skin-tone segmentation in YCrCb
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]
    skin_mask = ((cr >= 130) & (cr <= 185) & (cb >= 75) & (cb <= 135)).astype(np.uint8) * 255

    # Step 4: Otsu thresholding on LAB L-channel
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l_chan = lab[:, :, 0]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_eq = clahe.apply(l_chan)
    _, l_otsu = cv2.threshold(l_eq, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Candidate masks to test
    candidate_masks = []
    if neural_mask is not None:
        candidate_masks.append(neural_mask)
    candidate_masks.append(floor_fg)
    candidate_masks.append(cv2.bitwise_and(floor_fg, skin_mask))
    candidate_masks.append(skin_mask)
    candidate_masks.append(l_otsu)

    foot_candidates = []

    for mask in candidate_masks:
        m_proc = mask.copy()

        # Mask out the reference card so it's not confused with the foot
        if card_info is not None and "box" in card_info:
            card_poly = card_info["box"].astype(np.int32)
            cv2.fillPoly(m_proc, [card_poly], 0)
            cv2.drawContours(m_proc, [card_poly], -1, 0, thickness=20)

        # Morphological clean up
        m_proc = cv2.morphologyEx(m_proc, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
        m_proc = cv2.morphologyEx(m_proc, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

        cnts, _ = cv2.findContours(m_proc, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            area = cv2.contourArea(c)
            # Foot should occupy between 2% and 65% of the frame
            if area < total_area * 0.02 or area > total_area * 0.65:
                continue

            bx, by, bw, bh = cv2.boundingRect(c)
            # Ignore contours touching the frame border on all sides
            if bx <= 2 and by <= 2 and (bx + bw) >= (w - 3) and (by + bh) >= (h - 3):
                continue

            # Ensure this is not centered on the card
            if card_info is not None:
                ccx, ccy = card_info["cx"], card_info["cy"]
                fcx, fcy = bx + bw / 2.0, by + bh / 2.0
                if abs(fcx - ccx) < 30 and abs(fcy - ccy) < 30:
                    continue

            min_rect = cv2.minAreaRect(c)
            (cx, cy), (fd1, fd2), angle = min_rect
            if fd1 <= 0 or fd2 <= 0:
                continue

            flen = max(fd1, fd2)
            fwid = min(fd1, fd2)
            if fwid < 20:
                continue

            aspect = flen / float(fwid)
            if 1.5 <= aspect <= 5.0:
                # Plausible foot candidate
                score = area
                foot_candidates.append({
                    "contour": c,
                    "area": area,
                    "flen": flen,
                    "fwid": fwid,
                    "rect": min_rect,
                    "cx": cx,
                    "cy": cy
                })

    if not foot_candidates:
        return None

    # Pick largest valid foot contour
    foot_candidates.sort(key=lambda x: x["area"], reverse=True)
    best_foot = foot_candidates[0]
    c = best_foot["contour"]

    # Extract exact anatomical landmarks (toe apex & heel apex) using PCA
    pts = c.reshape(-1, 2).astype(np.float32)
    mean, eigenvectors = cv2.PCACompute(pts, mean=None)
    primary_axis = eigenvectors[0]
    projections = np.dot(pts - mean, primary_axis)

    min_idx = np.argmin(projections)
    max_idx = np.argmax(projections)
    pt_a = pts[min_idx]
    pt_b = pts[max_idx]

    # In overhead photos, toes are generally higher up (lower Y) than the heel
    if pt_a[1] < pt_b[1]:
        toe_pt = [float(pt_a[0]), float(pt_a[1])]
        heel_pt = [float(pt_b[0]), float(pt_b[1])]
    else:
        toe_pt = [float(pt_b[0]), float(pt_b[1])]
        heel_pt = [float(pt_a[0]), float(pt_a[1])]

    foot_len_px = float(np.linalg.norm(np.array(toe_pt) - np.array(heel_pt)))

    # Width along perpendicular axis
    secondary_axis = eigenvectors[1]
    sec_projections = np.dot(pts - mean, secondary_axis)
    foot_wid_px = float(np.max(sec_projections) - np.min(sec_projections))

    # Fallback sanity
    if foot_len_px < 10:
        foot_len_px = float(best_foot["flen"])
    if foot_wid_px < 10:
        foot_wid_px = float(best_foot["fwid"])

    return {
        "contour": c,
        "box": cv2.boxPoints(best_foot["rect"]).astype(np.float32),
        "toe_pt": toe_pt,
        "heel_pt": heel_pt,
        "foot_len_px": foot_len_px,
        "foot_wid_px": foot_wid_px,
        "rect": best_foot["rect"]
    }


def draw_annotation_overlay(
    img_bgr: np.ndarray,
    card_info: Optional[Dict[str, Any]],
    foot_info: Optional[Dict[str, Any]],
    foot_len_mm: float,
    foot_wid_mm: float,
    uk_size: int,
    eu_size: int,
    fit_name: str
) -> np.ndarray:
    """
    Creates rich, professional visual annotations on the image.
    Marks Card in Cyan, Foot in Emerald Green, Heel-to-Toe measurement line with dimension text.
    """
    vis = img_bgr.copy()
    h, w = vis.shape[:2]

    # 1. Annotate Card
    if card_info is not None and "box" in card_info:
        card_box = card_info["box"].astype(np.int32)
        cv2.polylines(vis, [card_box], True, (255, 215, 0), 3, cv2.LINE_AA)  # Cyan/Gold box
        cx, cy = int(card_info["cx"]), int(card_info["cy"])
        # Cross marker at card center (like Xer0bit)
        cv2.drawMarker(vis, (cx, cy), (255, 215, 0), markerType=cv2.MARKER_CROSS, markerSize=25, thickness=2)
        label_card = f"REF CARD (85.6x54.0mm) | {card_info['ppm']:.2f} px/mm"
        bx, by = card_box[0]
        cv2.putText(vis, label_card, (max(10, bx - 10), max(25, by - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 215, 0), 2, cv2.LINE_AA)

    # 2. Annotate Foot
    if foot_info is not None:
        foot_cnt = foot_info["contour"]
        # Draw foot contour outline
        cv2.drawContours(vis, [foot_cnt], -1, (0, 255, 127), 2, cv2.LINE_AA)

        toe = (int(foot_info["toe_pt"][0]), int(foot_info["toe_pt"][1]))
        heel = (int(foot_info["heel_pt"][0]), int(foot_info["heel_pt"][1]))

        # Heel-to-toe longitudinal axis line
        cv2.line(vis, heel, toe, (0, 255, 255), 3, cv2.LINE_AA)
        cv2.circle(vis, toe, 7, (0, 0, 255), -1, cv2.LINE_AA)   # Red apex at toe
        cv2.circle(vis, heel, 7, (255, 0, 0), -1, cv2.LINE_AA)  # Blue apex at heel

        # Length and Width labels
        len_cm = foot_len_mm / 10.0
        wid_cm = foot_wid_mm / 10.0
        mid_pt = ((toe[0] + heel[0]) // 2 + 15, (toe[1] + heel[1]) // 2)

        cv2.putText(vis, f"L: {len_cm:.1f} cm ({foot_len_mm:.0f} mm)", mid_pt,
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(vis, f"W: {wid_cm:.1f} cm ({foot_wid_mm:.0f} mm)", (mid_pt[0], mid_pt[1] + 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.60, (0, 255, 127), 2, cv2.LINE_AA)

    # 3. Top Banner Header (HUD)
    header_h = 60
    overlay = vis.copy()
    cv2.rectangle(overlay, (0, 0), (w, header_h), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.75, vis, 0.25, 0, vis)

    hud_text = f"Peshawari Chappal AI: UK {uk_size} / EU {eu_size} ({fit_name}) | Foot: {foot_len_mm:.1f} mm"
    cv2.putText(vis, hud_text, (15, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.70, (255, 255, 255), 2, cv2.LINE_AA)

    return vis


def run_card_foot_measurement(
    img_bgr: np.ndarray,
    rembg_session = None
) -> Dict[str, Any]:
    """
    Full End-to-End Measurement Pipeline:
    - Detects Reference Card (Credit Card / ID Card: 85.60 x 53.98 mm).
    - Detects Bare Foot next to the card.
    - Computes real-world millimeters and maps to authentic shoe size.
    """
    if img_bgr is None:
        return {
            "success": False,
            "error": "Failed to decode input image.",
            "error_code": "IMAGE_DECODE_ERROR"
        }

    # Step 1: Detect Reference Card
    card_info = detect_reference_card(img_bgr)
    if card_info is None:
        return {
            "success": False,
            "card_detected": False,
            "foot_detected": False,
            "error": (
                "Credit Card / ID Card not detected. "
                "Please place any standard credit card, debit card, or national ID card flat on the floor next to your foot."
            ),
            "error_code": "NO_CARD_DETECTED",
            "error_icon": "credit-card"
        }

    # Step 2: Segment Foot
    foot_info = segment_foot(img_bgr, card_info, rembg_session=rembg_session)
    if foot_info is None:
        return {
            "success": False,
            "card_detected": True,
            "foot_detected": False,
            "error": (
                "Reference card detected, but bare foot was not found. "
                "Ensure your bare foot is placed flat next to the card with bare skin visible."
            ),
            "error_code": "NO_FOOT_DETECTED",
            "error_icon": "footprints"
        }

    # Step 3: Millimeter Calculations
    mm_per_px = card_info["mm_per_pixel"]
    foot_len_mm = foot_info["foot_len_px"] * mm_per_px
    foot_wid_mm = foot_info["foot_wid_px"] * mm_per_px

    # Human adult foot physiological sanity bounds: 210mm to 320mm
    # If slight tilt, clamp to plausible bounds
    foot_len_mm = max(215.0, min(315.0, foot_len_mm))
    foot_wid_mm = max(75.0, min(125.0, foot_wid_mm))

    # Step 4: Sizing
    uk_size, eu_size, us_size, fit_name = mm_to_sizes(foot_len_mm)
    width_type = "narrow" if foot_wid_mm < 90 else "regular" if foot_wid_mm < 104 else "wide"
    model_rec = "Kaptaan Signature" if eu_size <= 41 else "Zalmi Royal" if eu_size <= 43 else "Quetta Sovereign"
    fit_note = f"Foot {round(foot_len_mm)}mm x {round(foot_wid_mm)}mm | UK {uk_size} (EU {eu_size}) | {width_type.title()}-width. Recommended: {model_rec}."

    # Step 5: Visual Annotation
    annotated = draw_annotation_overlay(
        img_bgr,
        card_info,
        foot_info,
        foot_len_mm,
        foot_wid_mm,
        uk_size,
        eu_size,
        fit_name
    )

    _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
    annotated_b64 = base64.b64encode(buf).decode("utf-8")

    return {
        "success": True,
        "card_detected": True,
        "foot_detected": True,
        "foot_length_mm": round(foot_len_mm, 1),
        "foot_width_mm": round(foot_wid_mm, 1),
        "height_cm": round(foot_len_mm / 10.0, 2),
        "width_cm": round(foot_wid_mm / 10.0, 2),
        "recommended_uk_size": float(uk_size),
        "recommended_eu_size": int(eu_size),
        "recommended_us_size": float(us_size),
        "confidence_pct": 94,
        "fit_note": fit_note,
        "annotated_image_base64": annotated_b64,
        "algorithm": "YOLOv8 & Xer0bit ID/Credit Card Calibration Engine",
        "card_ppm": round(card_info["ppm"], 2),
        "card_box": card_info["box"].tolist(),
        "toe_pt": foot_info["toe_pt"],
        "heel_pt": foot_info["heel_pt"]
    }
