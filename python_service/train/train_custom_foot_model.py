#!/usr/bin/env python3
"""
Custom Foot Sizing & Segmentation Model Trainer
Trains custom YOLOv8 / Ultralytics segmentation models for foot & calibration reference detection.
"""

import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description="Train custom foot segmentation model")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--weights", type=str, default="yolov8n-seg.pt", help="Pretrained base weights")
    parser.add_argument("--data", type=str, default="foot_dataset.yaml", help="Dataset yaml config")
    args = parser.parse_args()

    print("=" * 60)
    print("👟 Peshawari Chappal AI — Custom Foot Model Training")
    print(f"Epochs: {args.epochs} | Image Size: {args.imgsz} | Batch: {args.batch}")
    print("=" * 60)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("\n[!] Ultralytics not installed. Install with: pip install ultralytics")
        print("Example training command after installation:")
        print(f"yolo segment train data={args.data} model={args.weights} epochs={args.epochs} imgsz={args.imgsz}")
        return

    model = YOLO(args.weights)
    if not os.path.exists(args.data):
        print(f"[!] Dataset config '{args.data}' not found. Please provide annotations.")
        return

    print(f"\nStarting training on {args.data}...")
    results = model.train(data=args.data, epochs=args.epochs, imgsz=args.imgsz, batch=args.batch)
    
    # Export to ONNX for fast C++ / Python inference
    model.export(format="onnx")
    print("\n✓ Training and ONNX export completed successfully!")

if __name__ == "__main__":
    main()
