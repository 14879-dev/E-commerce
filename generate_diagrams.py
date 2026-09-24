import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle

OUTPUT_DIR = os.path.join(os.getcwd(), 'docs_assets')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. System Architecture Diagram
# -------------------------------------------------------------
def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 96, "Figure 1: High-Level Multi-Tier System Architecture", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    # Tier 1: Client Tier
    t1 = FancyBboxPatch((4, 68), 92, 23, boxstyle="round,pad=1", ec="#2B6CB0", fc="#EBF8FF", lw=1.5)
    ax.add_patch(t1)
    ax.text(6, 88, "CLIENT & PRESENTATION TIER (React 19 + TypeScript + Vite + TailwindCSS)", 
            fontsize=10, fontweight='bold', fontfamily='Times New Roman', color='#2B6CB0')

    c1 = [
        ("Customer Storefront\n(Hero, Catalog, Search)", (6, 70), 16),
        ("3D Real-Time Customizer\n(Three.js + Mesh Extrusion)", (24, 70), 18),
        ("AI Foot Size Finder\n(A4 Reference Camera/Upload)", (44, 70), 18),
        ("AI Outfit Matcher\n(Color Contrast Engine)", (64, 70), 15),
        ("Executive Admin Portal\n(KPIs, Logistics, Capital)", (81, 70), 14),
    ]
    for name, (x, y), w in c1:
        box = FancyBboxPatch((x, y), w, 15, boxstyle="round,pad=0.5", ec="#3182CE", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 7.5, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#2D3748')

    ax.annotate('', xy=(50, 62), xytext=(50, 67), arrowprops=dict(arrowstyle="<->", color="#4A5568", lw=1.5))
    ax.text(52, 64.5, "HTTPS / REST API / JSON Web Tokens (JWT)", fontsize=8, fontfamily='Times New Roman', color='#4A5568')

    # Tier 2: Application Core
    t2 = FancyBboxPatch((4, 37), 54, 25, boxstyle="round,pad=1", ec="#2C7A7B", fc="#E6FFFA", lw=1.5)
    ax.add_patch(t2)
    ax.text(6, 59, "APPLICATION CORE (Node.js + Express + TypeScript)", 
            fontsize=10, fontweight='bold', fontfamily='Times New Roman', color='#2C7A7B')

    c2 = [
        ("Product & Catalog\nService", (6, 40), 15),
        ("Order, Courier &\nTracking Engine", (23, 40), 16),
        ("Admin, Security &\nCapital Ledger", (41, 40), 15),
    ]
    for name, (x, y), w in c2:
        box = FancyBboxPatch((x, y), w, 16, boxstyle="round,pad=0.5", ec="#319795", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 8, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#2D3748')

    # Tier 3: AI Multimodal Tier
    t3 = FancyBboxPatch((62, 37), 34, 25, boxstyle="round,pad=1", ec="#805AD5", fc="#FAF5FF", lw=1.5)
    ax.add_patch(t3)
    ax.text(64, 59, "AI MULTIMODAL TIER", 
            fontsize=10, fontweight='bold', fontfamily='Times New Roman', color='#805AD5')

    c3 = [
        ("Tier 1: Gemini 3.6 Flash Vision", (64, 50), 30),
        ("Tier 2: Experiential Labs AI Gateway", (64, 44), 30),
        ("Tier 3: Heuristic Catalog Engine", (64, 38), 30),
    ]
    for name, (x, y), w in c3:
        box = FancyBboxPatch((x, y), w, 4.8, boxstyle="round,pad=0.3", ec="#9F7AEA", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 2.4, name, fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#2D3748')

    ax.annotate('', xy=(62, 49), xytext=(58, 49), arrowprops=dict(arrowstyle="<->", color="#805AD5", lw=1.5))

    # Tier 4: Data Storage Tier
    t4 = FancyBboxPatch((4, 6), 92, 24, boxstyle="round,pad=1", ec="#C05621", fc="#FFFAF0", lw=1.5)
    ax.add_patch(t4)
    ax.text(6, 26.5, "DATA PERSISTENCE & CLUSTER TIER (Dual-Tier Storage Architecture)", 
            fontsize=10, fontweight='bold', fontfamily='Times New Roman', color='#C05621')

    c4 = [
        ("MongoDB Atlas Cloud Cluster\n(Mongoose ODM Schemas)", (6, 9), 26),
        ("Local Master JSON Storage\n(products.json, settings.json)", (35, 9), 28),
        ("File & Media Storage\n(Multer /uploads/ Hero & Brand)", (66, 9), 28),
    ]
    for name, (x, y), w in c4:
        box = FancyBboxPatch((x, y), w, 15, boxstyle="round,pad=0.5", ec="#DD6B20", fc="#FFFFFF", lw=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + 7.5, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#2D3748')

    ax.annotate('', xy=(31, 31), xytext=(31, 37), arrowprops=dict(arrowstyle="<->", color="#DD6B20", lw=1.5))
    ax.text(33, 34, "Mongoose ODM / Atomic File Sync", fontsize=7.5, fontfamily='Times New Roman', color="#DD6B20")

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'arch_diagram.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 2. DFD Level 0 Context Diagram
# -------------------------------------------------------------
def generate_dfd_level0():
    fig, ax = plt.subplots(figsize=(11, 7), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 2: Data Flow Diagram (DFD) Level 0 — Context Diagram", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    cp = Circle((50, 50), 16, ec="#1A365D", fc="#EDF2F7", lw=2)
    ax.add_patch(cp)
    ax.text(50, 53, "0.0", fontsize=11, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#2B6CB0')
    ax.text(50, 48, "Peshawari Chappal\nE-Commerce Core\nSystem", fontsize=9, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    entities = [
        ("CUSTOMER", (6, 55), 18, 14),
        ("SUPER ADMIN /\nMANAGER", (6, 20), 18, 14),
        ("MULTIMODAL AI\nGATEWAY (Gemini)", (76, 68), 18, 14),
        ("COURIER LOGISTICS\nSERVICE (TCS/Leopards)", (76, 38), 18, 14),
        ("PAYMENT GATEWAY\n(JazzCash/EasyPaisa)", (76, 8), 18, 14),
    ]

    for label, (x, y), w, h in entities:
        rect = Rectangle((x, y), w, h, ec="#2D3748", fc="#F7FAFC", lw=1.5)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, label, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#2D3748')

    # Data Flows
    ax.annotate('', xy=(34, 56), xytext=(24, 62), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
    ax.text(26, 64, "Foot Image, Custom 3D Specs, Order", fontsize=7.5, fontfamily='Times New Roman', color='#2B6CB0')

    ax.annotate('', xy=(24, 57), xytext=(34, 51), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
    ax.text(26, 47, "Calculated Size, Invoice, Order Tracking", fontsize=7.5, fontfamily='Times New Roman', color='#2B6CB0')

    ax.annotate('', xy=(37, 39), xytext=(24, 27), arrowprops=dict(arrowstyle="->", color="#2C7A7B", lw=1.2))
    ax.text(22, 33, "Product Upload, Capital Budget, Order Status", fontsize=7.5, fontfamily='Times New Roman', color='#2C7A7B')

    ax.annotate('', xy=(24, 23), xytext=(37, 35), arrowprops=dict(arrowstyle="->", color="#2C7A7B", lw=1.2))
    ax.text(23, 17, "KDM Analytics, Inventory Value, Sales Logs", fontsize=7.5, fontfamily='Times New Roman', color='#2C7A7B')

    ax.annotate('', xy=(76, 75), xytext=(63, 60), arrowprops=dict(arrowstyle="->", color="#805AD5", lw=1.2))
    ax.text(67, 72, "Product Photo Base64", fontsize=7.5, fontfamily='Times New Roman', color='#805AD5')

    ax.annotate('', xy=(64, 56), xytext=(76, 71), arrowprops=dict(arrowstyle="->", color="#805AD5", lw=1.2))
    ax.text(68, 61, "Title, Subtitle, Leather Color, Specs", fontsize=7.5, fontfamily='Times New Roman', color='#805AD5')

    ax.annotate('', xy=(76, 45), xytext=(66, 48), arrowprops=dict(arrowstyle="->", color="#C05621", lw=1.2))
    ax.text(67, 49.5, "Consignment Details", fontsize=7.5, fontfamily='Times New Roman', color='#C05621')

    ax.annotate('', xy=(66, 44), xytext=(76, 41), arrowprops=dict(arrowstyle="->", color="#C05621", lw=1.2))
    ax.text(68, 38, "Tracking ID & Delivery Status", fontsize=7.5, fontfamily='Times New Roman', color='#C05621')

    ax.annotate('', xy=(76, 18), xytext=(63, 38), arrowprops=dict(arrowstyle="->", color="#319795", lw=1.2))
    ax.text(68, 25, "Transaction Token", fontsize=7.5, fontfamily='Times New Roman', color='#319795')

    ax.annotate('', xy=(59, 36), xytext=(76, 14), arrowprops=dict(arrowstyle="->", color="#319795", lw=1.2))
    ax.text(69, 13, "Payment Settlement Verification", fontsize=7.5, fontfamily='Times New Roman', color='#319795')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'dfd_level0.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 3. DFD Level 1 Diagram
# -------------------------------------------------------------
def generate_dfd_level1():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 3: Data Flow Diagram (DFD) Level 1 — Core Process Decomposition", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    processes = [
        ("1.0", "Identity & Role-Based\nAccess Control", (8, 68), 22, 14),
        ("2.0", "Catalog & 3D Interactive\nCustomization", (38, 68), 24, 14),
        ("3.0", "AI Multimodal Sizing\n& Outfit Analysis", (70, 68), 24, 14),
        ("4.0", "Cart, Checkout &\nOrder Fulfillment", (20, 36), 26, 14),
        ("5.0", "Procurement Capital &\nFinancial Ledger", (60, 36), 26, 14),
    ]

    for num, name, (x, y), w, h in processes:
        p_box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", ec="#2B6CB0", fc="#EBF8FF", lw=1.5)
        ax.add_patch(p_box)
        ax.plot([x, x + w], [y + h - 4, y + h - 4], color="#2B6CB0", lw=1)
        ax.text(x + 3, y + h - 2.5, num, fontsize=8, fontweight='bold', fontfamily='Times New Roman', color='#2B6CB0')
        ax.text(x + w/2, y + (h-4)/2, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#1A202C')

    stores = [
        ("D1", "Products & Inventory", (8, 10), 22, 9),
        ("D2", "Orders & Consignments", (38, 10), 24, 9),
        ("D3", "Capital & Budget Logs", (70, 10), 24, 9),
    ]

    for code, name, (x, y), w, h in stores:
        ax.plot([x, x, x + w], [y + h, y, y], color="#4A5568", lw=1.5)
        ax.plot([x, x + w], [y + h, y + h], color="#4A5568", lw=1.5)
        ax.plot([x + 6, x + 6], [y, y + h], color="#4A5568", lw=1)
        ax.text(x + 3, y + h/2, code, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#4A5568')
        ax.text(x + 6 + (w-6)/2, y + h/2, name, fontsize=8, fontfamily='Times New Roman', ha='center', va='center', color='#1A202C')

    e1 = Rectangle((4, 88), 16, 6, ec="#2D3748", fc="#F7FAFC", lw=1.2)
    ax.add_patch(e1)
    ax.text(12, 91, "Super Admin", fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')

    e2 = Rectangle((42, 88), 16, 6, ec="#2D3748", fc="#F7FAFC", lw=1.2)
    ax.add_patch(e2)
    ax.text(50, 91, "Customer", fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')

    e3 = Rectangle((76, 88), 18, 6, ec="#2D3748", fc="#F7FAFC", lw=1.2)
    ax.add_patch(e3)
    ax.text(85, 91, "Gemini Vision AI", fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')

    ax.annotate('', xy=(12, 82), xytext=(12, 88), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1))
    ax.annotate('', xy=(46, 82), xytext=(46, 88), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1))
    ax.annotate('', xy=(76, 82), xytext=(58, 88), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1))

    ax.annotate('', xy=(20, 19), xytext=(42, 68), arrowprops=dict(arrowstyle="->", color="#319795", lw=1))
    ax.text(32, 45, "Read / Query Stock", fontsize=7, fontfamily='Times New Roman', color="#319795")

    ax.annotate('', xy=(44, 19), xytext=(35, 36), arrowprops=dict(arrowstyle="->", color="#319795", lw=1))
    ax.text(42, 28, "Save Order", fontsize=7, fontfamily='Times New Roman', color="#319795")

    ax.annotate('', xy=(78, 19), xytext=(74, 36), arrowprops=dict(arrowstyle="->", color="#319795", lw=1))
    ax.text(78, 28, "Capital Allocation Log", fontsize=7, fontfamily='Times New Roman', color="#319795")

    ax.annotate('', xy=(85, 88), xytext=(85, 82), arrowprops=dict(arrowstyle="<->", color="#805AD5", lw=1))

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'dfd_level1.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 4. DFD Level 2: AI Foot Sizing Subsystem
# -------------------------------------------------------------
def generate_dfd_level2_ai():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 4: Data Flow Diagram (DFD) Level 2 — AI Foot Sizing Subsystem", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    subprocesses = [
        ("3.1", "A4 Reference Sheet\nHomography Calibration", (8, 60), 24, 16),
        ("3.2", "Foot Contour & Heel-to-Toe\nKeypoint Extraction", (40, 60), 24, 16),
        ("3.3", "Metric MM Calculation &\nArch Width Estimation", (70, 60), 24, 16),
        ("3.4", "Pakistani / UK Size\nClassification (7 to 13)", (40, 20), 26, 16),
    ]

    for num, name, (x, y), w, h in subprocesses:
        p_box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", ec="#805AD5", fc="#FAF5FF", lw=1.5)
        ax.add_patch(p_box)
        ax.plot([x, x + w], [y + h - 4, y + h - 4], color="#805AD5", lw=1)
        ax.text(x + 3, y + h - 2.5, num, fontsize=8, fontweight='bold', fontfamily='Times New Roman', color='#805AD5')
        ax.text(x + w/2, y + (h-4)/2, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#1A202C')

    # Data Store: D4 Size Map
    ax.plot([70, 70, 94], [32, 22, 22], color="#4A5568", lw=1.5)
    ax.plot([70, 94], [32, 32], color="#4A5568", lw=1.5)
    ax.plot([76, 76], [22, 32], color="#4A5568", lw=1)
    ax.text(73, 27, "D4", fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#4A5568')
    ax.text(85, 27, "Size Chart Rules\n(245mm - 305mm)", fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#1A202C')

    # External Entity: Customer Camera / Upload
    e = Rectangle((8, 24), 22, 12, ec="#2D3748", fc="#F7FAFC", lw=1.2)
    ax.add_patch(e)
    ax.text(19, 30, "Customer Camera /\nImage Upload", fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')

    # Connectors
    ax.annotate('', xy=(19, 60), xytext=(19, 36), arrowprops=dict(arrowstyle="->", color="#805AD5", lw=1.2))
    ax.text(20, 48, "Raw Foot RGB Image", fontsize=7.5, fontfamily='Times New Roman')

    ax.annotate('', xy=(40, 68), xytext=(32, 68), arrowprops=dict(arrowstyle="->", color="#805AD5", lw=1.2))
    ax.text(36, 70.5, "Pixels / mm Scale", fontsize=7, fontfamily='Times New Roman', ha='center')

    ax.annotate('', xy=(70, 68), xytext=(64, 68), arrowprops=dict(arrowstyle="->", color="#805AD5", lw=1.2))
    ax.text(67, 70.5, "Extreme Keypoints", fontsize=7, fontfamily='Times New Roman', ha='center')

    ax.annotate('', xy=(53, 36), xytext=(82, 60), arrowprops=dict(arrowstyle="->", color="#805AD5", lw=1.2))
    ax.text(70, 46, "Length (mm) & Width (mm)", fontsize=7.5, fontfamily='Times New Roman')

    ax.annotate('', xy=(66, 27), xytext=(70, 27), arrowprops=dict(arrowstyle="<-", color="#4A5568", lw=1.2))

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'dfd_level2_ai.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 5. Use Case Diagram
# -------------------------------------------------------------
def generate_usecase_diagram():
    fig, ax = plt.subplots(figsize=(12, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 5: Complete UML Use Case Diagram", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    # System Boundary Box
    sb = Rectangle((26, 4), 50, 88, ec="#2B6CB0", fc="#FAFAFA", lw=1.8, linestyle="--")
    ax.add_patch(sb)
    ax.text(51, 89, "Peshawari Chappal Platform Boundary", fontsize=9, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#2B6CB0')

    # Actors
    ax.text(12, 60, "[Actor]\nCustomer", fontsize=10, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#2B6CB0')
    ax.text(88, 65, "[Actor]\nSuper Administrator", fontsize=10, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#2C7A7B')
    ax.text(88, 30, "[Actor]\nStore Manager", fontsize=10, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#C05621')

    # Use Cases (Ovals)
    usecases = [
        ("UC-01: Browse Catalog & Filter Sizes (7-13)", (51, 82), 38, 6),
        ("UC-02: 3D Real-Time Mesh Customization", (51, 74), 38, 6),
        ("UC-03: AI Multimodal Foot Sizing (A4 Calibration)", (51, 66), 42, 6),
        ("UC-04: Virtual Outfit Color Matcher", (51, 58), 38, 6),
        ("UC-05: Place Order via COD / Online Wallet", (51, 50), 38, 6),
        ("UC-06: Real-Time Consignment Tracking", (51, 42), 38, 6),
        ("UC-07: Multimodal Product AI Auto-Fill", (51, 34), 38, 6),
        ("UC-08: Manage Supplier Procurement Capital", (51, 26), 40, 6),
        ("UC-09: Order Fulfillment & Courier Dispatch", (51, 18), 38, 6),
        ("UC-10: Manager Account Role Delegation", (51, 10), 38, 6),
    ]

    for name, (x, y), w, h in usecases:
        ellipse = patches.Ellipse((x, y), w, h, ec="#2C5282", fc="#FFFFFF", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(x, y, name, fontsize=7.5, fontfamily='Times New Roman', ha='center', va='center', color='#1A202C')

    for i in range(6):
        uc_y = 82 - (i * 8)
        ax.plot([18, 30], [60, uc_y], color="#4A5568", lw=1.1)

    for i in range(6, 10):
        uc_y = 82 - (i * 8)
        ax.plot([82, 70], [65, uc_y], color="#4A5568", lw=1.1)

    ax.plot([82, 70], [30, 18], color="#4A5568", lw=1.1)
    ax.plot([82, 70], [30, 34], color="#4A5568", lw=1.1)

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'usecase_diagram.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 6. Entity-Relationship Diagram (ERD)
# -------------------------------------------------------------
def generate_erd_diagram():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 6: Entity-Relationship Diagram (ERD) with Field Constraints", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    def draw_entity(name, fields, x, y, w, h):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2", ec="#2B6CB0", fc="#FFFFFF", lw=1.5)
        ax.add_patch(box)
        header = FancyBboxPatch((x, y + h - 4.5), w, 4.5, boxstyle="round,pad=0.2", ec="#2B6CB0", fc="#2B6CB0", lw=1)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - 2.2, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center', color='#FFFFFF')
        
        for idx, (f_name, f_type) in enumerate(fields):
            curr_y = y + h - 7 - (idx * 2.8)
            ax.text(x + 1, curr_y, f_name, fontsize=7, fontfamily='Times New Roman', color='#1A202C')
            ax.text(x + w - 1, curr_y, f_type, fontsize=6.5, fontfamily='Times New Roman', ha='right', color='#718096')

    e_product = [
        ("id (PK)", "String [Unique]"),
        ("name", "String"),
        ("slug", "String [Unique]"),
        ("price", "Number"),
        ("costPrice", "Number"),
        ("category (FK)", "String"),
        ("availableSizes", "Array[7..13]"),
        ("stockCount", "Number"),
    ]
    draw_entity("PRODUCT", e_product, 6, 52, 26, 38)

    e_category = [
        ("id (PK)", "String [Unique]"),
        ("name", "String"),
        ("slug", "String [Unique]"),
        ("disabled", "Boolean"),
    ]
    draw_entity("CATEGORY", e_category, 6, 12, 26, 26)

    e_order = [
        ("id (PK)", "String [Unique]"),
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
        ("id (PK)", "String"),
        ("orderId (FK)", "String"),
        ("productId (FK)", "String"),
        ("selectedSize", "Number (7-13)"),
        ("selectedColor", "String"),
        ("quantity", "Number"),
        ("unitPrice", "Number"),
    ]
    draw_entity("ORDER_ITEM", e_order_item, 38, 12, 26, 32)

    e_capital = [
        ("id (PK)", "String"),
        ("type", "String (add/rem/set)"),
        ("amount", "Number"),
        ("previousBudget", "Number"),
        ("newBudget", "Number"),
        ("note", "String"),
        ("date", "String"),
    ]
    draw_entity("SUPPLIER_BUDGET_LOG", e_capital, 70, 52, 26, 38)

    e_admin = [
        ("id (PK)", "String"),
        ("username", "String [Unique]"),
        ("passwordHash", "String"),
        ("role", "superadmin | manager"),
    ]
    draw_entity("ADMIN_USER", e_admin, 70, 16, 26, 26)

    ax.annotate('', xy=(19, 52), xytext=(19, 38), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
    ax.text(21, 45, "1 : N", fontsize=8, fontweight='bold', fontfamily='Times New Roman', color="#2B6CB0")

    ax.annotate('', xy=(51, 44), xytext=(51, 52), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
    ax.text(53, 47, "1 : N", fontsize=8, fontweight='bold', fontfamily='Times New Roman', color="#2B6CB0")

    ax.annotate('', xy=(38, 25), xytext=(32, 54), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
    ax.text(35, 40, "1 : N", fontsize=8, fontweight='bold', fontfamily='Times New Roman', color="#2B6CB0")

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'erd_diagram.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 7. Sequence Diagram: AI Product Auto-Fill
# -------------------------------------------------------------
def generate_seq_diagram_ai():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 7: UML Sequence Diagram — Multimodal AI Product Auto-Fill Cascade", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    lifelines = [
        ("Super Admin", 10),
        ("React Admin Tab", 30),
        ("Express Gateway", 50),
        ("Gemini 3.6 API", 70),
        ("Experiential Labs", 88),
    ]

    for name, x in lifelines:
        box = FancyBboxPatch((x - 8, 86), 16, 6, boxstyle="round,pad=0.3", ec="#2B6CB0", fc="#EBF8FF", lw=1.2)
        ax.add_patch(box)
        ax.text(x, 89, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')
        ax.plot([x, x], [12, 86], color="#CBD5E0", linestyle="--", lw=1)

    steps = [
        ("1. Upload Product Image & Click 'Auto-Fill'", 10, 30, 80, "->"),
        ("2. POST /api/admin/ai-analyze-product (image base64)", 30, 50, 74, "->"),
        ("3. Call gemini-3.6-flash:generateContent", 50, 70, 68, "->"),
        ("4. [If Rate Limit 429] Failover Notice", 70, 50, 60, "-->"),
        ("5. Forward to Backup Gateway (xpl_ key)", 50, 88, 52, "->"),
        ("6. Return Structured JSON (Title, Leather Tone, Specs)", 88, 50, 44, "-->"),
        ("7. Strip Price Fields (Enforce Zero Pricing Leak)", 50, 50, 36, "self"),
        ("8. Return JSON Response to Client", 50, 30, 28, "-->"),
        ("9. Populate Form Fields & Hex Color Swatch", 30, 10, 20, "-->"),
    ]

    for label, x1, x2, y, style in steps:
        if style == "self":
            ax.annotate('', xy=(x1 + 3, y - 2), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#C53030", lw=1.2))
            ax.text(x1 + 4, y - 1, label, fontsize=7.5, fontfamily='Times New Roman', color='#C53030')
        elif style == "->":
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#2B6CB0')
        else:
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", linestyle="--", color="#4A5568", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#4A5568')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'seq_diagram_ai.png'), dpi=300)
    plt.close()

# -------------------------------------------------------------
# 8. Sequence Diagram: Order Placement & Inventory Deduction
# -------------------------------------------------------------
def generate_seq_diagram_order():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 96, "Figure 8: UML Sequence Diagram — Customer Order Checkout & Real-Time Fulfillment Flow", 
            fontsize=13, fontweight='bold', fontfamily='Times New Roman', ha='center', color='#1A202C')

    lifelines = [
        ("Customer", 12),
        ("Cart / Checkout UI", 32),
        ("Express Backend", 54),
        ("Dual-Tier Storage", 74),
        ("Courier Dispatch", 90),
    ]

    for name, x in lifelines:
        box = FancyBboxPatch((x - 8, 86), 16, 6, boxstyle="round,pad=0.3", ec="#2C7A7B", fc="#E6FFFA", lw=1.2)
        ax.add_patch(box)
        ax.text(x, 89, name, fontsize=8, fontweight='bold', fontfamily='Times New Roman', ha='center', va='center')
        ax.plot([x, x], [12, 86], color="#CBD5E0", linestyle="--", lw=1)

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
            ax.annotate('', xy=(x1 + 3, y - 2), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#2C7A7B", lw=1.2))
            ax.text(x1 + 4, y - 1, label, fontsize=7.5, fontfamily='Times New Roman', color='#2C7A7B')
        elif style == "->":
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#2B6CB0", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#2B6CB0')
        else:
            ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", linestyle="--", color="#4A5568", lw=1.2))
            ax.text((x1 + x2)/2, y + 1.5, label, fontsize=7.5, fontfamily='Times New Roman', ha='center', color='#4A5568')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'seq_diagram_order.png'), dpi=300)
    plt.close()

if __name__ == '__main__':
    generate_architecture_diagram()
    generate_dfd_level0()
    generate_dfd_level1()
    generate_dfd_level2_ai()
    generate_usecase_diagram()
    generate_erd_diagram()
    generate_seq_diagram_ai()
    generate_seq_diagram_order()
    print("All 8 academic diagrams generated successfully in docs_assets/")
