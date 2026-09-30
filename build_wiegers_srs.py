import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

DOCS_ASSETS = os.path.join(os.getcwd(), 'docs_assets')
DOCX_OUT = os.path.join(os.getcwd(), 'Peshawari_Chappal_FYP_SRS.docx')

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_chapter_heading(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(16)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_main_heading(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_sub_heading(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_body_p(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.5
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(12)
        r_pre.font.bold = True
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    return p

def add_bullet_point(doc, bold_title, text):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.5
    r_title = p.add_run(bold_title)
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(12)
    r_title.font.bold = True
    r_text = p.add_run(text)
    r_text.font.name = 'Times New Roman'
    r_text.font.size = Pt(12)
    return p

def add_figure(doc, img_filename, caption_text, width_inches=6.2):
    img_path = os.path.join(DOCS_ASSETS, img_filename)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(2)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(width_inches))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(10)
        p_cap.paragraph_format.line_spacing = 1.5
        run_cap = p_cap.add_run(caption_text)
        run_cap.font.name = 'Times New Roman'
        run_cap.font.size = Pt(10.5)
        run_cap.font.bold = True
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(0, 0, 0)

def format_table_cells(table, col_widths, headers, rows_data):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.add_row().cells if len(table.rows) == 0 else table.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_background(hdr_cells[i], "E2E8F0")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)

    for r_idx, row in enumerate(rows_data):
        row_cells = table.add_row().cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(10.5)
                r.font.color.rgb = RGBColor(0, 0, 0)

    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = Inches(w)

def generate_wiegers_srs():
    doc = docx.Document()

    # Configure A4 Page Size (210mm x 297mm) and 1.0-inch margins
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True
        
        # Header / Footer
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.text = "Software Requirements Specification for Peshawari Chappal E-Commerce Platform"
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_hdr.runs[0].font.name = 'Times New Roman'
        p_hdr.runs[0].font.size = Pt(9)
        p_hdr.runs[0].font.italic = True
        p_hdr.runs[0].font.color.rgb = RGBColor(0, 0, 0)

    # -------------------------------------------------------------
    # COVER PAGE (Karl E. Wiegers Standard Template Format)
    # -------------------------------------------------------------
    p_top_bar = doc.add_paragraph()
    p_top_bar.paragraph_format.space_before = Pt(20)
    p_top_bar.paragraph_format.space_after = Pt(30)
    r_bar = p_top_bar.add_run("_________________________________________________________________________________")
    r_bar.font.name = 'Times New Roman'
    r_bar.font.size = Pt(14)
    r_bar.font.bold = True

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_title.paragraph_format.space_before = Pt(30)
    p_title.paragraph_format.space_after = Pt(10)
    r_title = p_title.add_run("Software Requirements\nSpecification")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(28)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0)

    p_for = doc.add_paragraph()
    p_for.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_for.paragraph_format.space_before = Pt(10)
    p_for.paragraph_format.space_after = Pt(20)
    r_for = p_for.add_run("for\n")
    r_for.font.name = 'Times New Roman'
    r_for.font.size = Pt(16)
    r_for.font.bold = True
    r_proj = p_for.add_run("Peshawari Chappal E-Commerce Platform with AI Multimodal Foot Sizing, Virtual Outfit Matcher, and Dual-Tier Capital Ledger Architecture")
    r_proj.font.name = 'Times New Roman'
    r_proj.font.size = Pt(18)
    r_proj.font.bold = True

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(40)
    p_meta.paragraph_format.space_after = Pt(40)
    p_meta.paragraph_format.line_spacing = 1.5

    r_v = p_meta.add_run("Version 1.0 approved\n\nPrepared by Project Development Team\n\nDepartment of Computer Science & Software Engineering\n\nSeptember 2026")
    r_v.font.name = 'Times New Roman'
    r_v.font.size = Pt(12)
    r_v.font.bold = True

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_foot.paragraph_format.space_before = Pt(60)
    p_foot.paragraph_format.space_after = Pt(0)
    r_foot = p_foot.add_run("Copyright © 1999 by Karl E. Wiegers. Permission is granted to use, modify, and distribute this document.")
    r_foot.font.name = 'Times New Roman'
    r_foot.font.size = Pt(9)
    r_foot.font.italic = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # PAGE II: TABLE OF CONTENTS & REVISION HISTORY
    # -------------------------------------------------------------
    add_chapter_heading(doc, "Table of Contents")
    toc_items = [
        ("Table of Contents", "ii"),
        ("Revision History", "ii"),
        ("1. Introduction", "1"),
        ("   1.1 Purpose", "1"),
        ("   1.2 Document Conventions", "1"),
        ("   1.3 Intended Audience and Reading Suggestions", "1"),
        ("   1.4 Product Scope", "1"),
        ("   1.5 References", "1"),
        ("2. Overall Description", "2"),
        ("   2.1 Product Perspective", "2"),
        ("   2.2 Product Functions", "2"),
        ("   2.3 User Classes and Characteristics", "2"),
        ("   2.4 Operating Environment", "2"),
        ("   2.5 Design and Implementation Constraints", "2"),
        ("   2.6 User Documentation", "3"),
        ("   2.7 Assumptions and Dependencies", "3"),
        ("3. External Interface Requirements", "3"),
        ("   3.1 User Interfaces", "3"),
        ("   3.2 Hardware Interfaces", "3"),
        ("   3.3 Software Interfaces", "3"),
        ("   3.4 Communications Interfaces", "3"),
        ("4. System Features", "4"),
        ("   4.1 AI Multimodal Foot Size Measurement (A4 Calibration)", "4"),
        ("   4.2 Virtual Outfit Color Palette Matcher", "5"),
        ("   4.3 Product Catalog, Categorization & Sizing (7 to 13)", "5"),
        ("   4.4 Shopping Bag, Instant Checkout & Real-Time Consignment Tracking", "6"),
        ("   4.5 Multimodal Product AI Auto-Fill & Attribute Extraction", "6"),
        ("   4.6 Supplier Procurement Capital & Packaging Investment Ledger", "7"),
        ("   4.7 Role-Based Administrative Control & Multi-Manager Delegation", "7"),
        ("5. Other Nonfunctional Requirements", "8"),
        ("   5.1 Performance Requirements", "8"),
        ("   5.2 Safety Requirements", "8"),
        ("   5.3 Security Requirements", "8"),
        ("   5.4 Software Quality Attributes", "9"),
        ("   5.5 Business Rules", "9"),
        ("6. Other Requirements", "9"),
        ("Appendix A: Glossary", "10"),
        ("Appendix B: Analysis Models (Architecture, DFDs, ERD, Use Cases, Sequence)", "11"),
        ("Appendix C: To Be Determined List", "15"),
    ]
    for title, page in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        r_t = p.add_run(title)
        r_t.font.name = 'Times New Roman'
        r_t.font.size = Pt(11)
        if title.startswith("Table") or title.startswith("Revision") or title.startswith("1.") or title.startswith("2.") or title.startswith("3.") or title.startswith("4.") or title.startswith("5.") or title.startswith("6.") or title.startswith("Appendix"):
            r_t.font.bold = True
        r_dots = p.add_run(" " + "." * (76 - len(title) * 2) + " ")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(10)
        r_dots.font.color.rgb = RGBColor(180, 180, 180)
        r_p = p.add_run(page)
        r_p.font.name = 'Times New Roman'
        r_p.font.size = Pt(11)
        r_p.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    add_main_heading(doc, "Revision History")
    rev_table = doc.add_table(rows=0, cols=4)
    rev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rev_headers = ["Name", "Date", "Reason For Changes", "Version"]
    rev_rows = [
        ["Initial Draft", "15-Aug-2026", "Initial requirements elicitation and domain analysis.", "0.1"],
        ["Architecture Rev", "01-Sep-2026", "Incorporated dual-tier database architecture and AI auto-fill cascade.", "0.8"],
        ["Sizing Scope Rev", "20-Sep-2026", "Strictly constrained sizes to Pakistani/UK 7-13; removed 3D customizer.", "0.9"],
        ["Official Release", "24-Sep-2026", "Approved final baseline compliant with Karl E. Wiegers template.", "1.0 approved"],
    ]
    format_table_cells(rev_table, [1.4, 1.3, 2.7, 1.0], rev_headers, rev_rows)

    doc.add_page_break()

    # -------------------------------------------------------------
    # 1. INTRODUCTION
    # -------------------------------------------------------------
    add_chapter_heading(doc, "1. Introduction")

    add_main_heading(doc, "1.1 Purpose")
    add_body_p(doc, "This Software Requirements Specification (SRS) document provides a formal, comprehensive specification for the Peshawari Chappal E-Commerce Platform with AI Multimodal Foot Sizing, Virtual Outfit Matcher, and Dual-Tier Capital Ledger Architecture (Version 1.0 approved). It delineates all functional capabilities, external interfaces, performance thresholds, security constraints, and behavioral analysis models. This document covers the entirety of the unified client web application, core backend services, computer vision microservices, and database persistence infrastructure.")

    add_main_heading(doc, "1.2 Document Conventions")
    add_body_p(doc, "This document strictly adheres to the formatting guidelines established by the department: Times New Roman typeface, 12 pt body text, 16 pt bold chapter headings, 14 pt bold main headings, 12 pt bold subheadings, 1.5 line spacing, justified text alignment, and standard A4 paper dimensions with 1.0-inch margins.")
    add_body_p(doc, "Every individual functional requirement is tagged with a unique identifier in the format [REQ-x]. Requirement priority ratings are assigned as High, Medium, or Low based on business necessity, customer utility, and technical dependencies. High-priority requirements represent core mission-critical services required for minimal viable operation.")

    add_main_heading(doc, "1.3 Intended Audience and Reading Suggestions")
    add_body_p(doc, "This specification is intended for diverse stakeholder groups:")
    add_bullet_point(doc, "Software Engineering & Development Team: ", "Refer primarily to Section 3 (External Interfaces), Section 4 (System Features), Section 6 (Database Specifications), and Appendix B (Analysis Models) for implementation baselines.")
    add_bullet_point(doc, "Academic Supervisors & Project Evaluators: ", "Review Section 1 (Introduction), Section 2 (Overall Description), Section 4 (Features), and Section 5 (Nonfunctional Requirements) to evaluate academic rigor and scope adherence.")
    add_bullet_point(doc, "Quality Assurance & Testing Specialists: ", "Utilize Section 4 (REQ statements), Section 5 (Nonfunctional thresholds), and Appendix B (Sequence Diagrams) to design comprehensive test matrices.")
    add_bullet_point(doc, "Business Stakeholders & Store Administrators: ", "Focus on Section 2 (Functions & Operating Constraints), Section 4.5 (AI Auto-Fill), and Section 4.6 (Procurement Capital Ledger).")

    add_main_heading(doc, "1.4 Product Scope")
    add_body_p(doc, "The Peshawari Chappal Platform digitalizes the rich heritage of handcrafted traditional footwear from Khyber Pakhtunkhwa, Pakistan. The software provides an end-to-end commercial portal enabling customers to explore authentic artisan collections (Kaptaan, Zalmi, Norzi, Quetta, Charsadda, Zardari), accurately measure their foot dimensions using an A4 paper sheet as a computer vision reference, match shoe leather shades with ethnic attire, purchase chappals via Cash on Delivery (COD), and track courier deliveries through real-time step milestones.")
    add_body_p(doc, "For enterprise administration, the platform incorporates an automated Multimodal AI Product Auto-Fill cascade that extracts cultural titles, subtitles, materials, and leather colors from photos without manual copywriting, alongside an isolated Supplier Procurement Capital Ledger that cleanly segregates artisan wholesale manufacturing capital from customer sales cash flows.")

    add_main_heading(doc, "1.5 References")
    add_body_p(doc, "1. IEEE Computer Society, \"IEEE Recommended Practice for Software Requirements Specifications,\" IEEE Std 830-1998, 1998.\n2. ISO/IEC/IEEE, \"Systems and software engineering — Life cycle processes — Requirements engineering,\" ISO/IEC/IEEE 29148:2018, 2018.\n3. K. E. Wiegers and J. Beatty, Software Requirements, 3rd ed. Redmond, WA: Microsoft Press, 2013.\n4. R. Hartley and A. Zisserman, Multiple View Geometry in Computer Vision, 2nd ed. Cambridge: Cambridge University Press, 2004.\n5. D. Flanagan, JavaScript: The Definitive Guide, 7th ed. Sebastopol, CA: O'Reilly Media, 2020.\n6. K. Chodorow, MongoDB: The Definitive Guide: Powerful and Scalable Data Storage, 3rd ed. Sebastopol, CA: O'Reilly Media, 2023.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # 2. OVERALL DESCRIPTION
    # -------------------------------------------------------------
    add_chapter_heading(doc, "2. Overall Description")

    add_main_heading(doc, "2.1 Product Perspective")
    add_body_p(doc, "The platform is a self-contained, greenfield e-commerce web application engineered to replace manual artisan workshops and fragmented social-media selling with a robust, enterprise-grade digital portal. It interfaces with external client cameras, third-party courier dispatch tracking, remote multimodal AI vision inference gateways, and cloud database clusters. The high-level structural topology is modeled in Figure B-1 (Appendix B).")

    add_main_heading(doc, "2.2 Product Functions")
    add_body_p(doc, "The major functional capabilities provided by the platform include:")
    add_bullet_point(doc, "Artisanal Catalog & Dynamic Filtering: ", "Browsing products by authentic categories with multi-parameter filtering strictly bounded to Pakistani/UK sizes 7 through 13.")
    add_bullet_point(doc, "AI Multimodal Foot Sizing: ", "Capturing foot photos against an A4 calibration sheet to compute metric millimeter foot length and recommend the optimal shoe size.")
    add_bullet_point(doc, "Virtual Outfit Color Harmony: ", "Analyzing uploaded ethnic wear photographs to suggest matching leather color swatches.")
    add_bullet_point(doc, "Cart & Cash on Delivery (COD) Checkout: ", "Managing shopping bags, applying shipping thresholds, and placing orders with automatic invoice generation.")
    add_bullet_point(doc, "Real-Time Consignment Tracking: ", "Providing customers with a live visual progression stepper (Placed -> Confirmed -> Crafting -> Shipped -> Delivered).")
    add_bullet_point(doc, "Multimodal AI Auto-Fill Cascade: ", "Analyzing uploaded footwear images to extract culturally authentic titles, subtitles, leather shades, and features with zero pricing leakage.")
    add_bullet_point(doc, "Supplier Procurement Capital Ledger: ", "Managing dedicated artisan stock capital with add, deduct, fixed set, and inventory auto-sync actions.")
    add_bullet_point(doc, "Role-Based Administrative Delegation: ", "Enforcing secure multi-admin roles (Super Administrator and Store Manager) with signed cryptographic session tokens.")

    add_main_heading(doc, "2.3 User Classes and Characteristics")
    u_table = doc.add_table(rows=0, cols=3)
    u_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    u_headers = ["User Class", "Privilege Level", "Characteristics & Responsibilities"]
    u_rows = [
        ["Online Customer", "Public (Guest/Customer)", "Informal consumers browsing catalog, taking foot measurement photos, matching attire, and placing orders."],
        ["Super Administrator", "Full Unrestricted Admin", "Executive owners managing products, categories, financial KDM ledgers, hero branding, and staff delegation."],
        ["Store Manager", "Operational Admin", "Staff members updating order shipment stages, reviewing customer tickets, and checking low stock levels."],
    ]
    format_table_cells(u_table, [1.8, 1.8, 2.8], u_headers, u_rows)

    add_main_heading(doc, "2.4 Operating Environment")
    add_body_p(doc, "The software operates across the following execution environments:")
    add_bullet_point(doc, "Client Workstations & Mobile Devices: ", "Modern web browsers (Google Chrome 110+, Mozilla Firefox 115+, Apple Safari 16+, Microsoft Edge) supporting HTML5 Canvas, ECMAScript 2022+, and MediaDevices API.")
    add_bullet_point(doc, "Backend Server Infrastructure: ", "Node.js runtime environment (v20.x or v24.x LTS) hosted on Windows Server / Linux Ubuntu 22.04 LTS with Express.js application framework.")
    add_bullet_point(doc, "Database Persistence Layer: ", "MongoDB Atlas cloud cluster (v7.0+) communicating via Mongoose ODM v8.5+, supplemented with mirrored local JSON storage.")
    add_bullet_point(doc, "AI Inference Environment: ", "Remote multimodal REST API gateways accessed over secure HTTPS connections.")

    add_main_heading(doc, "2.5 Design and Implementation Constraints")
    add_body_p(doc, "1. Strict Sizing Range Constraint: In accordance with Pakistani and British traditional shoe lasting practices, all product inventory, size filters, cart selections, and measurement algorithms must operate strictly on whole numbers [7, 8, 9, 10, 11, 12, 13]. European (39-45) and half-size fractions are prohibited.")
    add_body_p(doc, "2. Strict Zero Pricing Leakage: The multimodal AI catalog service must NEVER generate, suggest, or overwrite financial pricing attributes (`price`, `costPrice`, `originalPrice`). Financial pricing is strictly reserved for manual admin input.")
    add_body_p(doc, "3. Dual-Tier Persistence Resilience: The system must guarantee operational continuity if the remote MongoDB Atlas cluster is offline or network-throttled by seamlessly persisting to local disk storage (`products.json`, `settings.json`) and performing automatic upsert synchronization upon reconnection.")

    add_main_heading(doc, "2.6 User Documentation")
    add_body_p(doc, "User documentation delivered with the system includes: (1) Online Help modal on the Foot Size Finder detailing A4 paper placement and camera angle guidelines; (2) Store Administrator Operations Manual covering product uploads, capital ledger accounting, and order dispatch workflows; and (3) RESTful API Documentation detailing endpoint routes, request schemas, and authentication headers.")

    add_main_heading(doc, "2.7 Assumptions and Dependencies")
    add_body_p(doc, "1. Assumption: Users have access to a standard white A4 sheet of paper (210 mm x 297 mm) when performing camera-based foot measurement.")
    add_body_p(doc, "2. Dependency: Network connectivity is required for client-server communication, order dispatch tracking, and cloud AI auto-fill requests.")
    add_body_p(doc, "3. Dependency: The client device must grant explicit camera permissions to enable live video capture on the sizing page.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # 3. EXTERNAL INTERFACE REQUIREMENTS
    # -------------------------------------------------------------
    add_chapter_heading(doc, "3. External Interface Requirements")

    add_main_heading(doc, "3.1 User Interfaces")
    add_body_p(doc, "The User Interface is built with React 19, TypeScript, and TailwindCSS. It provides a cohesive, premium design system featuring:")
    add_bullet_point(doc, "Storefront Layout: ", "Responsive top navigation bar with dynamic cart item badge, brand logo, and direct category links; prominent hero section featuring artisan footwear photography; product grid with responsive cards displaying title, subtitle, leather color, and formatted PKR price.")
    add_bullet_point(doc, "Admin Portal: ", "Secure glassmorphic dashboard with dedicated tabs: Dashboard KPIs, Products Management, Orders Fulfillment, Customers Directory, Categories & Catalog, Store Branding & Hero Media, Investments & Capital Ledger, Store Settings, and Manager Role Delegation.")
    add_bullet_point(doc, "Consistency Standards: ", "Primary interactive buttons use a unified blue aesthetic (`bg-blue-600 hover:bg-blue-700 active:scale-95`), clean typography in Times New Roman and Inter, with zero visual clutter.")

    add_main_heading(doc, "3.2 Hardware Interfaces")
    add_body_p(doc, "The platform interfaces with client camera hardware via standard W3C Media Capture streams (`navigator.mediaDevices.getUserMedia`). Video frames are captured at a minimum resolution of 1280x720 pixels to ensure sufficient edge definition for paper corner detection and foot contour segmentation.")

    add_main_heading(doc, "3.3 Software Interfaces")
    add_bullet_point(doc, "Database Management System: ", "MongoDB Atlas cloud cluster accessed via Mongoose ODM v8.5.0. Data models enforce strict typing, indexing on unique slugs, and timestamp auditing.")
    add_bullet_point(doc, "Multimodal AI Inference Service: ", "External cloud AI gateway accessed over HTTPS POST requests transmitting Base64 image payloads and structured JSON response schemas.")
    add_bullet_point(doc, "Operating System Storage: ", "Node.js standard `fs` and `path` modules interfacing with the host filesystem to read/write local mirror JSON files and multipart uploaded media.")

    add_main_heading(doc, "3.4 Communications Interfaces")
    add_body_p(doc, "All network communications between the client Single-Page Application and the backend REST API utilize HTTPS/TLS 1.3 protocol encryption over standard TCP port 443 (or HTTP port 5000 in local development). All request and response bodies use UTF-8 encoded `application/json` payloads. Cross-Origin Resource Sharing (CORS) headers are configured to permit universal local area network and cloud domain requests.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # 4. SYSTEM FEATURES
    # -------------------------------------------------------------
    add_chapter_heading(doc, "4. System Features")

    # 4.1 Foot Sizing
    add_main_heading(doc, "4.1 AI Multimodal Foot Size Measurement (A4 Calibration)")
    add_sub_heading(doc, "4.1.1 Description and Priority")
    add_body_p(doc, "Enables customers to accurately measure their foot dimensions by capturing or uploading a photograph of their bare foot positioned flat upon a standard white A4 reference paper sheet. Priority: High.")
    add_sub_heading(doc, "4.1.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. User opens Foot Size Finder page and clicks 'Start Live Camera' or 'Upload Photo'.\n2. User positions foot on A4 paper and captures image.\n3. System detects A4 paper corners, rectifies perspective distortion via homography, and computes the pixel-to-millimeter ratio.\n4. System segments foot contour, identifies extreme heel-to-toe points, and calculates foot length in millimeters.\n5. System maps millimeter length to standard Pakistani/UK shoe sizes (7 to 13) and renders recommended size card.\n6. User clicks 'Filter Catalog' to immediately view in-stock chappals in their calculated size.")
    add_sub_heading(doc, "4.1.3 Functional Requirements")
    add_bullet_point(doc, "REQ-1: ", "System shall access client camera via HTML5 MediaDevices API with user permission.")
    add_bullet_point(doc, "REQ-2: ", "System shall detect 4 corners of standard A4 reference sheet (210mm x 297mm) within the image.")
    add_bullet_point(doc, "REQ-3: ", "System shall calculate metric foot length in millimeters with an accuracy tolerance of ±2.5mm.")
    add_bullet_point(doc, "REQ-4: ", "System shall classify foot length into standard whole sizes strictly from 7 to 13.")
    add_bullet_point(doc, "REQ-5: ", "System shall provide manual millimeter slider adjustment if camera capture lighting is suboptimal.")

    # 4.2 Outfit Matcher
    add_main_heading(doc, "4.2 Virtual Outfit Color Palette Matcher")
    add_sub_heading(doc, "4.2.1 Description and Priority")
    add_body_p(doc, "Allows customers to upload a photo of their traditional attire (Shalwar Kameez, Kurta, Waistcoat) to receive algorithmic leather color pairing recommendations. Priority: Medium.")
    add_sub_heading(doc, "4.2.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. User uploads attire photograph on the Outfit Matcher interface.\n2. System performs k-means color quantization on the garment region to extract the dominant hex color.\n3. System computes color harmony contrasts and ranks matching chappal shades (Saddle Tan, Espresso, Oxblood, Mustard Camel, Midnight Jet Black).\n4. System displays matched chappal products matching the recommended leather tone.")
    add_sub_heading(doc, "4.2.3 Functional Requirements")
    add_bullet_point(doc, "REQ-6: ", "System shall accept JPEG, PNG, and WebP outfit image uploads up to 15MB.")
    add_bullet_point(doc, "REQ-7: ", "System shall extract primary hue and recommend complementary artisanal leather tones.")

    # 4.3 Catalog
    add_main_heading(doc, "4.3 Product Catalog, Categorization & Sizing (7 to 13)")
    add_sub_heading(doc, "4.3.1 Description and Priority")
    add_body_p(doc, "Provides the customer catalog browsing, text search, category tabs, and size filtering. Priority: High.")
    add_sub_heading(doc, "4.3.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. User navigates to Catalog page.\n2. System queries live products from dual-tier persistence layer.\n3. User selects category (e.g. Zalmi, Kaptaan) or clicks a size filter (e.g. 9 or 10).\n4. System instantaneously filters and renders matching product cards with price in PKR.")
    add_sub_heading(doc, "4.3.3 Functional Requirements")
    add_bullet_point(doc, "REQ-8: ", "System shall list all active products with image, title, subtitle, category, and formatted PKR price.")
    add_bullet_point(doc, "REQ-9: ", "System shall restrict available size filtering strictly to whole numbers [7, 8, 9, 10, 11, 12, 13].")
    add_bullet_point(doc, "REQ-10: ", "System shall hide products belonging to categories that have been disabled by admin.")

    # 4.4 Checkout & Tracking
    add_main_heading(doc, "4.4 Shopping Bag, Instant Checkout & Real-Time Consignment Tracking")
    add_sub_heading(doc, "4.4.1 Description and Priority")
    add_body_p(doc, "Manages shopping bag state, processes Cash on Delivery (COD) orders, and renders consignment tracking timelines. Priority: High.")
    add_sub_heading(doc, "4.4.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. User selects shoe size (7-13) and color on product card, then clicks 'Buy Now'.\n2. System populates cart and redirects directly to Checkout page.\n3. User inputs recipient name, contact phone, street address, city, and shipping method.\n4. User clicks 'Confirm Cash on Delivery Order'.\n5. System validates stock, persists order, generates unique tracking number (PSH-YYYY-XXXX), and displays live tracking stepper.")
    add_sub_heading(doc, "4.4.3 Functional Requirements")
    add_bullet_point(doc, "REQ-11: ", "System shall support direct 'Buy Now' instant checkout bypassing multi-step cart navigation.")
    add_bullet_point(doc, "REQ-12: ", "System shall calculate free shipping thresholds dynamically based on admin store settings.")
    add_bullet_point(doc, "REQ-13: ", "System shall decrement product inventory stock atomically upon confirmed order creation.")
    add_bullet_point(doc, "REQ-14: ", "System shall render a 5-step milestone tracking stepper with live timestamp updates.")

    # 4.5 AI Auto-Fill
    add_main_heading(doc, "4.5 Multimodal Product AI Auto-Fill & Attribute Extraction")
    add_sub_heading(doc, "4.5.1 Description and Priority")
    add_body_p(doc, "Automates product cataloging by analyzing product photos through a multi-tier vision AI cascade. Priority: High.")
    add_sub_heading(doc, "4.5.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. Admin uploads product photo in Admin Portal and clicks 'Auto-Fill Details with AI'.\n2. Backend queries Primary Vision AI; if rate limited, fails over to Secondary AI Gateway; if unavailable, invokes Catalog Heuristics.\n3. Service returns structured JSON containing culturally authentic title, subtitle, category, leather color name, hex code, description, and crafting time.\n4. Backend strictly sanitizes and removes any price keys.\n5. Admin form fields are auto-filled with 100% complete specifications.")
    add_sub_heading(doc, "4.5.3 Functional Requirements")
    add_bullet_point(doc, "REQ-15: ", "System shall extract cultural footwear title, subtitle, leather shade, and hex code from image.")
    add_bullet_point(doc, "REQ-16: ", "System shall execute automated failover between primary, secondary, and local heuristic engines.")
    add_bullet_point(doc, "REQ-17: ", "System shall enforce strict zero pricing leakage, ensuring AI cannot overwrite product prices.")

    # 4.6 Capital Ledger
    add_main_heading(doc, "4.6 Supplier Procurement Capital & Packaging Investment Ledger")
    add_sub_heading(doc, "4.6.1 Description and Priority")
    add_body_p(doc, "Maintains an isolated financial ledger for artisan shoe buying capital and packaging investments. Priority: High.")
    add_sub_heading(doc, "4.6.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. Super Admin opens 'Investments & Capital' tab in Admin Portal.\n2. System computes total inventory wholesale valuation (Live stock pairs x costPrice).\n3. Admin records capital addition/deduction with audit notes.\n4. System appends immutable log entry and displays reconciled capital balance.")
    add_sub_heading(doc, "4.6.3 Functional Requirements")
    add_bullet_point(doc, "REQ-18: ", "System shall segregate supplier procurement capital ledger from customer sales revenue.")
    add_bullet_point(doc, "REQ-19: ", "System shall calculate live catalog buying capital dynamically across all listed products.")
    add_bullet_point(doc, "REQ-20: ", "System shall record immutable audit logs for all capital additions, deductions, and sets.")

    # 4.7 Role-Based Admin
    add_main_heading(doc, "4.7 Role-Based Administrative Control & Multi-Manager Delegation")
    add_sub_heading(doc, "4.7.1 Description and Priority")
    add_body_p(doc, "Secures admin operations using JSON Web Tokens (JWT) and enforces role permissions. Priority: High.")
    add_sub_heading(doc, "4.7.2 Stimulus/Response Sequences")
    add_body_p(doc, "1. Admin enters username and password at `/admin`.\n2. Backend verifies bcrypt password hash and generates signed 24-hour JWT token containing role claims.\n3. Super Admin accesses all controls including capital ledgers; Managers access order fulfillment.")
    add_sub_heading(doc, "4.7.3 Functional Requirements")
    add_bullet_point(doc, "REQ-21: ", "System shall encrypt admin passwords using bcrypt with a minimum of 10 salt rounds.")
    add_bullet_point(doc, "REQ-22: ", "System shall protect administrative endpoints using cryptographically signed JWT headers.")
    add_bullet_point(doc, "REQ-23: ", "System shall allow Super Administrators to create, edit, and revoke Store Manager accounts.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # 5. OTHER NONFUNCTIONAL REQUIREMENTS
    # -------------------------------------------------------------
    add_chapter_heading(doc, "5. Other Nonfunctional Requirements")

    add_main_heading(doc, "5.1 Performance Requirements")
    add_bullet_point(doc, "NFR-1 (Catalog Latency): ", "Standard catalog and search queries shall return responses in under 150 milliseconds for a database of up to 10,000 products.")
    add_bullet_point(doc, "NFR-2 (Throughput Capacity): ", "The system backend shall handle a minimum of 200 concurrent requests per second without memory exhaustion.")
    add_bullet_point(doc, "NFR-3 (Foot Measurement Speed): ", "The computer vision foot sizing pipeline shall compute real-world millimeter dimensions within 2.0 seconds.")

    add_main_heading(doc, "5.2 Safety Requirements")
    add_body_p(doc, "The software operates as a non-critical web application. To prevent financial data loss, all write operations on order records and capital ledgers must be atomically committed to persistent storage. In the event of a server termination or crash, in-flight transactions must roll back cleanly without leaving orphan order records.")

    add_main_heading(doc, "5.3 Security Requirements")
    add_bullet_point(doc, "NFR-4 (Authentication & Auth): ", "Administrative routes shall require valid Bearer JWT tokens signed with a server-side secret key.")
    add_bullet_point(doc, "NFR-5 (Cost Price Shielding): ", "Wholesale artisan cost prices (`costPrice`) shall never be transmitted in customer-facing storefront API responses.")
    add_bullet_point(doc, "NFR-6 (Input Sanitization): ", "All client-submitted text, reviews, and search strings shall be sanitized to prevent Cross-Site Scripting (XSS) and NoSQL injection attacks.")

    add_main_heading(doc, "5.4 Software Quality Attributes")
    add_bullet_point(doc, "Availability (NFR-7): ", "The platform shall achieve 99.8% uptime, utilizing automatic failover to local mirror files if the remote database is unreachable.")
    add_bullet_point(doc, "Maintainability (NFR-8): ", "The codebase shall strictly adhere to modular separation of concerns with TypeScript strict type-checking enabled.")
    add_bullet_point(doc, "Portability (NFR-9): ", "The application shall run seamlessly on Windows, Linux, and macOS platforms supporting Node.js 20+.")

    add_main_heading(doc, "5.5 Business Rules")
    add_bullet_point(doc, "BR-1 (Sizing Boundary): ", "No product shall be sold or sized outside of whole numbers 7 to 13.")
    add_bullet_point(doc, "BR-2 (Capital Insulation): ", "Supplier buying budget is strictly isolated from customer sales cash flows.")
    add_bullet_point(doc, "BR-3 (Zero AI Pricing): ", "AI models are strictly forbidden from setting commercial prices.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # 6. OTHER REQUIREMENTS
    # -------------------------------------------------------------
    add_chapter_heading(doc, "6. Other Requirements")

    add_main_heading(doc, "6.1 Database & Persistence Requirements")
    add_body_p(doc, "The system requires a dual-tier persistence architecture. The primary database is MongoDB Atlas cloud cluster utilizing Mongoose ODM schemas for Product, Category, Order, Review, Message, Investment, and Admin models. Concurrently, all changes must be mirrored atomically to canonical local JSON files (`products.json`, `settings.json`, `admins.json`, `categories.json`, `investments.json`). Upon server startup or reconnection, the system executes an automated upsert synchronization to guarantee zero data loss.")

    add_main_heading(doc, "6.2 Internationalization and Currency Localization")
    add_body_p(doc, "All monetary amounts across the customer storefront and administrative statements must be localized in Pakistani Rupees (PKR / Rs.) with standard comma separators. All user interfaces must present date timestamps in ISO 8601 or Pakistani standard time formats.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # APPENDIX A: GLOSSARY
    # -------------------------------------------------------------
    add_chapter_heading(doc, "Appendix A: Glossary")
    gloss_table = doc.add_table(rows=0, cols=2)
    gloss_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    g_headers = ["Term", "Academic & Operational Definition"]
    g_rows = [
        ["A4 Reference Calibration", "Computer vision calibration technique utilizing a standard 210mm x 297mm paper sheet to determine spatial pixel-to-millimeter metric ratios."],
        ["Bcrypt", "A password-hashing function based on the Blowfish cipher designed to resist brute-force cryptographic attacks."],
        ["Cash on Delivery (COD)", "A payment modality wherein the customer remits payment in cash directly to the courier agent upon physical handover of footwear."],
        ["Data Flow Diagram (DFD)", "A graphical notation modeling the flow of data through an information system without procedural execution logic."],
        ["Dual-Tier Persistence", "Architectural pattern employing remote cloud database collections paired with local mirrored JSON stores for high availability."],
        ["Entity-Relationship Diagram", "A structural data model depicting logical entity types, key attributes, and relational cardinalities in a database schema."],
        ["Homography Matrix", "A 3x3 projective transformation matrix mapping points between two planar projections to rectify perspective skew."],
        ["JSON Web Token (JWT)", "An open industry standard (RFC 7519) representing claims securely between two parties as a signed JSON payload."],
        ["KDM Statement", "Khyber Digital Monetization financial summary reporting inventory valuation, supplier allocations, and procurement balances."],
        ["MERN Stack", "Unified JavaScript software architecture consisting of MongoDB, Express.js, React.js, and Node.js."],
        ["Multimodal AI", "Machine learning architectures capable of processing and synthesizing multiple modalities of input (images and natural language)."],
        ["Pakistani/UK Shoe Sizing", "Traditional artisanal whole-number sizing convention standardized from size 7 (260mm) through size 13 (305mm)."],
        ["Zero Pricing Leakage", "Strict architectural constraint preventing automated AI services from generating, suggesting, or overriding commercial prices."],
    ]
    format_table_cells(gloss_table, [2.0, 4.4], g_headers, g_rows)

    doc.add_page_break()

    # -------------------------------------------------------------
    # APPENDIX B: ANALYSIS MODELS
    # -------------------------------------------------------------
    add_chapter_heading(doc, "Appendix B: Analysis Models")

    add_main_heading(doc, "B.1 High-Level Multi-Tier System Architecture")
    add_body_p(doc, "Figure B-1 details the multi-tier architectural decomposition of the platform, linking the React presentation layer, Node.js/Express application gateway, multimodal AI vision tier, and dual-tier data persistence layer.")
    add_figure(doc, "arch_diagram.png", "Figure B-1: High-Level Multi-Tier System Architecture Diagram")

    add_main_heading(doc, "B.2 Data Flow Diagram (DFD) Level 0 — Context Diagram")
    add_body_p(doc, "Figure B-2 models the system context boundary using standard Gane & Sarson DFD notation, illustrating data flows connecting the central platform to Customers, Super Administrators, Multimodal AI Vision Service, Courier Logistics, and Payment Gateways.")
    add_figure(doc, "dfd_level0.png", "Figure B-2: Data Flow Diagram (DFD) Level 0 — Context Diagram")

    doc.add_page_break()

    add_main_heading(doc, "B.3 Data Flow Diagram (DFD) Level 1 — Core Process Decomposition")
    add_body_p(doc, "Figure B-3 illustrates the decomposition of the system into five core functional processes: Identity Control (1.0), Catalog Management (2.0), AI Multimodal Sizing (3.0), Order Fulfillment (4.0), and Procurement Capital Ledger (5.0), interfacing with persistent stores D1, D2, and D3.")
    add_figure(doc, "dfd_level1.png", "Figure B-3: Data Flow Diagram (DFD) Level 1 — Core Process Decomposition")

    add_main_heading(doc, "B.4 Data Flow Diagram (DFD) Level 2 — AI Foot Sizing Subsystem")
    add_body_p(doc, "Figure B-4 details the computer vision pipeline within Process 3.0: A4 Homography Calibration (3.1), Contour Segmentation (3.2), Metric Length Calculation (3.3), and Size Classification into whole numbers 7 to 13 (3.4).")
    add_figure(doc, "dfd_level2_ai.png", "Figure B-4: Data Flow Diagram (DFD) Level 2 — AI Foot Sizing Subsystem")

    doc.add_page_break()

    add_main_heading(doc, "B.5 UML Use Case Diagram")
    add_body_p(doc, "Figure B-5 provides the complete UML Use Case Diagram defining interactions between primary actors (Customer, Super Administrator, Store Manager) and the platform's core functional capabilities.")
    add_figure(doc, "usecase_diagram.png", "Figure B-5: Complete UML Use Case Diagram")

    add_main_heading(doc, "B.6 Entity-Relationship Diagram (ERD) with Field Constraints")
    add_body_p(doc, "Figure B-6 defines the database schema entities (PRODUCT, CATEGORY, ORDER, ORDER_ITEM, SUPPLIER_BUDGET_LOG, ADMIN_USER), explicit data types, primary/foreign key relations, and 1:N cardinalities.")
    add_figure(doc, "erd_diagram.png", "Figure B-6: Entity-Relationship Diagram (ERD) with Field Constraints")

    doc.add_page_break()

    add_main_heading(doc, "B.7 UML Sequence Diagram — Multimodal AI Auto-Fill Cascade")
    add_body_p(doc, "Figure B-7 models the chronological message sequences during automated product cataloging, depicting multi-tier failover and strict price sanitization.")
    add_figure(doc, "seq_diagram_ai.png", "Figure B-7: UML Sequence Diagram — Multimodal AI Product Auto-Fill Cascade")

    add_main_heading(doc, "B.8 UML Sequence Diagram — Customer Order Checkout & Fulfillment Flow")
    add_body_p(doc, "Figure B-8 captures the chronological transaction flow for customer order placement, inventory stock deduction, dual-tier persistence, and consignment tracking generation.")
    add_figure(doc, "seq_diagram_order.png", "Figure B-8: UML Sequence Diagram — Customer Order Checkout & Real-Time Tracking Flow")

    doc.add_page_break()

    # -------------------------------------------------------------
    # APPENDIX C: TO BE DETERMINED LIST
    # -------------------------------------------------------------
    add_chapter_heading(doc, "Appendix C: To Be Determined List")
    add_body_p(doc, "Table C-1 enumerates the complete list of prospective enhancements and external carrier integration points tracked for subsequent system iterations.")
    tbd_table = doc.add_table(rows=0, cols=4)
    tbd_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_headers = ["Item #", "Subsystem", "Description of TBD Reference", "Resolution Target"]
    t_rows = [
        ["TBD-1", "Payment Gateway", "Integration of automated webhook callbacks for online mobile wallet settlement (JazzCash API).", "Release v1.1"],
        ["TBD-2", "Courier Logistics", "Direct programmatic API consignment booking with TCS / Leopards Courier REST endpoints.", "Release v1.2"],
        ["TBD-3", "SMS Gateway", "Automated SMS notification dispatch to customer phone numbers upon order placement.", "Release v1.2"],
    ]
    format_table_cells(tbd_table, [1.0, 1.4, 2.8, 1.2], t_headers, t_rows)

    try:
        doc.save(DOCX_OUT)
        print("[OK] Wiegers SRS Document successfully updated at:", DOCX_OUT)
    except PermissionError:
        backup_out = os.path.join(os.getcwd(), 'Peshawari_Chappal_FYP_SRS_Final.docx')
        doc.save(backup_out)
        print(f"[NOTICE] '{os.path.basename(DOCX_OUT)}' is currently open in Word.")
        print(f"[OK] Generated updated document with all integrated B&W diagrams at: {backup_out}")

if __name__ == '__main__':
    generate_wiegers_srs()
