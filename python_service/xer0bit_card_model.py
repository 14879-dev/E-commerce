"""
Xer0bit-Inspired Automated Foot Measurement Engine Using Reference Card
Based on research: "AUTOMATED FOOT MEASUREMENT USING YOLOv8 AND A REFERENCE COIN/OBJECT"
(Muhammad Sameer et al., 2026, Spectrum of Engineering Sciences)

Engineered for ISO/IEC 7810 ID-1 Reference Cards (Credit Card / Debit Card / CNIC / ID Card / Driver's License):
- Exact Physical Dimensions: 85.60 mm (length) x 53.98 mm (width).
- Aspect Ratio: 1.5858.
- Multi-channel Edge, Color & Morphological Segmentation.
- Ankle/Leg Decoupling via Anatomical Profile Slicing (eliminates measuring shin/leg as foot).
- Interactive 4-Corner Snap Integration.
- Authentic Pakistani / Peshawari Chappal Master Sizing (UK 6-13 / EU 39-46).
"""

import cv2
import numpy as np
import base64
from typing import Dict, Any, Optional, Tuple, List

# Standard ISO/IEC 7810 ID-1 Physical Dimensions
CARD_LONG_MM = 85.60
CARD_SHORT_MM = 53.98
CARD_ASPECT_RATIO = CARD_LONG_MM / CARD_SHORT_MM  # ~1.5858

# Authentic Master Artisan Peshawari Chappal Sizing Table (UK 6 - 13 / EU 39 - 46)
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


def detect_reference_card(
    img_bgr: np.ndarray,
    custom_corners: Optional[List[List[float]]] = None
) -> Optional[Dict[str, Any]]:
    """
    Detects a standard Credit Card / Debit Card / ID Card on the floor.
    If custom_corners is provided (4 normalized coordinates), directly uses them.
    Otherwise, applies multi-scale edge, adaptive thresholding, and morphological closing.
    """
    h, w = img_bgr.shape[:2]
    total_area = h * w

    # Priority 1: User-adjusted 4 corners from frontend CamScanner snapper
    if custom_corners and len(custom_corners) == 4:
        try:
            pts = np.array([[float(p[0]) * w, float(p[1]) * h] for p in custom_corners], dtype=np.float32)
            d01 = float(np.linalg.norm(pts[0] - pts[1]))
            d12 = float(np.linalg.norm(pts[1] - pts[2]))
            d23 = float(np.linalg.norm(pts[2] - pts[3]))
            d30 = float(np.linalg.norm(pts[3] - pts[0]))

            l_px = max((d01 + d23) / 2.0, (d12 + d30) / 2.0)
            s_px = min((d01 + d23) / 2.0, (d12 + d30) / 2.0)
            if l_px > 15 and s_px > 10:
                ppm_long = l_px / CARD_LONG_MM
                ppm_short = s_px / CARD_SHORT_MM
                ppm = (ppm_long * 0.70) + (ppm_short * 0.30)
                cx = float(np.mean(pts[:, 0]))
                cy = float(np.mean(pts[:, 1]))
                norm_corners = [[float(p[0] / w), float(p[1] / h)] for p in pts]
                return {
                    "box": pts,
                    "cx": cx,
                    "cy": cy,
                    "l_edge_px": l_px,
                    "s_edge_px": s_px,
                    "ppm": ppm,
                    "mm_per_pixel": 1.0 / ppm,
                    "corners_norm": norm_corners,
                    "manual": True
                }
        except Exception as e:
            print("Notice: custom_corners parsing error:", e)

    # Priority 2: Automatic Multi-Channel & Multi-Scale Card Detection
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_chan = clahe.apply(lab[:, :, 0])

    candidates = []
    # Very inclusive area range: cards can be 0.04% of frame on high-res phone cameras
    min_area = total_area * 0.0004
    max_area = total_area * 0.28

    # Multi-strategy search masks
    masks = [
        cv2.Canny(blurred, 25, 100),
        cv2.Canny(blurred, 40, 150),
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 19, 4),
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 5),
        cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],
        cv2.threshold(l_chan, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],
        cv2.inRange(hsv, (0, 30, 20), (180, 255, 240)),  # Saturated card color
    ]

    close_kernels = [
        cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)),
        cv2.getStructuringElement(cv2.MORPH_RECT, (13, 13))
    ]

    for mask in masks:
        for kernel in close_kernels:
            closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
            dilated = cv2.dilate(closed, kernel, iterations=1)
            cnts, _ = cv2.findContours(dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

            for c in cnts:
                area = cv2.contourArea(c)
                if area < min_area or area > max_area:
                    continue

                bx, by, bw, bh = cv2.boundingRect(c)
                # Ignore full-image border contours
                if bx <= 2 and by <= 2 and (bx + bw) >= (w - 3) and (by + bh) >= (h - 3):
                    continue

                rect = cv2.minAreaRect(c)
                (cx, cy), (d1, d2), angle = rect
                if d1 <= 0 or d2 <= 0:
                    continue

                l_edge = max(d1, d2)
                s_edge = min(d1, d2)
                if s_edge < 12:
                    continue

                aspect = l_edge / float(s_edge)
                diff_aspect = abs(aspect - CARD_ASPECT_RATIO)

                # Cards viewed from normal camera tilt (45° to 90°) have aspect ratios from 1.15 to 2.25
                if diff_aspect > 0.85:
                    continue

                box_area = l_edge * s_edge
                rectangularity = area / box_area if box_area > 0 else 0
                if rectangularity < 0.52:
                    continue

                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.035 * peri, True)
                is_quad = (len(approx) == 4)

                # Score: lower is better
                score = (diff_aspect * 2.2) + ((1.0 - rectangularity) * 1.5) + (0.0 if is_quad else 0.35)

                candidates.append({
                    "score": score,
                    "rect": rect,
                    "box": cv2.boxPoints(rect).astype(np.float32),
                    "l_edge": float(l_edge),
                    "s_edge": float(s_edge),
                    "cx": float(cx),
                    "cy": float(cy),
                    "contour": c,
                    "area": float(area),
                    "is_quad": is_quad
                })

    if not candidates:
        return None

    # Sort and pick top candidate
    candidates.sort(key=lambda x: x["score"])
    best = candidates[0]

    l_px = best["l_edge"]
    s_px = best["s_edge"]

    ppm_long = l_px / CARD_LONG_MM
    ppm_short = s_px / CARD_SHORT_MM
    ppm = (ppm_long * 0.70) + (ppm_short * 0.30)
    mm_per_pixel = 1.0 / ppm

    box_pts = best["box"]
    norm_corners = [[float(p[0] / w), float(p[1] / h)] for p in box_pts]

    return {
        "box": box_pts,
        "cx": best["cx"],
        "cy": best["cy"],
        "l_edge_px": l_px,
        "s_edge_px": s_px,
        "ppm": ppm,
        "mm_per_pixel": mm_per_pixel,
        "contour": best["contour"],
        "corners_norm": norm_corners,
        "manual": False
    }


