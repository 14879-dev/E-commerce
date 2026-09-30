#!/usr/bin/env python3
"""
Comprehensive Academic Black-and-White Diagram Generator
Conforms strictly to academic thesis standards:
- 100% Monochrome / Pure Black & White (No blues, greens, purples, oranges)
- Standard Formal Notations: Gane-Sarson / Yourdon DFDs, UML 2.5 Use Case with Stick Figures,
  Crow's Foot ERD, and UML Sequence Lifelines with Activation Focus Boxes.
- High Resolution 300 DPI with Times New Roman Typography.
"""

import os
import zlib
import urllib.request
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Ellipse

OUTPUT_DIR = os.path.join(os.getcwd(), 'docs_assets')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# HELPER: PlantUML Encoder for Monochrome Architecture Diagram
# -------------------------------------------------------------
def plantuml_encode(plantuml_text):
    plantuml_alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
    def encode6bit(b):
        return plantuml_alphabet[b & 0x3f]
    def append3bytes(b1, b2, b3):
        c1 = b1 >> 2
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
        c3 = ((b2 & 0xf) << 2) | (b3 >> 6)
        c4 = b3 & 0x3f
        return encode6bit(c1) + encode6bit(c2) + encode6bit(c3) + encode6bit(c4)
    utf8_bytes = plantuml_text.encode('utf-8')
    compressed = zlib.compress(utf8_bytes, 9)[2:-4]
    res = []
    i = 0
    while i < len(compressed):
        b1 = compressed[i]
        b2 = compressed[i+1] if i+1 < len(compressed) else 0
        b3 = compressed[i+2] if i+2 < len(compressed) else 0
        res.append(append3bytes(b1, b2, b3))
        i += 3
    return "~1" + "".join(res)

