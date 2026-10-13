#!/usr/bin/env python3
"""
Standalone Foot & A4 Paper Measurement Tester
Run directly from terminal to test and debug on any image:
    python test_foot_standalone.py <path_to_image.jpg>
"""

import sys
import os
import cv2
import numpy as np
import argparse

# Enable UTF-8 encoding on Windows console
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from feet_and_shoe_model.pipeline import (
    detect_a4_paper_corners,
    compute_a4_homography,
    segment_foot_on_a4_paper,
    mm_to_sizes,
    A4_LONG_MM,
    A4_SHORT_MM,
    SCALE_PX_PER_MM
)

def test_image(image_path: str, output_path: str = "output_debug.jpg", custom_corners=None):
    print("=" * 65)
    print("[*] STANDALONE FOOT & A4 MEASUREMENT TESTER")
    print(f"Loading image: {image_path}")
    print("=" * 65)

    if not os.path.exists(image_path):
        print(f"[!] Error: File '{image_path}' not found!")
        return

    img = cv2.imread(image_path)
    if img is None:
        print(f"[!] Error: Failed to decode image '{image_path}'.")
        return

    h, w = img.shape[:2]
    print(f"[+] Image Loaded: {w}x{h} px")

    # Step 1: Detect A4 Paper
    print("\n[Step 1] Detecting A4 Paper (210 x 297 mm)...")
    if custom_corners is not None and len(custom_corners) == 4:
        print("-> Using user-supplied corners:", custom_corners)
        corners = np.array(custom_corners, dtype=np.float32)
        if np.max(corners) <= 1.05:
            corners[:, 0] *= w
            corners[:, 1] *= h
    else:
        corners = detect_a4_paper_corners(img)

    if corners is None:
        print("[-] A4 Paper NOT detected automatically.")
        print("    Tips:")
        print("    1. Place a standard white A4 sheet flat on floor.")
        print("    2. Make sure all 4 corners of the paper are visible in camera.")
        print("    3. Provide manual corners via: --corners 'x1,y1,x2,y2,x3,y3,x4,y4'")
        return

    print("[+] Paper Corners Detected:")
    for idx, pt in enumerate(corners):
        print(f"    Corner {idx+1}: x={pt[0]:.1f}, y={pt[1]:.1f}")

    d0 = np.linalg.norm(corners[0] - corners[1])
    d1 = np.linalg.norm(corners[1] - corners[2])
    d2 = np.linalg.norm(corners[2] - corners[3])
    d3 = np.linalg.norm(corners[3] - corners[0])
    long_e = max((d0 + d2) / 2.0, (d1 + d3) / 2.0)
    short_e = min((d0 + d2) / 2.0, (d1 + d3) / 2.0)
    print(f"    Perspective Ratio: {long_e / (short_e + 1e-6):.3f} (Standard A4 is 1.414)")

    # Step 2: Canonical Planar Homography
    print("\n[Step 2] Computing Planar Homography (2.0 px/mm)...")
    M, H_norm, rw, rh, dw, dh = compute_a4_homography(corners, w, h)
    print(f"[+] Rectified Canvas Size: {dw}x{dh} px ({rw}mm x {rh}mm)")

    unwarped = cv2.warpPerspective(img, M, (dw, dh), flags=cv2.INTER_LINEAR)

    # Step 3: Segment Foot
    print("\n[Step 3] Segmenting Foot on A4 Sheet...")
    foot_data = segment_foot_on_a4_paper(unwarped)

    if foot_data is None:
        print("[-] No bare foot detected on top of the A4 paper.")
        print("    Check that the foot is inside the paper boundary.")
        return

    foot_cnt, toe_unw, heel_unw, foot_len_mm, foot_wid_mm = foot_data
    uk_size, eu_size, us_size, size_name = mm_to_sizes(foot_len_mm)

    print("\n" + "=" * 65)
    print("MEASUREMENT RESULTS:")
    print("=" * 65)
    print(f"  Bare Foot Length : {foot_len_mm:.1f} mm")
    print(f"  Ball Width       : {foot_wid_mm:.1f} mm")
    print(f"  Recommended Size : UK {uk_size}  |  EU {eu_size}  |  US {us_size}")
    print(f"  Fit Name         : {size_name}")
    print("=" * 65)

    # Step 4: Generate Debug Image
    print(f"\n[Step 4] Saving debug image to '{output_path}'...")
    M_inv = np.linalg.inv(M)
    def backproject(pt_unw):
        p_homo = np.array([[[float(pt_unw[0]), float(pt_unw[1])]]], dtype=np.float32)
        return cv2.perspectiveTransform(p_homo, M_inv)[0][0]

    toe_orig = backproject(toe_unw)
    heel_orig = backproject(heel_unw)

    debug_img = img.copy()

    # Draw cyan paper quad
    cv2.polylines(debug_img, [np.int32(corners)], True, (255, 220, 0), 3, cv2.LINE_AA)
    for idx, c_pt in enumerate(np.int32(corners)):
        cv2.circle(debug_img, tuple(c_pt), 8, (0, 240, 255), -1, cv2.LINE_AA)
        cv2.putText(debug_img, str(idx+1), (c_pt[0]+10, c_pt[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 240, 255), 2)

    # Draw yellow foot measurement line
    cv2.line(debug_img, tuple(np.int32(toe_orig)), tuple(np.int32(heel_orig)), (0, 240, 255), 3, cv2.LINE_AA)
    cv2.circle(debug_img, tuple(np.int32(toe_orig)), 9, (0, 255, 0), -1, cv2.LINE_AA)
    cv2.circle(debug_img, tuple(np.int32(heel_orig)), 9, (0, 0, 255), -1, cv2.LINE_AA)

    cv2.putText(debug_img, f"Toe ({foot_len_mm}mm)", (int(toe_orig[0]+12), int(toe_orig[1])), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(debug_img, f"Heel (Size {uk_size})", (int(heel_orig[0]+12), int(heel_orig[1])), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Banner
    cv2.rectangle(debug_img, (10, 10), (min(w-10, 560), 65), (20, 20, 20), -1)
    cv2.rectangle(debug_img, (10, 10), (min(w-10, 560), 65), (0, 220, 255), 2)
    header = f"Measured: {foot_len_mm}mm x {foot_wid_mm}mm | UK Size {uk_size} (EU {eu_size})"
    cv2.putText(debug_img, header, (20, 46), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 240, 255), 2, cv2.LINE_AA)

    cv2.imwrite(output_path, debug_img)
    print(f"[+] Debug annotated image saved: '{output_path}'")
    print("    Open this file to visually inspect the exact corners and measurement line!")

    return {
        "image": image_path,
        "success": True,
        "foot_len_mm": foot_len_mm,
        "foot_wid_mm": foot_wid_mm,
        "uk_size": uk_size,
        "eu_size": eu_size,
        "us_size": us_size,
        "size_name": size_name,
        "output_path": output_path
    }

def main():
    parser = argparse.ArgumentParser(description="Standalone Foot Model Tester")
    parser.add_argument("path", nargs="?", help="Path to input photo (JPG/PNG) OR folder of images")
    parser.add_argument("--output", default="output_debug.jpg", help="Path to save annotated output image")
    parser.add_argument("--corners", help="Manual normalized corners: x1,y1,x2,y2,x3,y3,x4,y4")
    args = parser.parse_args()

    if not args.path:
        print("Usage:")
        print("  Single Image : python test_foot_standalone.py <path_to_image.jpg>")
        print("  Full Folder  : python test_foot_standalone.py <path_to_folder/>")
        print("\nExamples:")
        print("  python test_foot_standalone.py sample_foot.jpg")
        print("  python test_foot_standalone.py my_test_photos/")
        return

    custom_corners = None
    if args.corners:
        pts = [float(x.strip()) for x in args.corners.split(",")]
        if len(pts) == 8:
            custom_corners = [[pts[0], pts[1]], [pts[2], pts[3]], [pts[4], pts[5]], [pts[6], pts[7]]]

    target_path = args.path
    if os.path.isdir(target_path):
        # Folder mode: process all images
        exts = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
        files = [os.path.join(target_path, f) for f in os.listdir(target_path) if f.lower().endswith(exts)]
        if not files:
            print(f"[!] No image files found in folder: {target_path}")
            return

        out_dir = "debug_results"
        os.makedirs(out_dir, exist_ok=True)
        print("=" * 70)
        print(f"[*] BATCH EVALUATION MODE: Testing {len(files)} images from '{target_path}'")
        print(f"[*] Debug annotated images will be saved in '{out_dir}/'")
        print("=" * 70)

        results = []
        for f in files:
            fname = os.path.basename(f)
            out_img = os.path.join(out_dir, f"debug_{fname}")
            print(f"\n--- Processing: {fname} ---")
            res = test_image(f, out_img, custom_corners)
            if res:
                results.append(res)
            else:
                results.append({"image": f, "success": False, "foot_len_mm": 0, "foot_wid_mm": 0, "uk_size": "N/A", "eu_size": "N/A"})

        # Summary Table
        print("\n" + "=" * 70)
        print("BATCH EVALUATION SUMMARY:")
        print("=" * 70)
        print(f"{'Image File':<25} | {'Length (mm)':<12} | {'Width (mm)':<11} | {'UK Size':<8} | {'Status'}")
        print("-" * 70)
        for r in results:
            bname = os.path.basename(r['image'])
            if r['success']:
                print(f"{bname:<25} | {r['foot_len_mm']:<12.1f} | {r['foot_wid_mm']:<11.1f} | UK {r['uk_size']:<5} | SUCCESS")
            else:
                print(f"{bname:<25} | {'---':<12} | {'---':<11} | {'---':<8} | FAILED")
        print("=" * 70)
    else:
        test_image(target_path, args.output, custom_corners)

if __name__ == "__main__":
    main()
