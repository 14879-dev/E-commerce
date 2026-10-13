#!/usr/bin/env python3
"""
Peshawari Chappal AI — Standalone Foot & A4 Segmentation Model
Training, Dataset Preparation, and Testing Suite

Commands:
  1. Initialize Dataset Directories:
     python train_custom_foot_model.py --init

  2. Generate Synthetic Training Data (for quick training pipeline verification):
     python train_custom_foot_model.py --generate-synthetic 30

  3. Train YOLOv8-seg Custom Model:
     python train_custom_foot_model.py --train --epochs 50 --imgsz 640

  4. Test Trained Model / Standalone CV Pipeline on Image or Folder:
     python train_custom_foot_model.py --test path/to/image.jpg
     python train_custom_foot_model.py --test path/to/test_folder/
"""

import os
import sys
import argparse
import glob
import json
import random
import numpy as np
import cv2

# Enable UTF-8 encoding on Windows console
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
DATASET_DIR = os.path.join(SCRIPT_DIR, "dataset")
CONFIG_YAML = os.path.join(DATASET_DIR, "data.yaml")

# Include service root for pipeline imports
if SERVICE_ROOT not in sys.path:
    sys.path.insert(0, SERVICE_ROOT)


def init_dataset_structure():
    """Creates the YOLOv8 segmentation folder layout."""
    print("=" * 65)
    print("[*] Initializing YOLOv8 Foot & Card Segmentation Dataset")
    print(f"[*] Target Directory: {DATASET_DIR}")
    print("=" * 65)

    subdirs = [
        os.path.join(DATASET_DIR, "images", "train"),
        os.path.join(DATASET_DIR, "images", "val"),
        os.path.join(DATASET_DIR, "labels", "train"),
        os.path.join(DATASET_DIR, "labels", "val"),
    ]
    for d in subdirs:
        os.makedirs(d, exist_ok=True)
        print(f"  [+] Created: {os.path.relpath(d, SCRIPT_DIR)}")

    yaml_content = f"""# Ultralytics YOLOv8 Foot & Credit/ID Card Segmentation Dataset
path: {DATASET_DIR.replace('\\\\', '/')}
train: images/train
val: images/val

names:
  0: card
  1: foot
"""
    with open(CONFIG_YAML, "w", encoding="utf-8") as f:
        f.write(yaml_content)

    print(f"  [+] Created config: {os.path.relpath(CONFIG_YAML, SCRIPT_DIR)}")
    print("\n[OK] Dataset directory structure ready!")
    print("\nAnnotation Guidelines:")
    print("  Class 0 (card): Polygon around the 4 corners of standard credit card / ID card (85.6 x 54.0 mm).")
    print("  Class 1 (foot): Polygon contour surrounding the bare foot boundary.")
    print("  Tools for annotation: Roboflow, CVAT (cvat.ai), or Labelme (labelme2yolo).")