def generate_architecture_diagram():
    puml_bw = """@startuml High_Level_System_Architecture
!theme plain
skinparam backgroundColor #FFFFFF
skinparam monochrome true
skinparam defaultFontName "Times New Roman"
skinparam defaultFontSize 10
skinparam roundCorner 4
skinparam shadowing false
skinparam linetype ortho
skinparam packageTitleAlignment left

skinparam package {
    BorderColor #000000
    BorderThickness 1.5
    FontSize 11
    FontStyle bold
    BackgroundColor #FFFFFF
}

skinparam rectangle {
    BorderColor #000000
    BackgroundColor #FFFFFF
    BorderThickness 1.2
    FontSize 9.5
}

skinparam database {
    BorderColor #000000
    BackgroundColor #FFFFFF
    BorderThickness 1.2
    FontSize 9.5
}

skinparam arrow {
    Color #000000
    Thickness 1.2
    FontSize 9
}

title <b>Figure B-1: High-Level Multi-Tier System Architecture</b>\\n<size:10><i>Peshawari Chappal E-Commerce Platform — Contactless Foot Biometrics, Sizing & Outfit Harmonization</i></size>

package "Tier 1: Client & Presentation Tier (React 19 + TypeScript + Vite + TailwindCSS)" as TIER_CLIENT {
    rectangle "<b>Customer Storefront</b>\\n---\\n* Product Catalog & Search\\n* Category Filtering\\n* Shopping Cart & Wishlist\\n* Responsive Mobile UX" as C_STOREFRONT
    rectangle "<b>AI Foot Size Finder UI</b>\\n---\\n* WebRTC Camera Stream\\n* High-Res Image Upload\\n* A4 Reference Overlay Guide\\n* Instant Dimension Display" as C_FOOT_UI
    rectangle "<b>AI Outfit Matcher UI</b>\\n---\\n* Attire Photo Upload\\n* Color Palette Picker\\n* Leather Harmony Recommendations\\n* Stylist Fit Rationale" as C_OUTFIT_UI
    rectangle "<b>Executive Admin Portal</b>\\n---\\n* Real-Time KPI Dashboard\\n* Product CRUD & Stock Control\\n* Order & Courier Dispatch\\n* Capital, Profit & Expense Ledger" as C_ADMIN_UI
}

package "Tier 2: Application Core & API Gateway (Node.js + Express + TypeScript)" as TIER_BACKEND {
    rectangle "<b>API Gateway & Router</b>\\n---\\n* CORS, Rate Limiting & Helmet\\n* Request Validation (Zod/Joi)\\n* Unified JSON Error Handling" as B_GATEWAY
    rectangle "<b>Security & Auth Service</b>\\n---\\n* JWT Generation & Verification\\n* Role-Based Access Control (RBAC)\\n* Bcrypt Password Hashing" as B_AUTH
    rectangle "<b>Product & Catalog Service</b>\\n---\\n* SKU & Inventory State Machine\\n* Price, Tier & Leather Variants\\n* Dynamic Multi-Attribute Filtering" as B_CATALOG
    rectangle "<b>Order & Logistics Engine</b>\\n---\\n* Checkout & COD Workflow\\n* Courier Tracking Integration\\n* Delivery Status Lifecycle" as B_ORDERS
    rectangle "<b>Financial & Expense Ledger</b>\\n---\\n* Artisan Production Cost Ledger\\n* Overhead & Profit Margin Tracking\\n* Capital Inflow & Outflow Reporting" as B_FINANCE
    rectangle "<b>AI Service Gateway Proxy</b>\\n---\\n* Image Validation & Base64 Payload Dispatch\\n* Asynchronous Proxy to Python Service\\n* Fallback Resilience Handler" as B_AI_PROXY
}

package "Tier 3: AI & Computer Vision Microservice (Python FastAPI — Port 8000)" as TIER_AI {
    rectangle "<b>Image Quality Gate</b>\\n---\\n* Laplacian Blur Variance >= 18\\n* Luminance Diagnostic (30 <= Mean <= 245)\\n* Shadow & Overexposure Filter" as AI_QUALITY
    rectangle "<b>Calibration & Homography Engine</b>\\n---\\n* A4 Paper Detection (210x297 mm)\\n* Planar Homography Warping (DLT Matrix H)\\n* Perspective Rectification\\n* Pixels-Per-Millimeter (PPM) Scaling" as AI_CALIB
    rectangle "<b>Neural Foot Segmentation</b>\\n---\\n* YOLOv8-seg / U2NetP Segmentation\\n* Dense Binary Contour Extraction\\n* Non-Foot Noise Suppression" as AI_SEG
    rectangle "<b>PCA Anatomical Landmark Extractor</b>\\n---\\n* Longitudinal Axis (Eigenvector v1)\\n* Longest Toe Apex (P_toe)\\n* Calcaneus Heel Apex (P_heel)\\n* Metatarsal Width Perpendicular Axis (v2)" as AI_PCA
    rectangle "<b>Footwear Sizing Classifier</b>\\n---\\n* Pakistani / UK Whole Sizes (7 to 13)\\n* +/- 2.5mm Physical Tolerance Interval\\n* Width Profile: Narrow / Regular / Wide\\n* Chappal Model Recommendation Engine" as AI_SIZE
    rectangle "<b>Virtual Outfit Harmonizer</b>\\n---\\n* CIELAB Color-Space Transformation\\n* K-Means Fabric Color Clustering (K=5)\\n* Traditional Leather Dye Rule Matrix\\n* Cultural Aesthetic Compatibility Score" as AI_OUTFIT
    rectangle "<b>Multimodal Neural Vision API</b>\\n---\\n* Secondary Fallback Vision Engine\\n* Descriptive Styling Intelligence\\n* Image Verification Cross-Check" as AI_EXTERNAL
}

package "Tier 4: Data Persistence & Asset Storage" as TIER_DATA {
    database "<b>MongoDB Atlas Cluster</b>\\n---\\n* Users & Customer Accounts\\n* Products, SKUs & Inventory\\n* Customer Orders & Statuses\\n* Capital & Expense Records" as DB_MONGO
    database "<b>Local High-Availability Cache</b>\\n---\\n* Master products.json\\n* Platform settings.json\\n* Instant Offline Fallback" as DB_LOCAL_JSON
    database "<b>Static Media Storage</b>\\n---\\n* Local /uploads/ Directory\\n* High-Res Product Photography\\n* AI Proof & Annotated Overlays" as DB_MEDIA
}

C_STOREFRONT --> B_GATEWAY : HTTPS / JSON REST
C_FOOT_UI --> B_GATEWAY : Multipart Upload / Base64
C_OUTFIT_UI --> B_GATEWAY : HTTPS / JSON REST
C_ADMIN_UI --> B_GATEWAY : Bearer JWT Authorization

B_GATEWAY --> B_AUTH : Validate Session
B_GATEWAY --> B_CATALOG : Route Catalog Actions
B_GATEWAY --> B_ORDERS : Route Checkout / Orders
B_GATEWAY --> B_FINANCE : Route Accounting Actions
B_GATEWAY --> B_AI_PROXY : Route AI Inferences

B_AI_PROXY --> AI_QUALITY : HTTP POST /api/py/calculate-foot-size
B_AI_PROXY --> AI_OUTFIT : HTTP POST /api/py/match-outfit

AI_QUALITY --> AI_CALIB : Image Validated
AI_CALIB --> AI_SEG : Rectified Image (PPM Scaled)
AI_SEG --> AI_PCA : Binary Foot Contour
AI_PCA --> AI_SIZE : Metric Length & Width (mm)
B_AI_PROXY ..> AI_EXTERNAL : Fallback / Verification Request

B_CATALOG --> DB_MONGO : Mongoose ODM Query
B_ORDERS --> DB_MONGO : Atomic Order Transactions
B_FINANCE --> DB_MONGO : Financial State Persistence
B_CATALOG --> DB_LOCAL_JSON : Atomic Disk Sync / Fallback Read
B_GATEWAY --> DB_MEDIA : Static File Serve (/uploads)

@enduml"""
    code = plantuml_encode(puml_bw)
    png_url = f"http://www.plantuml.com/plantuml/png/{code}"
    req = urllib.request.Request(png_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            out_file = os.path.join(OUTPUT_DIR, 'arch_diagram.png')
            with open(out_file, 'wb') as f:
                f.write(data)
            print("[OK] [B&W] Architecture Diagram rendered via PlantUML:", out_file)
            return
    except Exception as e:
        print("Notice: PlantUML online render failed, falling back to local Matplotlib B&W renderer:", str(e).encode('ascii', errors='ignore').decode())
    
    # Fallback local pure B&W Matplotlib rendering
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-1: High-Level Multi-Tier System Architecture", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    # Tiers in pure black and white
    tiers = [
        ("Tier 1: Client & Presentation Tier (React 19 + TypeScript + Vite + TailwindCSS)", (4, 68), 92, 23),
        ("Tier 2: Application Core & API Gateway (Node.js + Express + TypeScript)", (4, 37), 54, 25),
        ("Tier 3: AI & Computer Vision Microservice (Python FastAPI — Port 8000)", (62, 37), 34, 25),
        ("Tier 4: Data Persistence Tier (MongoDB Atlas + Local Master JSON + Media)", (4, 6), 92, 24),
    ]
    for label, (x, y), w, h in tiers:
        rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8", ec="#000000", fc="#FFFFFF", lw=1.5)
        ax.add_patch(rect)
        ax.text(x + 2, y + h - 3.5, label, fontsize=9, fontweight='bold', fontfamily='Times New Roman', color='#000000')

    # Tier 1 Components
    c1 = [
        ("Customer Storefront\n(Catalog, Search, Cart)", (6, 70), 20),
        ("AI Foot Size Finder UI\n(A4 Reference Upload)", (29, 70), 22),
        ("AI Outfit Matcher UI\n(Color Contrast Engine)", (54, 70), 20),
        ("Executive Admin Portal\n(KPIs, Logistics, Ledger)", (77, 70), 18),
    ]
    for name, (x, y), w in c1:
        box = FancyBboxPatch((x, y), w, 15, boxstyle="round,pad=0.4", ec="#000000", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 7.5, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    ax.annotate('', xy=(50, 62), xytext=(50, 68), arrowprops=dict(arrowstyle="<->", color="#000000", lw=1.3))
    ax.text(52, 65, "HTTPS / REST API / Bearer JWT Authorization", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    # Tier 2 Components
    c2 = [
        ("Product & Catalog\nService", (6, 40), 15),
        ("Order, Courier &\nTracking Engine", (23, 40), 16),
        ("Admin, Security &\nCapital Ledger", (41, 40), 15),
    ]
    for name, (x, y), w in c2:
        box = FancyBboxPatch((x, y), w, 16, boxstyle="round,pad=0.4", ec="#000000", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 8, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Tier 3 Components
    c3 = [
        ("YOLOv8 / U2NetP Segmentation", (64, 52), 30),
        ("A4 Homography & Metric Caliper", (64, 46), 30),
        ("Pakistani/UK Sizing (Sizes 7-13)", (64, 40), 30),
    ]
    for name, (x, y), w in c3:
        box = FancyBboxPatch((x, y), w, 4.8, boxstyle="round,pad=0.2", ec="#000000", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 2.4, name, fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    ax.annotate('', xy=(62, 49), xytext=(58, 49), arrowprops=dict(arrowstyle="<->", color="#000000", lw=1.3))
    ax.text(60, 50.5, "HTTP POST", fontsize=7, fontfamily='Times New Roman', ha='center', color='#000000')

    # Tier 4 Components
    c4 = [
        ("MongoDB Atlas Cloud Cluster\n(Mongoose ODM Schemas)", (6, 9), 26),
        ("Local Master JSON Storage\n(products.json, settings.json)", (35, 9), 28),
        ("Static Media Storage\n(Local /uploads/ Directory)", (66, 9), 28),
    ]
    for name, (x, y), w in c4:
        box = FancyBboxPatch((x, y), w, 15, boxstyle="round,pad=0.4", ec="#000000", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 7.5, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    ax.annotate('', xy=(31, 31), xytext=(31, 37), arrowprops=dict(arrowstyle="<->", color="#000000", lw=1.3))
    ax.text(33, 34, "Mongoose ODM / Atomic Disk Sync", fontsize=7.5, fontfamily='Times New Roman', color="#000000")

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'arch_diagram.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] Architecture Diagram rendered via Matplotlib:", out_file)

# -------------------------------------------------------------
# 2. DFD Level 0 Context Diagram (Pure Black & White)
# -------------------------------------------------------------
def generate_dfd_level0():
    fig, ax = plt.subplots(figsize=(11, 7), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-2: Data Flow Diagram (DFD) Level 0 — Context Diagram", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    # Process 0.0 (Gane-Sarson / Yourdon circle in B&W)
    cp = Circle((50, 50), 16, ec="#000000", fc="#FFFFFF", lw=2)
    ax.add_patch(cp)
    ax.plot([34, 66], [54, 54], color="#000000", lw=1.2)
    ax.text(50, 57, "0.0", fontsize=11, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')
    ax.text(50, 47, "Peshawari Chappal\nE-Commerce Core\nSystem", fontsize=8.5, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    # External Entities (Double-lined or heavy border rectangles in B&W)
    entities = [
        ("CUSTOMER", (5, 58), 20, 15),
        ("SUPER ADMINISTRATOR /\nSTORE MANAGER", (5, 20), 22, 16),
        ("MULTIMODAL AI\nVISION SERVICE", (74, 68), 21, 15),
        ("COURIER LOGISTICS\nSERVICE", (74, 38), 21, 15),
        ("PAYMENT GATEWAY\n(COD / WALLET)", (74, 8), 21, 15),
    ]

    for label, (x, y), w, h in entities:
        rect = Rectangle((x, y), w, h, ec="#000000", fc="#FFFFFF", lw=1.8)
        ax.add_patch(rect)
        rect_inner = Rectangle((x+0.8, y+0.8), w-1.6, h-1.6, ec="#000000", fc="#FFFFFF", lw=0.6)
        ax.add_patch(rect_inner)
        ax.text(x + w/2, y + h/2, label, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Exact Labeled Directed Data Flows
    ax.annotate('', xy=(34, 57), xytext=(25, 65), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(26, 68, "Foot Photo [RGB], Size Selection (7-13), Order Info", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(25, 60), xytext=(34, 52), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(26, 50, "Recommended Size, Invoice, Consignment Tracking", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(37, 40), xytext=(27, 28), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(20, 34, "Product Catalog CRUD, Procurement Capital Budget", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(27, 23), xytext=(37, 36), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(21, 17, "KDM Financial Statements, Inventory Alerts, Sales Logs", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(74, 75), xytext=(63, 61), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(67, 72, "Raw Foot / Attire Base64", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(64, 57), xytext=(74, 71), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(68, 62, "Foot Dimensions (mm), Size, Leather Match", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(74, 46), xytext=(66, 48), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(67, 50, "Consignment Booking Request", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(66, 44), xytext=(74, 41), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(68, 38, "Tracking ID & Dispatch Status", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(74, 18), xytext=(63, 38), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(67, 25, "Payment Verification Request", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    ax.annotate('', xy=(59, 36), xytext=(74, 14), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(68, 13, "Payment Settlement Receipt", fontsize=7.5, fontfamily='Times New Roman', color='#000000')

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'dfd_level0.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] DFD Level 0 generated:", out_file)

# -------------------------------------------------------------
# 3. DFD Level 1 Core Process Decomposition (Pure Black & White)
# -------------------------------------------------------------
def generate_dfd_level1():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-3: Data Flow Diagram (DFD) Level 1 — Core Process Decomposition", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    # Processes in Gane-Sarson / Standard Notation (Numbered top header)
    processes = [
        ("1.0", "Identity & Role-Based\nAccess Control", (8, 68), 22, 14),
        ("2.0", "Catalog & Sizing\nManagement (7-13)", (38, 68), 24, 14),
        ("3.0", "AI Multimodal Sizing\n& Outfit Analysis", (70, 68), 24, 14),
        ("4.0", "Cart, Checkout &\nOrder Fulfillment", (20, 36), 26, 14),
        ("5.0", "Procurement Capital &\nFinancial Ledger", (60, 36), 26, 14),
    ]

    for num, name, (x, y), w, h in processes:
        p_box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", ec="#000000", fc="#FFFFFF", lw=1.5)
        ax.add_patch(p_box)
        ax.plot([x, x + w], [y + h - 3.8, y + h - 3.8], color="#000000", lw=1)
        ax.text(x + 2.5, y + h - 2.5, num, fontsize=8, fontweight='bold', fontfamily='Times New Roman', color='#000000')
        ax.text(x + w/2, y + (h-4)/2, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Data Stores (Open-ended parallel horizontal lines with Store ID)
    stores = [
        ("D1", "Products & Inventory Master Store", (6, 10), 25, 9),
        ("D2", "Orders & Consignments Transaction Store", (37, 10), 28, 9),
        ("D3", "Procurement Capital & Financial Ledger", (70, 10), 26, 9),
    ]

    for code, name, (x, y), w, h in stores:
        # Standard Gane & Sarson data store: left vertical line, top horizontal, bottom horizontal (right open)
        ax.plot([x, x, x + w], [y + h, y, y], color="#000000", lw=1.5)
        ax.plot([x, x + w], [y + h, y + h], color="#000000", lw=1.5)
        ax.plot([x + 6, x + 6], [y, y + h], color="#000000", lw=1)
        ax.text(x + 3, y + h/2, code, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')
        ax.text(x + 6 + (w-6)/2, y + h/2, name, fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # External Entities
    entities = [
        ("SUPER ADMIN", (6, 88), 18, 6),
        ("CUSTOMER", (42, 88), 18, 6),
        ("AI SERVICE", (74, 88), 18, 6),
    ]
    for name, (x, y), w, h in entities:
        rect = Rectangle((x, y), w, h, ec="#000000", fc="#FFFFFF", lw=1.5)
        ax.add_patch(rect)
        rect_inner = Rectangle((x+0.5, y+0.5), w-1.0, h-1.0, ec="#000000", fc="#FFFFFF", lw=0.5)
        ax.add_patch(rect_inner)
        ax.text(x + w/2, y + h/2, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Data Flow Annotations
    ax.annotate('', xy=(12, 82), xytext=(12, 88), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.1))
    ax.text(14, 85, "Login Credentials", fontsize=7, fontfamily='Times New Roman')

    ax.annotate('', xy=(46, 82), xytext=(46, 88), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.1))
    ax.text(48, 85, "Query Catalog", fontsize=7, fontfamily='Times New Roman')

    ax.annotate('', xy=(76, 82), xytext=(58, 88), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.1))
    ax.text(68, 85, "Foot Photo", fontsize=7, fontfamily='Times New Roman')

    ax.annotate('', xy=(20, 19), xytext=(42, 68), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.1))
    ax.text(32, 45, "Read / Query Stock (Sizes 7-13)", fontsize=7, fontfamily='Times New Roman', color="#000000")

    ax.annotate('', xy=(44, 19), xytext=(35, 36), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.1))
    ax.text(42, 28, "Commit Confirmed Order", fontsize=7, fontfamily='Times New Roman', color="#000000")

    ax.annotate('', xy=(78, 19), xytext=(74, 36), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.1))
    ax.text(78, 28, "Update Capital Inflow/Outflow", fontsize=7, fontfamily='Times New Roman', color="#000000")

    ax.annotate('', xy=(85, 88), xytext=(85, 82), arrowprops=dict(arrowstyle="<->", color="#000000", lw=1.1))

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'dfd_level1.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] DFD Level 1 generated:", out_file)

# -------------------------------------------------------------
# 4. DFD Level 2: AI Foot Sizing Subsystem (Pure Black & White)
# -------------------------------------------------------------
def generate_dfd_level2_ai():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-4: Data Flow Diagram (DFD) Level 2 — AI Foot Sizing Subsystem", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    subprocesses = [
        ("3.1", "A4 Reference Sheet\nHomography Calibration", (8, 60), 24, 16),
        ("3.2", "Foot Contour & Heel-to-Toe\nKeypoint Extraction", (40, 60), 24, 16),
        ("3.3", "Metric MM Calculation &\nArch Width Estimation", (70, 60), 24, 16),
        ("3.4", "Pakistani / UK Size\nClassification (Sizes 7 to 13)", (40, 20), 26, 16),
    ]

    for num, name, (x, y), w, h in subprocesses:
        p_box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", ec="#000000", fc="#FFFFFF", lw=1.5)
        ax.add_patch(p_box)
        ax.plot([x, x + w], [y + h - 3.8, y + h - 3.8], color="#000000", lw=1)
        ax.text(x + 2.5, y + h - 2.5, num, fontsize=8, fontweight='bold', fontfamily='Times New Roman', color='#000000')
        ax.text(x + w/2, y + (h-4)/2, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Data Store D4
    ax.plot([70, 70, 94], [32, 22, 22], color="#000000", lw=1.5)
    ax.plot([70, 94], [32, 32], color="#000000", lw=1.5)
    ax.plot([76, 76], [22, 32], color="#000000", lw=1)
    ax.text(73, 27, "D4", fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')
    ax.text(85, 27, "Size Rules & Tolerance\n(260mm - 305mm)", fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Entity Customer Camera
    e = Rectangle((8, 24), 22, 12, ec="#000000", fc="#FFFFFF", lw=1.5)
    ax.add_patch(e)
    e_in = Rectangle((8.8, 24.8), 20.4, 10.4, ec="#000000", fc="#FFFFFF", lw=0.5)
    ax.add_patch(e_in)
    ax.text(19, 30, "CUSTOMER CAMERA /\nIMAGE UPLOAD", fontsize=7.5, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')

    ax.annotate('', xy=(19, 60), xytext=(19, 36), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(20, 48, "Raw Foot Image [RGB]", fontsize=7.5, fontfamily='Times New Roman')

    ax.annotate('', xy=(40, 68), xytext=(32, 68), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(36, 71, "Pixels / mm Scale", fontsize=7, fontfamily='Times New Roman', ha='center')

    ax.annotate('', xy=(70, 68), xytext=(64, 68), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(67, 71, "P_heel & P_toe Pts", fontsize=7, fontfamily='Times New Roman', ha='center')

    ax.annotate('', xy=(53, 36), xytext=(82, 60), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
    ax.text(70, 46, "Length (mm) & Width (mm)", fontsize=7.5, fontfamily='Times New Roman')

    ax.annotate('', xy=(66, 27), xytext=(70, 27), arrowprops=dict(arrowstyle="<-", color="#000000", lw=1.2))
    ax.text(68, 29, "Sizing Thresholds", fontsize=7, fontfamily='Times New Roman', ha='center')

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'dfd_level2_ai.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] DFD Level 2 generated:", out_file)

# -------------------------------------------------------------
# 5. UML Use Case Diagram (Pure Black & White with Stick Figures)
# -------------------------------------------------------------
def generate_usecase_diagram():
    fig, ax = plt.subplots(figsize=(12, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-5: Complete UML Use Case Diagram", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    # System Boundary Box
    sb = Rectangle((26, 4), 48, 88, ec="#000000", fc="#FFFFFF", lw=1.5, linestyle="--")
    ax.add_patch(sb)
    ax.text(28, 89.5, "Peshawari Chappal Platform Boundary", fontsize=8.5, fontweight='bold', fontfamily='Times New Roman', color='#000000')

    # Stick Figure Draw Helper
    def draw_actor(x, y, label):
        # Head
        c = Circle((x, y + 4), 2.2, ec="#000000", fc="#FFFFFF", lw=1.5)
        ax.add_patch(c)
        # Spine
        ax.plot([x, x], [y + 1.8, y - 4.5], color="#000000", lw=1.5)
        # Arms
        ax.plot([x - 3.5, x + 3.5], [y - 0.5, y - 0.5], color="#000000", lw=1.5)
        # Left Leg
        ax.plot([x, x - 3], [y - 4.5, y - 10], color="#000000", lw=1.5)
        # Right Leg
        ax.plot([x, x + 3], [y - 4.5, y - 10], color="#000000", lw=1.5)
        # Label
        ax.text(x, y - 13, label, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    # Actors (Standard Stick Figures)
    draw_actor(12, 58, "Customer")
    draw_actor(88, 68, "Super Administrator")
    draw_actor(88, 30, "Store Manager")

    # Use Cases (Horizontal Ellipses)
    usecases = [
        ("UC-01: Browse Catalog & Filter Sizes (7-13)", (50, 82), 36, 5.5),
        ("UC-02: Search & Filter by Artisan Category", (50, 74), 36, 5.5),
        ("UC-03: AI Foot Sizing via A4 Calibration", (50, 66), 38, 5.5),
        ("UC-04: Virtual Outfit Color Matcher", (50, 58), 36, 5.5),
        ("UC-05: Place Order via COD / Online Wallet", (50, 50), 38, 5.5),
        ("UC-06: Real-Time Consignment Tracking", (50, 42), 36, 5.5),
        ("UC-07: Multimodal Product AI Auto-Fill", (50, 34), 36, 5.5),
        ("UC-08: Manage Supplier Procurement Capital", (50, 26), 38, 5.5),
        ("UC-09: Order Fulfillment & Courier Dispatch", (50, 18), 38, 5.5),
        ("UC-10: Manager Account Role Delegation", (50, 10), 36, 5.5),
    ]

    for name, (x, y), w, h in usecases:
        ellipse = Ellipse((x, y), w, h, ec="#000000", fc="#FFFFFF", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(x, y, name, fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#000000')

    # Standard UML Associations (SOLID LINES WITHOUT ARROWHEADS connecting actors to usecases)
    for i in range(6):
        uc_y = 82 - (i * 8)
        ax.plot([15, 32], [55, uc_y], color="#000000", lw=1.1)

    for i in range(6, 10):
        uc_y = 82 - (i * 8)
        ax.plot([85, 68], [65, uc_y], color="#000000", lw=1.1)

    ax.plot([85, 68], [28, 18], color="#000000", lw=1.1)
    ax.plot([85, 68], [28, 34], color="#000000", lw=1.1)

    # Stereotypes: include / extend relationship between UC-03 and Calibration
    ax.text(68, 62, "«include»", fontsize=6.5, fontfamily='Times New Roman', style='italic')

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'usecase_diagram.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] Use Case Diagram generated:", out_file)

# -------------------------------------------------------------
# 6. Entity-Relationship Diagram (ERD) (Pure Black & White)
# -------------------------------------------------------------
def generate_erd_diagram():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-6: Entity-Relationship Diagram (ERD) with Field Constraints", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    def draw_entity(name, fields, x, y, w, h):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2", ec="#000000", fc="#FFFFFF", lw=1.5)
        ax.add_patch(box)
        # Header compartment
        ax.plot([x, x + w], [y + h - 4.5, y + h - 4.5], color="#000000", lw=1.2)
        ax.text(x + w/2, y + h - 2.5, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#000000')
        
        for idx, (f_name, f_type) in enumerate(fields):
            curr_y = y + h - 7 - (idx * 2.8)
            ax.text(x + 1, curr_y, f_name, fontsize=7, fontfamily='Times New Roman', color='#000000')
            ax.text(x + w - 1, curr_y, f_type, fontsize=6.5, fontfamily='Times New Roman', ha='right', color='#000000')

    e_product = [
        ("id [PK]", "String [Unique]"),
        ("name", "String"),
        ("slug", "String [Unique]"),
        ("price", "Number"),
        ("costPrice", "Number"),
        ("category [FK]", "String"),
        ("availableSizes", "Array[7..13]"),
        ("stockCount", "Number"),
    ]
    draw_entity("PRODUCT", e_product, 6, 52, 26, 38)

    e_category = [
        ("id [PK]", "String [Unique]"),
        ("name", "String"),
        ("slug", "String [Unique]"),
        ("disabled", "Boolean"),
    ]
    draw_entity("CATEGORY", e_category, 6, 12, 26, 26)

    e_order = [
        ("id [PK]", "String [Unique]"),
        ("orderNumber", "String"),
        ("customerName", "String"),
        ("phone", "String"),
        ("subtotal", "Number"),
        ("shippingFee", "Number"),
        ("total", "Number"),
        ("status", "String"),
    ]
    draw_entity("ORDER", e_order, 38, 52, 26, 38)

    e_order_item = [
        ("id [PK]", "String"),
        ("orderId [FK]", "String"),
        ("productId [FK]", "String"),
        ("selectedSize", "Number (7-13)"),
        ("selectedColor", "String"),
        ("quantity", "Number"),
        ("unitPrice", "Number"),
    ]
    draw_entity("ORDER_ITEM", e_order_item, 38, 12, 26, 32)

    e_capital = [
        ("id [PK]", "String"),
        ("type", "String (add/rem/set)"),
        ("amount", "Number"),
        ("previousBudget", "Number"),
        ("newBudget", "Number"),
        ("note", "String"),
        ("date", "String"),
    ]
    draw_entity("SUPPLIER_BUDGET_LOG", e_capital, 70, 52, 26, 38)

    e_admin = [
        ("id [PK]", "String"),
        ("username", "String [Unique]"),
        ("passwordHash", "String"),
        ("role", "superadmin | manager"),
    ]
    draw_entity("ADMIN_USER", e_admin, 70, 16, 26, 26)

    # Cardinality Lines & Crow's Foot Notations
    # 1:N Category to Product
    ax.plot([19, 19], [38, 52], color="#000000", lw=1.3)
    ax.text(21, 45, "1 : N (0..*)", fontsize=7.5, fontfamily='Times New Roman', color="#000000")

    # 1:N Order to OrderItem
    ax.plot([51, 51], [52, 44], color="#000000", lw=1.3)
    ax.text(53, 47, "1 : N (1..*)", fontsize=7.5, fontfamily='Times New Roman', color="#000000")

    # 1:N Product to OrderItem
    ax.plot([32, 38], [54, 25], color="#000000", lw=1.3)
    ax.text(35, 40, "1 : N", fontsize=7.5, fontfamily='Times New Roman', color="#000000")

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'erd_diagram.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] ERD Diagram generated:", out_file)

# -------------------------------------------------------------
# 7. Sequence Diagram: Multimodal AI Auto-Fill (Pure Black & White)
# -------------------------------------------------------------
def generate_seq_diagram_ai():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-7: UML Sequence Diagram — Multimodal AI Product Auto-Fill Cascade", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    lifelines = [
        ("Super Admin", 10),
        ("React Admin Tab", 30),
        ("Express Gateway", 50),
        ("Primary AI Model", 70),
        ("Secondary AI Gateway", 88),
    ]

    for name, x in lifelines:
        box = Rectangle((x - 8, 86), 16, 6, ec="#000000", fc="#FFFFFF", lw=1.3)
        ax.add_patch(box)
        ax.text(x, 89, name, fontsize=7.5, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')
        ax.plot([x, x], [12, 86], color="#000000", linestyle="--", lw=0.9)

    # Activation Boxes (Thin white rectangles on lifelines)
    activations = [
        (10, 78, 4),
        (30, 20, 60),
        (50, 28, 48),
        (70, 60, 10),
        (88, 44, 10),
    ]
    for x, y, h in activations:
        act = Rectangle((x - 1, y), 2, h, ec="#000000", fc="#FFFFFF", lw=1.1)
        ax.add_patch(act)

    steps = [
        ("1. Upload Product Image & Click 'Auto-Fill'", 10, 30, 80, "->"),
        ("2. POST /api/admin/ai-analyze-product (image base64)", 30, 50, 74, "->"),
        ("3. Call Primary Multimodal Vision Model", 50, 70, 68, "->"),
        ("4. [If Rate Limit 429] Failover Notice", 70, 50, 60, "-->"),
        ("5. Forward to Secondary AI Gateway", 50, 88, 52, "->"),
        ("6. Return Structured JSON (Title, Leather Tone, Specs)", 88, 50, 44, "-->"),
        ("7. Strip Price Fields (Enforce Zero Pricing Rule)", 50, 50, 36, "self"),
        ("8. Return Sanitized JSON Response", 50, 30, 28, "-->"),
        ("9. Populate Form Fields & Hex Color Swatch", 30, 10, 20, "-->"),
    ]

    for label, x1, x2, y, style in steps:
        if style == "self":
            ax.annotate('', xy=(x1 + 4, y - 2), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
            ax.plot([x1, x1 + 4, x1 + 4], [y, y, y - 2], color="#000000", lw=1.2)
            ax.text(x1 + 5, y - 1, label, fontsize=7.5, fontfamily='Times New Roman', color='#000000')
        elif style == "->":
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#000000')
        else:
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", linestyle="--", color="#000000", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#000000')

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'seq_diagram_ai.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] Sequence AI Diagram generated:", out_file)

# -------------------------------------------------------------
# 8. Sequence Diagram: Order Placement (Pure Black & White)
# -------------------------------------------------------------
def generate_seq_diagram_order():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure B-8: UML Sequence Diagram — Customer Order Checkout & Real-Time Fulfillment Flow", 
            fontsize=12, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#000000')

    lifelines = [
        ("Customer", 12),
        ("Cart / Checkout UI", 32),
        ("Express Backend", 54),
        ("Dual-Tier Storage", 74),
        ("Courier Dispatch", 90),
    ]

    for name, x in lifelines:
        box = Rectangle((x - 8, 86), 16, 6, ec="#000000", fc="#FFFFFF", lw=1.3)
        ax.add_patch(box)
        ax.text(x, 89, name, fontsize=7.5, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')
        ax.plot([x, x], [12, 86], color="#000000", linestyle="--", lw=0.9)

    # Activation Boxes
    activations = [
        (12, 78, 4),
        (32, 26, 56),
        (54, 34, 40),
        (74, 50, 10),
        (90, 42, 6),
    ]
    for x, y, h in activations:
        act = Rectangle((x - 1, y), 2, h, ec="#000000", fc="#FFFFFF", lw=1.1)
        ax.add_patch(act)

    steps = [
        ("1. Select Size (7-13), Color & Click 'Buy Now'", 12, 32, 80, "->"),
        ("2. POST /api/orders (Shipping, Items, Payment Method)", 32, 54, 73, "->"),
        ("3. Verify Stock & Validate Shipping Threshold", 54, 54, 66, "self"),
        ("4. Atomic Upsert Order & Deduct Inventory Stock", 54, 74, 58, "->"),
        ("5. Confirm Persistence in MongoDB & Local Disk", 74, 54, 50, "-->"),
        ("6. Generate Tracking ID & Assign Courier Step", 54, 90, 42, "->"),
        ("7. Return Order Success & Invoice Number", 54, 32, 34, "-->"),
        ("8. Render Dynamic Timeline & Tracking Stepper", 32, 12, 26, "-->"),
    ]

    for label, x1, x2, y, style in steps:
        if style == "self":
            ax.annotate('', xy=(x1 + 4, y - 2), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
            ax.plot([x1, x1 + 4, x1 + 4], [y, y, y - 2], color="#000000", lw=1.2)
            ax.text(x1 + 5, y - 1, label, fontsize=7.5, fontfamily='Times New Roman', color='#000000')
        elif style == "->":
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#000000", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#000000')
        else:
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", linestyle="--", color="#000000", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#000000')

    plt.tight_layout()
    out_file = os.path.join(OUTPUT_DIR, 'seq_diagram_order.png')
    plt.savefig(out_file, dpi=300)
    plt.close()
    print("[OK] [B&W] Sequence Order Diagram generated:", out_file)

if __name__ == '__main__':
    print("Generating all 8 diagrams in pure academic Black & White...")
    generate_architecture_diagram()
    generate_dfd_level0()
    generate_dfd_level1()
    generate_dfd_level2_ai()
    generate_usecase_diagram()
    generate_erd_diagram()
    generate_seq_diagram_ai()
    generate_seq_diagram_order()
    print("All diagrams generated in pure academic Black & White with exact formal notations!")
