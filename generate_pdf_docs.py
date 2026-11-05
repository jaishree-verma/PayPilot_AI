import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

def create_documentation_pdf(filename="PayPilot_AI_Project_Documentation.pdf"):
    pdf_path = os.path.abspath(filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#00457C") # PayPal Deep Navy
    accent_blue = colors.HexColor("#0079C1")   # PayPal Bright Blue
    dark_text = colors.HexColor("#1E293B")     # Slate 900
    muted_text = colors.HexColor("#475569")    # Slate 600
    light_bg = colors.HexColor("#F8FAFC")      # Slate 50
    border_color = colors.HexColor("#E2E8F0")  # Slate 200
    emerald_color = colors.HexColor("#059669")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_color,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=muted_text,
    )

    heading1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
    )

    heading2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=accent_blue,
        spaceBefore=8,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=dark_text,
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_text,
        leftIndent=12,
    )

    callout_style = ParagraphStyle(
        "CalloutText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0F172A"),
    )

    badge_style = ParagraphStyle(
        "BadgeText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#00457C"),
    )

    story = []

    # Header Bar
    story.append(Paragraph("PayPilot AI — Project Documentation", title_style))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            "An Autonomous Fintech Payment Platform Powered by AI & Official PayPal APIs",
            subtitle_style,
        )
    )
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=4, spaceAfter=14))

    # 1. Executive Summary
    story.append(Paragraph("1. What is PayPilot AI? (In Simple Words)", heading1_style))
    summary_text = (
        "<b>PayPilot AI</b> is an intelligent financial co-pilot built for modern businesses, agencies, and startups. "
        "Managing customer invoices, paying freelance contractors, and updating transaction ledgers normally requires "
        "tedious manual work across multiple banking dashboards. "
        "<br/><br/>"
        "PayPilot AI automates these operations. You can simply tell the AI: "
        "<i>\"Create an invoice for $250 for website design\"</i> or <i>\"Pay $120 to Elena for backend tasks\"</i>. "
        "The system understands your intent, applies strict financial safety rules, creates the verified transaction, "
        "and executes the money transfer safely using official <b>PayPal Sandbox APIs</b>."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # Highlight box
    box_data = [[
        Paragraph(
            "<b>Key Takeaway:</b> PayPilot AI acts like a smart financial assistant that turns everyday English instructions into "
            "safe, audit-backed PayPal orders, contractor payouts, and real-time ledger accounting.",
            callout_style
        )
    ]]
    box_table = Table(box_data, colWidths=[522])
    box_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ("BORDER", (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(box_table)
    story.append(Spacer(1, 14))

    # 2. Main Features Table
    story.append(Paragraph("2. Core Features & What Each Section Does", heading1_style))

    features_data = [
        [
            Paragraph("<b>Feature / Module</b>", badge_style),
            Paragraph("<b>What It Does (Simple Explanation)</b>", badge_style),
            Paragraph("<b>Real-World Benefit</b>", badge_style),
        ],
        [
            Paragraph("<b>AI Copilot & Assistant</b><br/><code>/agent</code>", body_style),
            Paragraph("Understands natural conversational English. Extracts amounts, recipient names, currencies, and proposes a structured payment plan.", body_style),
            Paragraph("No need to click through complicated banking forms. Just speak or type.", body_style),
        ],
        [
            Paragraph("<b>Invoice Management</b><br/><code>/invoices</code>", body_style),
            Paragraph("Creates custom bills, tracks payment statuses (Sent, Paid, Overdue), and provides instant PayPal checkout buttons.", body_style),
            Paragraph("Clients can pay immediately via PayPal with 1-click reconciliation.", body_style),
        ],
        [
            Paragraph("<b>Contractor Payouts</b><br/><code>/payouts</code>", body_style),
            Paragraph("Stages disbursements to freelancers. Includes automated duplicate payment checks and approval gates for transactions over $100.", body_style),
            Paragraph("Prevents accidental double payments and gives managers full approval control.", body_style),
        ],
        [
            Paragraph("<b>Workflow Automation</b><br/><code>/workflows</code>", body_style),
            Paragraph("A visual 'If-This-Then-That' engine. For example: <i>When invoice is paid -> automatically update ledger and send receipt</i>.", body_style),
            Paragraph("Eliminates repetitive manual bookkeeping and follow-up tasks.", body_style),
        ],
        [
            Paragraph("<b>Ledger & Reporting</b><br/><code>/transactions</code>", body_style),
            Paragraph("A double-entry financial journal recording every incoming payment and outgoing payout. Includes 1-click CSV download.", body_style),
            Paragraph("Clean, tax-ready and audit-ready records for accountants.", body_style),
        ],
        [
            Paragraph("<b>Contractors Directory</b><br/><code>Saved Payees</code>", body_style),
            Paragraph("Directory of verified clients and vendors with their validated PayPal emails and categories.", body_style),
            Paragraph("Speedy payout staging without remembering or retyping emails.", body_style),
        ],
    ]

    features_table = Table(features_data, colWidths=[120, 240, 162])
    features_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ("BORDER", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(features_table)
    story.append(Spacer(1, 14))

    # 3. Safety & Human-in-the-Loop
    story.append(Paragraph("3. Built-in Safety & Security Guardrails", heading1_style))
    story.append(Paragraph("To protect business funds, PayPilot AI follows strict financial rules:", body_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("• <b>Human-in-the-Loop Approval:</b> Any payout exceeding $100 requires an operator to click 'Approve' before funds can leave the account.", bullet_style))
    story.append(Paragraph("• <b>Double-Payment Prevention (Idempotency):</b> If someone accidentally requests the same payout twice within 24 hours, the system flags it as a duplicate.", bullet_style))
    story.append(Paragraph("• <b>Append-Only Audit Trail:</b> Every proposal, approval, rejection, and payment is permanently recorded in the system audit log.", bullet_style))
    story.append(Paragraph("• <b>Input Sanitization:</b> All data entries are sanitized against cross-site scripting (XSS) and injection threats.", bullet_style))
    story.append(Spacer(1, 14))

    # 4. Architecture in 3 Simple Layers
    story.append(Paragraph("4. How It Works Under the Hood", heading1_style))
    arch_data = [
        [
            Paragraph("<b>1. Frontend (UI)</b>", heading2_style),
            Paragraph("Built with <b>React & TypeScript</b>. Fast, modern, responsive interface with live loading skeletons, instant toast alerts, and modal dialogs.", body_style),
        ],
        [
            Paragraph("<b>2. Backend (API)</b>", heading2_style),
            Paragraph("Powered by <b>Python & FastAPI</b>. Validates all inputs using strict Pydantic schemas, runs the AI intent parser, and applies safety business logic.", body_style),
        ],
        [
            Paragraph("<b>3. PayPal & Database</b>", heading2_style),
            Paragraph("Connects directly to <b>PayPal Sandbox Orders & Payouts API</b>. Persists all records in a high-reliability local <b>SQLite database</b>.", body_style),
        ],
    ]
    arch_table = Table(arch_data, colWidths=[150, 372])
    arch_table.setStyle(TableStyle([
        ("BORDER", (0, 0), (-1, -1), 0.5, border_color),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 14))

    # 5. Quick Start Guide
    story.append(Paragraph("5. Quick Start Guide: How to Use It", heading1_style))
    story.append(Paragraph("1. <b>Access the Dashboard:</b> Open your browser to <code>http://localhost:5173</code>.", bullet_style))
    story.append(Paragraph("2. <b>Seed Demo Data:</b> Click <b>'Seed Demo Data'</b> at the top right to populate sample invoices, payouts, and charts.", bullet_style))
    story.append(Paragraph("3. <b>Try the AI Assistant:</b> Go to <b>AI Agent</b> and click one of the suggested prompts or type: <i>'Create an invoice for $250'</i>.", bullet_style))
    story.append(Paragraph("4. <b>Approve & Disburse:</b> Head to <b>Contractor Payouts</b> to review staged payouts and click <b>Disburse Funds</b>.", bullet_style))
    story.append(Paragraph("5. <b>Inspect Ledger & Export:</b> Visit <b>Transactions</b> and click <b>Export CSV</b> to download your accounting spreadsheet.", bullet_style))
    story.append(Spacer(1, 16))

    # Footer note
    footer_text = Paragraph(
        "<i>Documentation generated for PayPilot AI • Production-Ready Financial Platform • PayPal Developer Sandbox</i>",
        ParagraphStyle("FooterNote", parent=styles["Normal"], fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)
    )
    story.append(footer_text)

    doc.build(story)
    print(f"PDF documentation successfully created at: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_documentation_pdf()

