#!/usr/bin/env python3
"""
Standalone Foot & Credit Card / ID Card Measurement Tester
Based on Xer0bit YOLOv8 & Reference Object Pipeline:
    python test_card_measurement.py [image_path]
"""

import sys
import os
import cv2
import numpy as np

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xer0bit_card_model import (
    run_card_foot_measurement,
    CARD_LONG_MM,
    CARD_SHORT_MM,
    CARD_ASPECT_RATIO
)


def create_synthetic_test_card_image(out_path="sample_card_foot.jpg"):
    """Creates a high-realism test image with a credit card (85.6 x 54.0 mm) and adult foot."""
    h_img, w_img = 900, 700
    # Floor: natural light wood/tile texture
    img = np.full((h_img, w_img, 3), (210, 225, 235), dtype=np.uint8)

    # 1. Place Credit Card / ID card on left
    # Scale: 2.5 px per mm => 85.6 mm * 2.5 = 214 px, 54.0 mm * 2.5 = 135 px
    scale_px_mm = 2.5
    card_w = int(CARD_LONG_MM * scale_px_mm)
    card_h = int(CARD_SHORT_MM * scale_px_mm)

    card_x1, card_y1 = 80, 320
    card_x2 = card_x1 + card_w
    card_y2 = card_y1 + card_h

    # Card background (dark blue credit card)
    cv2.rectangle(img, (card_x1, card_y1), (card_x2, card_y2), (140, 40, 20), -1)
    # Card chip
    cv2.rectangle(img, (card_x1 + 30, card_y1 + 40), (card_x1 + 70, card_y1 + 75), (50, 190, 220), -1)
    # Card text imitation
    cv2.putText(img, "VISA / ID CARD", (card_x1 + 30, card_y1 + card_h - 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (240, 240, 240), 2)

    # 2. Place Bare Foot on right
    # Adult EU 41 foot = 260 mm length, 98 mm width
    # 260 mm * 2.5 = 650 px length, 98 mm * 2.5 = 245 px width
    foot_len_px = int(260.0 * scale_px_mm)
    foot_wid_px = int(98.0 * scale_px_mm)
    fx = 480
    fy = 480

    foot_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    # Heel & sole
    cv2.ellipse(foot_mask, (fx, fy), (foot_wid_px // 2, foot_len_px // 2 - 40),
                0, 0, 360, 255, -1)
    # Toes
    toe_y = fy - foot_len_px // 2 + 15
    cv2.circle(foot_mask, (fx - int(foot_wid_px * 0.28), toe_y), 32, 255, -1)
    cv2.circle(foot_mask, (fx - int(foot_wid_px * 0.06), toe_y - 12), 28, 255, -1)
    cv2.circle(foot_mask, (fx + int(foot_wid_px * 0.14), toe_y), 24, 255, -1)
    cv2.circle(foot_mask, (fx + int(foot_wid_px * 0.32), toe_y + 16), 20, 255, -1)

    # Natural skin tone in BGR
    skin_color = (135, 170, 215)
    img[foot_mask > 0] = skin_color

    cv2.imwrite(out_path, img)
    print(f"[+] Created synthetic test image: {out_path}")
    return out_path


def test(image_path: str = None):
    print("=" * 68)
    print("👟 XER0BIT YOLOv8 & CREDIT CARD / ID CARD FOOT SIZING TESTER")
    print(f"Standard Reference Card: {CARD_LONG_MM:.2f} mm x {CARD_SHORT_MM:.2f} mm")
    print("=" * 68)

    if image_path is None or not os.path.exists(image_path):
        image_path = create_synthetic_test_card_image()

    print(f"\n[*] Reading image: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        print(f"[!] Error: Unable to read image '{image_path}'")
        return

    print(f"[+] Dimensions: {img.shape[1]}x{img.shape[0]} px")
    print("[*] Running Xer0bit Card & Foot Measurement Engine...")

    res = run_card_foot_measurement(img)

    if not res.get("success", False):
        print(f"\n[-] Measurement Failed: {res.get('error')}")
        return

    print("\n" + "=" * 68)
    print("✅ MEASUREMENT SUCCESSFUL!")
    print(f"  • Reference Card Detected : {res['card_detected']}")
    print(f"  • Scale (PPM)             : {res['card_ppm']} pixels/mm")
    print(f"  • Measured Foot Length    : {res['foot_length_mm']} mm ({res['height_cm']} cm)")
    print(f"  • Measured Foot Width     : {res['foot_width_mm']} mm ({res['width_cm']} cm)")
    print(f"  • Recommended UK Size     : UK {res['recommended_uk_size']}")
    print(f"  • Recommended EU Size     : EU {res['recommended_eu_size']}")
    print(f"  • Recommended US Size     : US {res['recommended_us_size']}")
    print(f"  • Fit Note                : {res['fit_note']}")
    print("=" * 68)

    out_file = "output_debug_card.jpg"
    import base64
    b64 = res["annotated_image_base64"]
    img_data = base64.b64decode(b64)
    with open(out_file, "wb") as f:
        f.write(img_data)
    print(f"[+] Saved annotated visualization to: {out_file}")


if __name__ == "__main__":
    img_arg = sys.argv[1] if len(sys.argv) > 1 else None
    test(img_arg)