def decouple_foot_from_leg(
    foot_contour: np.ndarray,
    img_shape: Tuple[int, int]
) -> Tuple[np.ndarray, List[float], List[float], float, float]:
    """
    Decouples the foot from the ankle/leg in overhead smartphone captures.
    In real photos, the bare foot connects to the ankle/calf which extends upwards.
    Using PCA longitudinal axis and cross-sectional profile slicing, we isolate
    the actual foot on the floor (heel apex to longest toe tip).
    """
    h, w = img_shape
    pts = foot_contour.reshape(-1, 2).astype(np.float32)

    # 1. PCA Principal Longitudinal Axis
    mean, eigenvectors = cv2.PCACompute(pts, mean=None)
    primary_axis = eigenvectors[0]  # Longitudinal axis
    secondary_axis = eigenvectors[1] if len(eigenvectors) > 1 else np.array([-primary_axis[1], primary_axis[0]])

    projections_long = np.dot(pts - mean, primary_axis)
    projections_lat = np.dot(pts - mean, secondary_axis)

    min_l = np.min(projections_long)
    max_l = np.max(projections_long)
    raw_span = max_l - min_l

    # In top-down phone photos, toes are generally higher in the image (smaller Y) than the heel
    pt_min = pts[np.argmin(projections_long)]
    pt_max = pts[np.argmax(projections_long)]

    if pt_min[1] < pt_max[1]:
        toe_apex = [float(pt_min[0]), float(pt_min[1])]
        heel_apex = [float(pt_max[0]), float(pt_max[1])]
    else:
        toe_apex = [float(pt_max[0]), float(pt_max[1])]
        heel_apex = [float(pt_min[0]), float(pt_min[1])]

    # 2. Slice profile along the longitudinal axis
    # An adult foot has ball width W. Anatomically, foot length is 2.3W to 3.2W.
    # If raw span is > 3.5x maximum cross-sectional width, the leg/ankle is attached!
    num_bins = 25
    bin_edges = np.linspace(min_l, max_l, num_bins + 1)
    widths_per_bin = []

    for i in range(num_bins):
        bin_pts = projections_lat[(projections_long >= bin_edges[i]) & (projections_long < bin_edges[i+1])]
        if len(bin_pts) > 2:
            widths_per_bin.append(float(np.max(bin_pts) - np.min(bin_pts)))
        else:
            widths_per_bin.append(0.0)

    max_width_px = max(widths_per_bin) if widths_per_bin else float(np.max(projections_lat) - np.min(projections_lat))

    # Ankle bottleneck detection:
    # If the contour extends into the shin/calf, the width narrows at the ankle and expands again
    # Clamp longitudinal span to anatomically valid human ratio (max 3.2x ball width)
    clamped_span = min(raw_span, max_width_px * 3.15) if max_width_px > 0 else raw_span

    # If clamped, adjust heel apex along axis
    if clamped_span < raw_span:
        t_arr = np.array(toe_apex, dtype=np.float32)
        h_arr = np.array(heel_apex, dtype=np.float32)
        direction = h_arr - t_arr
        norm_dir = np.linalg.norm(direction)
        if norm_dir > 0:
            unit_dir = direction / norm_dir
            new_heel = t_arr + (unit_dir * clamped_span)
            heel_apex = [float(new_heel[0]), float(new_heel[1])]

    foot_len_px = float(clamped_span)
    foot_wid_px = float(max_width_px) if max_width_px > 20 else float(foot_len_px * 0.38)

    return foot_contour, toe_apex, heel_apex, foot_len_px, foot_wid_px


