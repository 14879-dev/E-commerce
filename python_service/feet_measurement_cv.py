"""
FeetAndShoeMeasurement Computer Vision Pipeline - Precision Mobile Scanner
Based on https://github.com/wildoctopus/FeetAndShoeMeasurement.git

Robust rotation-invariant foot measurement for mobile smartphone cameras:
- Locates the white A4 paper reference sheet (210 x 297 mm) on any floor surface.
- Segments the bare foot on top of the paper using dual paper-contrast + skin-tone segmentation.
- Computes exact millimeter length and width.
- Maps to authentic Peshawari Chappal sizing (UK / Pak Sizes 6 to 13).
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional, List

A4_LONG_MM = 297.0
A4_SHORT_MM = 210.0
A4_ASPECT = A4_LONG_MM / A4_SHORT_MM  # 1.414


def find_a4_paper_sheet(img_bgr: np.ndarray) -> Optional[Tuple[float, float, np.ndarray, np.ndarray, float]]:
    """
    Locates the true white A4 paper sheet on the floor.
    Returns: (paper_len_px, paper_w_px, paper_box_pts, paper_mask, ppm) or None.
    """
    h, w = img_bgr.shape[:2]
    total_area = h * w
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    candidates = []

    # Method 1: Edge detection with convex hull
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 130)
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts_edge, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for c in cnts_edge:
        area = cv2.contourArea(c)
        if area < (total_area * 0.05) or area > (total_area * 0.85):
            continue
        bx, by, bw, bh = cv2.boundingRect(c)
        if bx <= 8 and by <= 8 and (bx + bw) >= (w - 8) and (by + bh) >= (h - 8):
            continue
        hull = cv2.convexHull(c)
        min_rect = cv2.minAreaRect(hull)
        (cx, cy), (d1, d2), angle = min_rect
        if min(d1, d2) < 40:
            continue
        long_e = max(d1, d2)
        short_e = min(d1, d2)
        asp = long_e / float(short_e)
        diff = abs(asp - A4_ASPECT)
        if diff < 0.65:
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(mask, [hull], 255)
            mean_b = cv2.mean(gray, mask=mask)[0]
            if mean_b > 90:
                score = diff * 2.0 - (0.5 if mean_b > 150 else 0.0)
                candidates.append((score, long_e, short_e, cv2.boxPoints(min_rect), mask))

    # Method 2: Bright white thresholding (white paper is significantly brighter than room floor)
    if not candidates:
        for t in range(215, 140, -15):
            _, th = cv2.threshold(gray, t, 255, cv2.THRESH_BINARY)
            th_clean = cv2.morphologyEx(th, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
            cnts_th, _ = cv2.findContours(th_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in cnts_th:
                bx, by, bw, bh = cv2.boundingRect(c)
                # Ignore whole-frame contours
                if bx <= 10 and by <= 10 and (bx + bw) >= (w - 10) and (by + bh) >= (h - 10):
                    continue
                area = cv2.contourArea(c)
                if area < (total_area * 0.04) or area > (total_area * 0.80):
                    continue
                hull = cv2.convexHull(c)
                min_rect = cv2.minAreaRect(hull)
                (cx, cy), (d1, d2), angle = min_rect
                if min(d1, d2) < 40:
                    continue
                long_e = max(d1, d2)
                short_e = min(d1, d2)
                asp = long_e / float(short_e)
                diff = abs(asp - A4_ASPECT)
                if diff < 0.70:
                    mask = np.zeros((h, w), dtype=np.uint8)
                    cv2.fillPoly(mask, [hull], 255)
                    score = diff * 2.0 - (area / float(total_area))
                    candidates.append((score, long_e, short_e, cv2.boxPoints(min_rect), mask))
            if candidates:
                break

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[0])
    best = candidates[0]
    long_px, short_px, box_pts, mask = best[1], best[2], best[3], best[4]

    # Calculate ppm: average scale between long edge (297mm) and short edge (210mm)
    ppm_long = long_px / A4_LONG_MM
    ppm_short = short_px / A4_SHORT_MM
    ppm = (ppm_long + ppm_short) / 2.0

    return (long_px, short_px, box_pts, mask, ppm)


def find_foot_on_or_beside(
    img_bgr: np.ndarray,
    paper_mask: np.ndarray,
    paper_len_px: float,
    ppm: float
) -> Optional[Tuple[float, float, np.ndarray, List[float], List[float]]]:
    """
    Detects the bare foot contour on top of or beside the white paper.
    Uses dual method:
    1. YCrCb Skin tone segmentation
    2. Paper-relative dark silhouette segmentation
    Returns: (foot_len_px, foot_wid_px, foot_box_pts, toe_point, heel_point) or None.
    """
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]

    # 1. Skin detection in YCrCb color space
    skin_mask = ((cr >= 130) & (cr <= 185) & (cb >= 75) & (cb <= 135)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

    # 2. Foot silhouette on white paper (darker than white paper)
    mean_paper_val = cv2.mean(gray, mask=paper_mask)[0]
    thresh_val = max(60, int(mean_paper_val - 25))
    foot_on_paper = ((gray < thresh_val) & (paper_mask > 0)).astype(np.uint8) * 255
    foot_on_paper = cv2.morphologyEx(foot_on_paper, cv2.MORPH_CLOSE, kernel)

    # Combine skin inside paper or contrast inside paper
    combined_foot = cv2.bitwise_or(skin_mask, foot_on_paper)
    # Intersect with dilated paper region so we don't pick outside floors
    dilated_paper = cv2.dilate(paper_mask, np.ones((45, 45), np.uint8))
    combined_foot[dilated_paper == 0] = 0

    cnts, _ = cv2.findContours(combined_foot, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []

    for c in cnts:
        area = cv2.contourArea(c)
        if area < (h * w * 0.015):
            continue

        min_rect = cv2.minAreaRect(c)
        (cx, cy), (fd1, fd2), angle = min_rect
        if fd1 <= 0 or fd2 <= 0:
            continue

        flen = max(fd1, fd2)
        fwid = min(fd1, fd2)
        if fwid < 15:
            continue

        aspect = flen / float(fwid)
        # Foot aspect ratio is typically between 1.6 and 4.2
        if 1.5 <= aspect <= 4.8:
            # Physical length estimate should be reasonable human adult size (210mm - 315mm)
            est_mm = flen / ppm if ppm > 0 else 250.0
            if 205.0 <= est_mm <= 325.0:
                candidates.append((area, flen, fwid, cv2.boxPoints(min_rect), c))

    if not candidates:
        # Fallback: check largest skin contour near the paper center
        cnts_skin, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts_skin:
            area = cv2.contourArea(c)
            if area > (h * w * 0.02):
                min_rect = cv2.minAreaRect(c)
                flen = max(min_rect[1])
                fwid = min(min_rect[1])
                if fwid > 15:
                    asp = flen / float(fwid)
                    if 1.4 <= asp <= 4.5:
                        candidates.append((area, flen, fwid, cv2.boxPoints(min_rect), c))

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[0], reverse=True)
    best = candidates[0]
    flen, fwid, box_pts, c = best[1], best[2], best[3], best[4]

    pts = c.reshape(-1, 2)
    min_y_idx = np.argmin(pts[:, 1])
    max_y_idx = np.argmax(pts[:, 1])
    toe_pt = [float(pts[min_y_idx][0]), float(pts[min_y_idx][1])]
    heel_pt = [float(pts[max_y_idx][0]), float(pts[max_y_idx][1])]

    return (flen, fwid, box_pts, toe_pt, heel_pt)


def run_feet_and_shoe_measurement_pipeline(
    img_bgr: np.ndarray,
    ref_long_mm: float = 297.0,
    ref_short_mm: float = 210.0,
    cal_obj: str = "a4_paper"
) -> Dict[str, Any]:
    """
    Executes computer vision measurement.
    Strictly enforces:
    1. A4 paper reference detected.
    2. Bare foot detected on paper.
    Delegates to the orthogonal perspective unwarping engine.
    """
    from feet_and_shoe_model.pipeline import run_wildoctopus_model
    return run_wildoctopus_model(img_bgr)