def generate_synthetic_samples(count: int = 30):
    """
    Generates synthetic training and validation samples with accurate polygon ground truth
    using a standard reference Credit Card / ID card (85.6 x 54.0 mm) placed beside a bare foot.
    """
    init_dataset_structure()

    print(f"\n[*] Generating {count} synthetic training samples with YOLOv8 polygon labels...")
    split_train = int(count * 0.8)

    # Standard ID-1 card aspect ratio = 85.60 / 53.98 ~ 1.5858
    CARD_ASPECT = 85.60 / 53.98

    for i in range(count):
        split = "train" if i < split_train else "val"
        w_img, h_img = 640, 800

        # Background floor color
        floor_color = (
            random.randint(180, 240),
            random.randint(180, 240),
            random.randint(180, 240)
        )
        img = np.full((h_img, w_img, 3), floor_color, dtype=np.uint8)

        # Draw Credit Card / ID Card (85.6 x 54 mm, scale ~ 2.0 - 2.5 px/mm)
        card_scale = random.uniform(1.8, 2.4)
        cw = int(85.60 * card_scale)
        ch = int(53.98 * card_scale)

        # Position card on the left side
        card_cx = random.randint(100, 220)
        card_cy = random.randint(300, 500)

        # Add slight rotation angle to the card (-15 to +15 degrees)
        angle_deg = random.uniform(-15.0, 15.0)
        card_rect = ((card_cx, card_cy), (cw, ch), angle_deg)
        card_box = cv2.boxPoints(card_rect).astype(np.int32)

        # Card color (blue/gold/teal/dark card)
        card_color = (
            random.randint(120, 200),
            random.randint(30, 90),
            random.randint(20, 70)
        )
        cv2.fillPoly(img, [card_box], card_color)
        # Decorative card chip
        cv2.circle(img, (card_cx, card_cy), int(min(cw, ch) * 0.15), (60, 200, 240), -1)

        # Draw Bare Foot beside the card on the right
        # Normal adult foot is ~250mm to 280mm
        foot_len_mm = random.uniform(240.0, 285.0)
        foot_wid_mm = foot_len_mm * random.uniform(0.36, 0.40)
        foot_len_px = int(foot_len_mm * card_scale)
        foot_wid_px = int(foot_wid_mm * card_scale)

        foot_cx = random.randint(380, 480)
        foot_cy = random.randint(380, 440)

        # Foot mask canvas to extract clean polygon
        foot_mask = np.zeros((h_img, w_img), dtype=np.uint8)
        foot_color = (
            random.randint(120, 160),
            random.randint(150, 190),
            random.randint(190, 235)
        )

        # Foot heel + sole ellipse
        cv2.ellipse(
            foot_mask,
            (foot_cx, foot_cy + int(foot_len_px * 0.12)),
            (foot_wid_px // 2, foot_len_px // 2 - 25),
            0, 0, 360, 255, -1
        )
        # Toes
        toe_top_y = foot_cy - foot_len_px // 2 + 10
        cv2.circle(foot_mask, (foot_cx - int(foot_wid_px * 0.25), toe_top_y), 18, 255, -1)
        cv2.circle(foot_mask, (foot_cx - int(foot_wid_px * 0.05), toe_top_y - 6), 16, 255, -1)
        cv2.circle(foot_mask, (foot_cx + int(foot_wid_px * 0.15), toe_top_y), 14, 255, -1)
        cv2.circle(foot_mask, (foot_cx + int(foot_wid_px * 0.32), toe_top_y + 10), 12, 255, -1)

        # Blend foot color onto image
        img[foot_mask > 0] = foot_color

        # Save image
        img_filename = f"sample_{i:03d}.jpg"
        label_filename = f"sample_{i:03d}.txt"
        img_out = os.path.join(DATASET_DIR, "images", split, img_filename)
        lbl_out = os.path.join(DATASET_DIR, "labels", split, label_filename)
        cv2.imwrite(img_out, img)

        # Extract YOLO segmentation polygons (normalized x y coordinates)
        # Label format: <class-index> x1 y1 x2 y2 ... xn yn
        lines = []

        # 1. Card polygon (class 0)
        norm_card = []
        for pt in card_box:
            norm_card.append(f"{pt[0] / float(w_img):.6f} {pt[1] / float(h_img):.6f}")
        lines.append(f"0 {' '.join(norm_card)}")

        # 2. Foot polygon (class 1)
        cnts, _ = cv2.findContours(foot_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            largest = max(cnts, key=cv2.contourArea)
            approx = cv2.approxPolyDP(largest, 2.0, True).reshape(-1, 2)
            norm_foot = []
            for pt in approx:
                norm_foot.append(f"{pt[0] / float(w_img):.6f} {pt[1] / float(h_img):.6f}")
            lines.append(f"1 {' '.join(norm_foot)}")

        with open(lbl_out, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    print(f"[OK] Generated {count} synthetic samples ({split_train} train, {count - split_train} val).")


def run_training(epochs: int = 50, imgsz: int = 640, batch: int = 8, weights: str = "yolov8n-seg.pt"):
    """Runs YOLOv8-seg training."""
    print("=" * 65)
    print("👟 Training Custom Foot & A4 Segmentation Model (Ultralytics YOLOv8)")
    print(f"Data Config : {CONFIG_YAML}")
    print(f"Base Weights: {weights}")
    print(f"Epochs      : {epochs} | Img Size: {imgsz} | Batch Size: {batch}")
    print("=" * 65)

    if not os.path.exists(CONFIG_YAML):
        print(f"\n[!] Dataset YAML not found at: {CONFIG_YAML}")
        print("    Run: python train_custom_foot_model.py --init")
        print("    or : python train_custom_foot_model.py --generate-synthetic 30")
        return

    try:
        from ultralytics import YOLO
    except ImportError:
        print("\n[!] Ultralytics is not installed in current Python environment.")
        print("    Install it via: pip install ultralytics torch torchvision")
        print("    Then re-run: python train_custom_foot_model.py --train")
        return

    model = YOLO(weights)
    print("\n[*] Starting training loop...")
    results = model.train(
        data=CONFIG_YAML,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=os.path.join(SCRIPT_DIR, "runs"),
        name="custom_foot_model",
        exist_ok=True
    )

    # Export to ONNX for production
    try:
        onnx_path = model.export(format="onnx")
        print(f"\n[+] ONNX Model exported successfully: {onnx_path}")
    except Exception as e:
        print(f"\n[!] ONNX export skipped: {e}")

    print("\n[OK] Training completed! Weights saved under train/runs/custom_foot_model/weights/best.pt")


def run_standalone_test(path: str, weights_path: str = None):
    """
    Tests model inference and measurement standalone on an image or directory.
    Uses trained YOLO weights if available, combined with high-precision millimeter pipeline.
    """
    if weights_path is None:
        default_weights = os.path.join(SCRIPT_DIR, "runs", "custom_foot_model", "weights", "best.pt")
        if os.path.exists(default_weights):
            weights_path = default_weights

    if weights_path and os.path.exists(weights_path) and not os.path.isdir(path):
        print("=" * 65)
        print("🔍 Testing with Custom Trained YOLOv8 Weights:")
        print(f"Weights : {os.path.relpath(weights_path, SCRIPT_DIR)}")
        print(f"Image   : {path}")
        print("=" * 65)
        try:
            from ultralytics import YOLO
            yolo_model = YOLO(weights_path)
            res = yolo_model.predict(path, conf=0.25)
            yolo_out = "output_yolo_debug.jpg"
            res[0].save(filename=yolo_out)
            print(f"[+] YOLO Segmentation visualization saved to: '{yolo_out}'")
            print("Detected objects:")
            for b in res[0].boxes:
                cls_name = yolo_model.names[int(b.cls[0])]
                conf = float(b.conf[0])
                print(f"  - {cls_name:<10}: confidence {conf:.1%}")
        except Exception as e:
            print(f"[!] YOLO inference note: {e}")

    # Run full geometric homography and physical millimeter measurement with Credit Card / ID card reference
    from test_card_measurement import test as test_card
    test_card(path)


def main():
    parser = argparse.ArgumentParser(description="Peshawari Chappal AI — Custom Foot Model Suite")
    parser.add_argument("--init", action="store_true", help="Initialize dataset folders and data.yaml")
    parser.add_argument("--generate-synthetic", type=int, metavar="N", help="Generate N synthetic annotated samples for testing")
    parser.add_argument("--train", action="store_true", help="Run YOLOv8-seg model training")
    parser.add_argument("--epochs", type=int, default=30, help="Training epochs (default: 30)")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size (default: 640)")
    parser.add_argument("--batch", type=int, default=8, help="Batch size (default: 8)")
    parser.add_argument("--weights", type=str, default="yolov8n-seg.pt", help="Base weights file")
    parser.add_argument("--test", type=str, metavar="PATH", help="Run standalone test on image or folder")
    args = parser.parse_args()

    if args.init:
        init_dataset_structure()
    elif args.generate_synthetic:
        generate_synthetic_samples(args.generate_synthetic)
    elif args.train:
        run_training(epochs=args.epochs, imgsz=args.imgsz, batch=args.batch, weights=args.weights)
    elif args.test:
        run_standalone_test(args.test)
    else:
        print("=" * 65)
        print("👟 Peshawari Chappal AI — Standalone Foot Model Suite")
        print("=" * 65)
        print("Available options:")
        print("  --init                 : Create dataset folders & YAML template")
        print("  --generate-synthetic N : Generate N synthetic foot samples for training")
        print("  --train                : Start custom YOLOv8-seg training")
        print("  --test <img_or_dir>    : Run measurement & size evaluation standalone")
        print("\nQuick Test Now:")
        print("  python train_custom_foot_model.py --test ../sample_foot.jpg")
        print("=" * 65)


if __name__ == "__main__":
    main()