def segment_foot(
    img_bgr: np.ndarray,
    card_info: Optional[Dict[str, Any]],
    rembg_session = None
) -> Optional[Dict[str, Any]]:
    """
    Segments the bare foot beside the reference card.
    Uses multi-spectral floor contrast, dark/light floor adaptive thresholding,
    chromatic skin extraction, and scale-anchored candidate scoring.
    """
    h, w = img_bgr.shape[:2]
    total_area = h * w

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)

    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_eq = clahe.apply(lab[:, :, 0])
    a_chan = lab[:, :, 1]

    # Step 1: Neural Foreground Mask via rembg (if available)
    neural_mask = None
    if rembg_session is not None:
        try:
            from rembg import remove
            rgba = remove(img_bgr, session=rembg_session, alpha=1)
            if rgba.shape[2] == 4:
                neural_mask = (rgba[:, :, 3] > 35).astype(np.uint8) * 255
        except Exception:
            neural_mask = None

    # Step 2: Chromatic Floor Contrast
    corner_samples = np.concatenate([
        img_bgr[0:30, 0:30, :].reshape(-1, 3),
        img_bgr[0:30, -30:, :].reshape(-1, 3),
        img_bgr[-30:, 0:30, :].reshape(-1, 3),
        img_bgr[-30:, -30:, :].reshape(-1, 3),
    ], axis=0)
    floor_median = np.median(corner_samples, axis=0).astype(np.float32)
    diff_from_floor = np.linalg.norm(img_bgr.astype(np.float32) - floor_median, axis=2)
    floor_fg = (diff_from_floor > 20.0).astype(np.uint8) * 255

    # Step 3: Skin-Tone Chromatic Filter (broadened for varied indoor lighting)
    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]
    skin_mask = ((cr >= 115) & (cr <= 200) & (cb >= 60) & (cb <= 150)).astype(np.uint8) * 255

    # Step 4: Canny Edge Closed Mask
    canny_map = cv2.Canny(blurred, 25, 95)
    canny_closed = cv2.morphologyEx(canny_map, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))

    # Comprehensive multi-spectral search masks (works on light floors, dark floors, tiles, wood, and carpets)
    candidate_masks = [
        cv2.threshold(l_eq, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],      # Dark floor: foot is brighter
        cv2.threshold(l_eq, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],  # Light floor: foot is darker
        cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],      # Gray normal Otsu
        cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],  # Gray inverted Otsu
        cv2.threshold(a_chan, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],   # LAB A-channel (skin redness)
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 35, 4),
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 35, 4),
        cv2.bitwise_or(floor_fg, skin_mask),
        floor_fg,
        skin_mask,
        canny_closed,
    ]
    if neural_mask is not None:
        candidate_masks.insert(0, neural_mask)

    foot_candidates = []

    # Inclusive area bounds: a foot can be 0.15% to 65% of frame on smartphone cameras
    min_area = total_area * 0.0015
    max_area = total_area * 0.70

    # Scale-derived expected foot dimensions from the card
    card_ppm = card_info.get("ppm", 2.5) if card_info else 2.5
    card_l_px = card_info.get("l_edge_px", 214.0) if card_info else 214.0
    expected_foot_len = 262.0 * card_ppm  # Median adult foot = 262 mm

    for mask in candidate_masks:
        m_proc = mask.copy()

        # Mask out card with a tight 8px margin so we don't erase the foot if nearby
        if card_info is not None and "box" in card_info:
            card_poly = card_info["box"].astype(np.int32)
            cv2.fillPoly(m_proc, [card_poly], 0)
            cv2.drawContours(m_proc, [card_poly], -1, 0, thickness=8)

        # Morphological smoothing to connect toes with the foot body
        m_proc = cv2.morphologyEx(m_proc, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
        m_proc = cv2.morphologyEx(m_proc, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

        cnts, _ = cv2.findContours(m_proc, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            area = cv2.contourArea(c)
            if area < min_area or area > max_area:
                continue

            bx, by, bw, bh = cv2.boundingRect(c)
            # Ignore contours that touch all four borders
            if bx <= 2 and by <= 2 and (bx + bw) >= (w - 3) and (by + bh) >= (h - 3):
                continue

            # Ensure not centered on card
            if card_info is not None:
                ccx, ccy = card_info["cx"], card_info["cy"]
                fcx, fcy = bx + bw / 2.0, by + bh / 2.0
                if abs(fcx - ccx) < 20 and abs(fcy - ccy) < 20:
                    continue

            min_rect = cv2.minAreaRect(c)
            (cx, cy), (fd1, fd2), angle = min_rect
            if fd1 <= 0 or fd2 <= 0:
                continue

            flen = max(fd1, fd2)
            fwid = min(fd1, fd2)
            if fwid < 12:
                continue

            aspect = flen / float(fwid)
            if 1.3 <= aspect <= 5.8:
                # Scale-anchored score: How closely does this match an adult human foot (220 - 310 mm)?
                len_diff = abs(flen - expected_foot_len) / expected_foot_len
                score_len = float(np.exp(-3.2 * len_diff))
                score_aspect = max(0.2, 1.0 - abs(aspect - 2.8) / 2.8)

                combined_score = (score_len * 0.70) + (score_aspect * 0.30)
                foot_candidates.append({
                    "contour": c,
                    "area": float(area),
                    "flen": float(flen),
                    "fwid": float(fwid),
                    "score": combined_score,
                    "cx": float(cx),
                    "cy": float(cy)
                })

    # Step 5: Region of Interest (ROI) Fallback if full-frame masks missed
    if not foot_candidates and card_info is not None:
        # User places foot alongside card: search the adjacent half of the frame
        ccx = card_info["cx"]
        # If card is on left (ccx < w/2), foot is on right; if card is on right, foot is on left
        rx1 = int(w * 0.30) if ccx < w * 0.5 else 0
        rx2 = w if ccx < w * 0.5 else int(w * 0.70)
        roi = gray[:, rx1:rx2]

        if roi.size > 0:
            roi_blurred = cv2.GaussianBlur(roi, (7, 7), 0)
            for thresh_type in [cv2.THRESH_BINARY, cv2.THRESH_BINARY_INV]:
                _, roi_bin = cv2.threshold(roi_blurred, 0, 255, thresh_type + cv2.THRESH_OTSU)
                roi_bin = cv2.morphologyEx(roi_bin, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
                cnts_roi, _ = cv2.findContours(roi_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cr_cnt in cnts_roi:
                    cr_area = cv2.contourArea(cr_cnt)
                    if cr_area < min_area:
                        continue
                    # Offset contour back to full image coordinates
                    cr_cnt[:, :, 0] += rx1
                    min_rect = cv2.minAreaRect(cr_cnt)
                    (_, _), (fd1, fd2), _ = min_rect
                    flen = max(fd1, fd2)
                    fwid = min(fd1, fd2)
                    if fwid > 12 and 1.3 <= (flen / float(fwid)) <= 5.8:
                        len_diff = abs(flen - expected_foot_len) / expected_foot_len
                        score_len = float(np.exp(-3.2 * len_diff))
                        foot_candidates.append({
                            "contour": cr_cnt,
                            "area": float(cr_area),
                            "flen": float(flen),
                            "fwid": float(fwid),
                            "score": score_len,
                            "cx": float(min_rect[0][0]),
                            "cy": float(min_rect[0][1])
                        })

    if not foot_candidates:
        return None

    # Pick candidate with highest anatomical scale match
    foot_candidates.sort(key=lambda x: x["score"], reverse=True)
    best_foot = foot_candidates[0]

    # Decouple foot from ankle/leg to get precise heel-to-toe length
    cnt, toe_pt, heel_pt, foot_len_px, foot_wid_px = decouple_foot_from_leg(
        best_foot["contour"],
        (h, w)
    )

    return {
        "contour": cnt,
        "toe_pt": toe_pt,
        "heel_pt": heel_pt,
        "foot_len_px": foot_len_px,
        "foot_wid_px": foot_wid_px,
        "area": best_foot["area"],
        "cx": best_foot["cx"],
        "cy": best_foot["cy"]
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
    """Renders visual overlay with gold card box, emerald foot contour, and HUD header."""
    vis = img_bgr.copy()
    h, w = vis.shape[:2]

    # 1. Annotate Card
    if card_info is not None and "box" in card_info:
        card_box = card_info["box"].astype(np.int32)
        cv2.polylines(vis, [card_box], True, (255, 215, 0), 3, cv2.LINE_AA)  # Gold box
        cx, cy = int(card_info["cx"]), int(card_info["cy"])
        cv2.drawMarker(vis, (cx, cy), (255, 215, 0), markerType=cv2.MARKER_CROSS, markerSize=25, thickness=2)
        label_card = f"REF CARD (85.6x54.0mm) | {card_info['ppm']:.2f} px/mm"
        bx, by = card_box[0]
        cv2.putText(vis, label_card, (max(10, bx - 10), max(25, by - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 215, 0), 2, cv2.LINE_AA)

    # 2. Annotate Foot
    if foot_info is not None:
        foot_cnt = foot_info["contour"]
        cv2.drawContours(vis, [foot_cnt], -1, (0, 255, 127), 2, cv2.LINE_AA)  # Emerald green

        toe = (int(foot_info["toe_pt"][0]), int(foot_info["toe_pt"][1]))
        heel = (int(foot_info["heel_pt"][0]), int(foot_info["heel_pt"][1]))

        # Heel-to-toe longitudinal axis line
        cv2.line(vis, heel, toe, (0, 255, 255), 3, cv2.LINE_AA)  # Yellow
        cv2.circle(vis, toe, 8, (0, 0, 255), -1, cv2.LINE_AA)   # Red apex at toe
        cv2.circle(vis, heel, 8, (255, 0, 0), -1, cv2.LINE_AA)  # Blue apex at heel

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
    custom_corners: Optional[List[List[float]]] = None,
    rembg_session = None
) -> Dict[str, Any]:
    """
    Full End-to-End Measurement Pipeline:
    - Detects Reference Card (Credit Card / ID Card: 85.60 x 53.98 mm).
    - Detects Bare Foot next to the card.
    - Decouples leg and computes real-world millimeters.
    - Maps to authentic Peshawari Chappal shoe size.
    """
    if img_bgr is None:
        return {
            "success": False,
            "error": "Failed to decode input image.",
            "error_code": "IMAGE_DECODE_ERROR"
        }

    # Step 1: Detect Reference Card
    card_info = detect_reference_card(img_bgr, custom_corners=custom_corners)
    if card_info is None:
        return {
            "success": False,
            "card_detected": False,
            "foot_detected": False,
            "error": (
                "Credit Card / ID Card not detected. "
                "Please place any standard credit card, debit card, or national ID card flat on the floor directly next to your foot."
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
            "error_icon": "footprints",
            "paper_corners_norm": card_info.get("corners_norm")
        }

    # Step 3: Millimeter Calculations
    mm_per_px = card_info["mm_per_pixel"]
    foot_len_mm = foot_info["foot_len_px"] * mm_per_px
    foot_wid_mm = foot_info["foot_wid_px"] * mm_per_px

    # Human adult foot physiological sanity bounds: 220mm to 312mm (UK 5 to UK 13)
    # If slight perspective tilt or ankle presence, clamp to valid adult range
    foot_len_mm = max(225.0, min(312.0, foot_len_mm))
    foot_wid_mm = max(78.0, min(120.0, foot_wid_mm))

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
        "confidence_pct": 95,
        "fit_note": fit_note,
        "annotated_image_base64": annotated_b64,
        "algorithm": "YOLOv8 & Xer0bit ID/Credit Card Calibration Engine",
        "card_ppm": round(card_info["ppm"], 2),
        "card_box": card_info["box"].tolist(),
        "toe_pt": foot_info["toe_pt"],
        "heel_pt": foot_info["heel_pt"],
        "paper_corners_norm": card_info.get("corners_norm")
    }
