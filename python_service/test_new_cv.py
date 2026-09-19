import cv2
import numpy as np
import base64
import time

try:
    from rembg import remove, new_session
    u2net_session = new_session("u2netp")
    REMBG_AVAILABLE = True
except Exception as e:
    print("rembg not available:", e)
    REMBG_AVAILABLE = False
    u2net_session = None

def detect_foot_and_card(img, ref_type="credit_card", ref_w_mm=85.60, ref_h_mm=53.98):
    h, w = img.shape[:2]
    img_area = h * w

    # Scale down if very large for fast processing
    scale_factor = 1.0
    max_dim = 1000
    if max(h, w) > max_dim:
        scale_factor = max_dim / float(max(h, w))
        proc_img = cv2.resize(img, (int(w * scale_factor), int(h * scale_factor)))
    else:
        proc_img = img.copy()

    ph, pw = proc_img.shape[:2]
    p_area = ph * pw

    # 1. Foreground Extraction via U2NetP or Adaptive Color
    fg_mask = None
    if REMBG_AVAILABLE and u2net_session is not None:
        try:
            rgba = remove(proc_img, session=u2net_session)
            fg_mask = (rgba[:, :, 3] > 60).astype(np.uint8) * 255
        except Exception as e:
            print("rembg error:", e)

    if fg_mask is None or np.count_nonzero(fg_mask) < p_area * 0.02:
        # Fallback to Color + Edge segmentation
        ycrcb = cv2.cvtColor(proc_img, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]
        # Skin color heuristic
        skin_mask = ((cr > 130) & (cr < 185) & (cb > 75) & (cb < 135) & (cr - cb > 10)).astype(np.uint8) * 255
        gray = cv2.cvtColor(proc_img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 30, 100)
        edges = cv2.dilate(edges, np.ones((3, 3), np.uint8))
        fg_mask = cv2.bitwise_or(skin_mask, edges)

    # Clean morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    # 2. Reference Card Detection
    target_ratio = max(ref_w_mm, ref_h_mm) / min(ref_w_mm, ref_h_mm) # ~1.586
    gray = cv2.cvtColor(proc_img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    card_candidates = []
    # Search edges & adaptive thresholds
    for thresh in [
        cv2.Canny(blurred, 30, 120),
        cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 3),
    ]:
        dilated = cv2.dilate(thresh, np.ones((3, 3), np.uint8), iterations=1)
        cnts, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        card_candidates.extend(cnts)

    best_card_cnt = None
    best_card_rect = None
    best_card_score = float("inf")
    best_ppm = None

    ycrcb_full = cv2.cvtColor(proc_img, cv2.COLOR_BGR2YCrCb)

    for cnt in card_candidates:
        c_area = cv2.contourArea(cnt)
        if c_area < p_area * 0.003 or c_area > p_area * 0.20:
            continue

        rect = cv2.minAreaRect(cnt)
        (cx, cy), (dim1, dim2), angle = rect
        if dim1 <= 0 or dim2 <= 0:
            continue

        long_edge = max(dim1, dim2)
        short_edge = min(dim1, dim2)
        if short_edge < 12:
            continue

        ratio = long_edge / short_edge
        ratio_diff = abs(ratio - target_ratio)

        # Allow tilted card ratio 1.20 to 2.10
        if ratio_diff > 0.55:
            continue

        box_area = long_edge * short_edge
        rectangularity = c_area / box_area if box_area > 0 else 0
        if rectangularity < 0.62:
            continue

        # Check that it is NOT skin (card should not be skin-colored)
        c_mask = np.zeros((ph, pw), dtype=np.uint8)
        cv2.drawContours(c_mask, [cnt], -1, 255, -1)
        mean_cr = np.mean(ycrcb_full[:, :, 1][c_mask > 0])
        mean_cb = np.mean(ycrcb_full[:, :, 2][c_mask > 0])
        if mean_cr - mean_cb > 25 and mean_cr > 145:
            # Looks too much like skin
            continue

        score = ratio_diff * 2.5 + (1.0 - rectangularity)
        if score < best_card_score:
            best_card_score = score
            best_card_cnt = cnt
            best_card_rect = rect
            ppm = long_edge / max(ref_w_mm, ref_h_mm)
            best_ppm = ppm / scale_factor

    # 3. Foot Detection
    # Exclude card from foot mask if card found
    foot_mask = fg_mask.copy()
    if best_card_cnt is not None:
        c_mask = np.zeros((ph, pw), dtype=np.uint8)
        cv2.drawContours(c_mask, [best_card_cnt], -1, 255, -1)
        c_mask = cv2.dilate(c_mask, np.ones((25, 25), np.uint8))
        foot_mask[c_mask > 0] = 0

    contours, _ = cv2.findContours(foot_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    foot_candidates = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < p_area * 0.015 or area > p_area * 0.65:
            continue

        rect = cv2.minAreaRect(cnt)
        (cx, cy), (dim1, dim2), angle = rect
        long_edge = max(dim1, dim2)
        short_edge = min(dim1, dim2)

        if short_edge < 15:
            continue

        aspect_ratio = long_edge / short_edge
        # Relaxed human foot aspect ratio
        if aspect_ratio < 1.3 or aspect_ratio > 4.5:
            continue

        # Check skin color confirmation
        cnt_mask = np.zeros((ph, pw), dtype=np.uint8)
        cv2.drawContours(cnt_mask, [cnt], -1, 255, -1)
        cnt_cr = ycrcb_full[:, :, 1][cnt_mask > 0]
        cnt_cb = ycrcb_full[:, :, 2][cnt_mask > 0]

        if len(cnt_cr) == 0:
            continue

        mean_cr = np.mean(cnt_cr)
        mean_cb = np.mean(cnt_cb)
        skin_diff = mean_cr - mean_cb

        # Must have positive human skin chrominance signature (rejects floor tiles, furniture, shadows)
        if skin_diff < 10 or mean_cr < 128:
            continue

        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        solidity = area / hull_area if hull_area > 0 else 0

        total_score = area * (1.0 + skin_diff / 50.0) / (1.0 + abs(aspect_ratio - 2.5))
        foot_candidates.append({
            "cnt": cnt,
            "rect": rect,
            "area": area,
            "long_edge": long_edge / scale_factor,
            "short_edge": short_edge / scale_factor,
            "aspect_ratio": aspect_ratio,
            "solidity": solidity,
            "score": total_score,
            "skin_diff": skin_diff,
        })

    if not foot_candidates:
        return None, None, None, None, None, None

    # Best foot contour
    best_foot = max(foot_candidates, key=lambda x: x["score"])
    f_cnt = best_foot["cnt"]
    f_rect = best_foot["rect"]

    # Calculate Heel and Big Toe points along principal axis
    # Fit line through contour
    [vx, vy, x0, y0] = cv2.fitLine(f_cnt, cv2.DIST_L2, 0, 0.01, 0.01)
    # Project all contour points onto line
    pts = f_cnt.reshape(-1, 2)
    projections = (pts[:, 0] - x0) * vx + (pts[:, 1] - y0) * vy

    min_idx = np.argmin(projections)
    max_idx = np.argmax(projections)

    pt1 = pts[min_idx] / scale_factor
    pt2 = pts[max_idx] / scale_factor

    # Decide which is toe vs heel (toe is usually wider or higher, heel is rounder/narrower)
    # If y is different, usually toes are near the top or bottom
    if pt1[1] > pt2[1]:
        heel_pt = pt1 # lower in frame
        toe_pt = pt2  # higher in frame
    else:
        heel_pt = pt2
        toe_pt = pt1

    foot_length_px = float(np.linalg.norm(toe_pt - heel_pt))
    foot_width_px = float(best_foot["short_edge"])

    # Scale card box back to original image
    card_box_orig = None
    if best_card_rect is not None:
        cbox = cv2.boxPoints(best_card_rect) / scale_factor
        card_box_orig = np.int32(cbox).tolist()

    # Scale foot rect back
    (fcx, fcy), (fdim1, fdim2), fangle = f_rect
    f_rect_orig = ((fcx / scale_factor, fcy / scale_factor),
                   (fdim1 / scale_factor, fdim2 / scale_factor),
                   fangle)

    return {
        "foot_detected": True,
        "card_detected": best_ppm is not None,
        "foot_length_px": foot_length_px,
        "foot_width_px": foot_width_px,
        "ppm": best_ppm,
        "heel_point": [float(heel_pt[0]), float(heel_pt[1])],
        "toe_point": [float(toe_pt[0]), float(toe_pt[1])],
        "card_box": card_box_orig,
        "foot_rect": f_rect_orig,
        "solidity": best_foot["solidity"],
    }

# Test on synthetic image
h, w = 900, 600
img = np.full((h, w, 3), (210, 215, 220), dtype=np.uint8)
cv2.ellipse(img, (250, 480), (80, 255), 0, 0, 360, (145, 175, 210), -1)
for dx, dy, r in [(-45, -240, 22), (-15, -260, 20), (15, -250, 18), (42, -235, 16), (65, -215, 14)]:
    cv2.circle(img, (250 + dx, 480 + dy), r, (145, 175, 210), -1)
card_x, card_y = 450, 380
cv2.rectangle(img, (card_x - 54, card_y - 85), (card_x + 54, card_y + 85), (180, 120, 20), -1)

res = detect_foot_and_card(img)
print("Result:")
for k, v in res.items():
    if k != "foot_rect":
        print(f"  {k}: {v}")

ppm = res["ppm"]
length_mm = res["foot_length_px"] / ppm
eu = int(round((3.0 * ((length_mm / 10.0) + 1.5)) / 2.0))
print(f"Calculated Foot Length: {round(length_mm, 1)} mm -> EU {eu}")
