# Peshawari Chappal AI — Custom Foot Model Training & Architecture Guide

This directory contains the custom neural models and weights for foot segmentation, landmark localization, and precision millimeter sizing.

---

## 🏗️ Architecture Overview

The pipeline executes **100% locally and offline** without external cloud APIs:

1. **Neural Semantic Foot Segmentation (`U2NetP` / Salient Object Detection)**:
   - Segments the bare foot from diverse floor backgrounds (hardwood, ceramic tile, marble, rug).
2. **Multi-Space Morphological Pre-processing**:
   - Adaptive CLAHE in LAB space, Otsu thresholding in YCrCb skin-color space, and Canny edge dilation.
3. **Anatomical Principal Component Analysis (PCA)**:
   - Computes the primary eigenvector axis of the segmented foot contour.
   - Extracts exact landmark endpoints: Longest Toe Apex $\mathbf{P}_{\text{toe}} = (x_t, y_t)$ and Heel Curvature Center $\mathbf{P}_{\text{heel}} = (x_h, y_h)$.
4. **Euclidean Metric Calibration**:
   $$\text{Length}_{\text{mm}} = \frac{\|\mathbf{P}_{\text{toe}} - \mathbf{P}_{\text{heel}}\|_2}{\text{Pixels-per-mm}}$$
5. **KhyberSole Peshawari Chappal Fit Classifier**:
   - Maps millimeter length and ball girth width to EU (39–47), UK, and US sizing.

---

## 🚀 How to Train Your Custom Model

To fine-tune or train a custom YOLOv8 / U-Net model on your own dataset:

### Step 1: Prepare Dataset
Organize images and annotations in standard YOLO / COCO format:
```
python_service/train/dataset/
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

### Step 2: Run Training Script
```bash
cd python_service/train
python train_custom_foot_model.py --epochs 50 --imgsz 640 --batch 16
```

### Step 3: Export Weights to `models/`
After training, copy the exported `.onnx` or `.pt` weights to:
```
python_service/models/custom_foot_model.onnx
```
The service will automatically detect and prioritize your trained weights on startup.
