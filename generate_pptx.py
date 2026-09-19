import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # blank layout

    # Color Palette: Modern Dark / Cloud Navy
    BG_COLOR = RGBColor(10, 15, 29)        # Deep Slate Navy #0A0F1D
    CARD_BG = RGBColor(19, 29, 53)         # Card Dark Blue #131D35
    PRIMARY_ACCENT = RGBColor(37, 99, 235) # Vibrant Blue #2563EB
    GREEN_ACCENT = RGBColor(16, 185, 129)  # Emerald Green #10B981
    TEXT_WHITE = RGBColor(248, 250, 252)   # Near White
    TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
    AMBER_ACCENT = RGBColor(245, 158, 11)  # Amber

    def set_slide_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR

    def add_header(slide, eyebrow, title):
        set_slide_background(slide)
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.2))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        # Eyebrow
        p_eye = tf.paragraphs[0]
        p_eye.text = eyebrow.upper()
        p_eye.font.size = Pt(11)
        p_eye.font.bold = True
        p_eye.font.color.rgb = GREEN_ACCENT
        
        # Title
        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        p_title.space_before = Pt(4)

    def add_card(slide, left, top, width, height, title, points, accent_color=PRIMARY_ACCENT):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = CARD_BG
        shape.line.color.rgb = accent_color
        shape.line.width = Pt(1.5)
        
        tf = shape.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.25)
        tf.margin_right = Inches(0.3)
        tf.margin_bottom = Inches(0.25)

        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = accent_color
        p_title.space_after = Pt(12)

        for pt in points:
            p = tf.add_paragraph()
            p.text = f"• {pt}"
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_WHITE
            p.space_after = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.3), Inches(3.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "CLOUD INFRASTRUCTURE INTELLIGENCE & GREEN COMPUTING"
    p0.font.size = Pt(14)
    p0.font.bold = True
    p0.font.color.rgb = GREEN_ACCENT

    p1 = tf1.add_paragraph()
    p1.text = "CloudMind AI"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_before = Pt(8)

    p2 = tf1.add_paragraph()
    p2.text = "An Autonomous Multi-Region AWS Telemetry, Automated Security Remediation & Energy Optimization Platform"
    p2.font.size = Pt(18)
    p2.font.color.rgb = TEXT_MUTED
    p2.space_before = Pt(12)

    p3 = tf1.add_paragraph()
    p3.text = "Technologies: React 18 • FastAPI • AWS Boto3 SDK • Amazon CloudWatch • AWS STS"
    p3.font.size = Pt(13)
    p3.font.color.rgb = PRIMARY_ACCENT
    p3.space_before = Pt(28)

    # -------------------------------------------------------------
    # SLIDE 2: Executive Summary
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Executive Overview", "Project Abstract & Key Deliverables")
    add_card(s2, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.0), 
             "Centralized Visibility", 
             ["Multi-Region AWS infrastructure cockpit.",
              "Unified live telemetry ingestion.",
              "Eliminates console jumping across 5+ AWS screens.",
              "Reactive real-time state tracking."], PRIMARY_ACCENT)
    add_card(s2, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.0), 
             "Automated Security", 
             ["Zero-trust ingress security group auditing.",
              "EBS data-at-rest encryption checks.",
              "Well-Architected compliance scoring.",
              "Instant 1-click AWS CLI remediation scripts."], AMBER_ACCENT)
    add_card(s2, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0), 
             "Green Computing", 
             ["Continuous SPECpower energy modeling.",
              "Live kWh consumption & carbon calculation.",
              "CloudWatch CPU historical analytics.",
              "Carbon emission reduction recommendations."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 3: Problem Statement
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Industry Pain Points", "Problem Statement & Current Limitations")
    add_card(s3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.4),
             "1. Fragmented Cloud Visibility",
             ["Engineers must navigate complex AWS consoles.",
              "Lack of cross-region unified telemetry.",
              "Delayed detection of compute anomalies."], PRIMARY_ACCENT)
    add_card(s3, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.4),
             "2. Security Misconfigurations",
             [">80% of cloud security breaches stem from misconfigurations.",
              "Open SSH (22) / RDP (3389) ports to 0.0.0.0/0.",
              "Unencrypted EBS volumes violating compliance standards."], AMBER_ACCENT)
    add_card(s3, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.4),
             "3. Energy Waste & Carbon Inefficiency",
             ["Idle servers consume ~40% base electricity without productive output.",
              "Lack of continuous mathematical modeling for server power draw.",
              "No real-time carbon emissions tracking."], GREEN_ACCENT)
    add_card(s3, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.4),
             "4. Authentication & Security Friction",
             ["Fragmented credential inputs across multiple pages.",
              "Risk of credential leakage or misconfiguration.",
              "Need for unified STS verification & local persistence."], PRIMARY_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 4: Proposed Solution
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "The Solution", "CloudMind AI: Architecture & Core Capabilities")
    add_card(s4, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Global Connection Center",
             ["Single source of AWS authentication.",
              "Direct STS identity validation.",
              "Seamless switching across all AWS regions.",
              "Persistent state across all application modules."], PRIMARY_ACCENT)
    add_card(s4, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Security & Remediation",
             ["One-click automated vulnerability scan.",
              "Zero-trust ingress port analysis.",
              "EBS encryption posture evaluation.",
              "Copy-paste ready AWS CLI fixes."], AMBER_ACCENT)
    add_card(s4, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Energy & AI Copilot",
             ["Continuous thermal & power curve modeling.",
              "Dual metric switch (Efficiency vs CPU %).",
              "Dynamic load balancing across active nodes.",
              "Interactive conversational AI cloud assistant."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 5: System Architecture & Tech Stack
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Technical Blueprint", "System Architecture & Technology Stack")
    add_card(s5, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Frontend Tier",
             ["React 18 Single Page Application (SPA).",
              "Vite for ultra-fast compilation.",
              "Glassmorphic custom CSS styling.",
              "Client-side secure token storage.",
              "Responsive across all screen sizes."], PRIMARY_ACCENT)
    add_card(s5, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Backend Orchestration",
             ["FastAPI (Python 3.13) async REST gateway.",
              "Pydantic strict schema validation.",
              "Modular domain services architecture.",
              "High-throughput non-blocking endpoints.",
              "Zero-leak security error handling."], AMBER_ACCENT)
    add_card(s5, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "AWS Cloud Integration",
             ["Boto3 SDK for Amazon Web Services.",
              "Amazon EC2 for instance & volume data.",
              "Amazon CloudWatch for CPU & network telemetry.",
              "AWS STS for zero-trust identity verification.",
              "AWS Pricing API for regional emission factors."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 6: End-to-End Workflow
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Process Lifecycle", "End-to-End Operational Workflow")
    add_card(s6, Inches(0.8), Inches(1.8), Inches(2.7), Inches(5.0),
             "Step 1: Connect",
             ["Input IAM credentials on Dashboard.",
              "Target region selection.",
              "Support for STS session tokens.",
              "Client-side encryption."], PRIMARY_ACCENT)
    add_card(s6, Inches(3.8), Inches(1.8), Inches(2.7), Inches(5.0),
             "Step 2: Ingest",
             ["FastAPI queries AWS CloudWatch.",
              "Extracts 24h/7d CPU averages.",
              "Fetches active EC2 node inventory.",
              "Aggregates network in/out."], PRIMARY_ACCENT)
    add_card(s6, Inches(6.8), Inches(1.8), Inches(2.7), Inches(5.0),
             "Step 3: Analyze",
             ["Security audit executes rule engine.",
              "Energy service computes power curve.",
              "Load balancer checks workload variance.",
              "AI model summarizes findings."], AMBER_ACCENT)
    add_card(s6, Inches(9.8), Inches(1.8), Inches(2.7), Inches(5.0),
             "Step 4: Remediate",
             ["CLI scripts generated immediately.",
              "Downscaling recommendations provided.",
              "Traffic rebalance suggested.",
              "Continuous posture improvement."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 7: Security Audit Module
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Core Feature", "Automated Cloud Security & Remediation Scanner")
    add_card(s7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
             "Auditing Capabilities",
             ["Zero-Trust Ingress Audit: Scans all security group rules for 0.0.0.0/0 on sensitive ports (22 SSH, 3389 RDP).",
              "Storage Volume Audit: Inspects all attached EBS volumes for AES-256 server-side encryption.",
              "Instance Metadata Service: Enforces IMDSv2 to prevent SSRF vulnerabilities.",
              "Compliance Score (0-100): Weighted calculation based on AWS Well-Architected Framework security pillar."], AMBER_ACCENT)
    add_card(s7, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
             "Actionable Remediation",
             ["Instant CLI Scripts: Generates copy-paste AWS CLI commands for immediate execution in AWS CloudShell.",
              "Example: aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr 0.0.0.0/0.",
              "Risk Categorization: Highlights Critical, High, Medium, and Passed items with visual badges.",
              "Non-Destructive Scanning: All audit operations run strictly in read-only mode."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 8: Energy Intelligence & Green Computing
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Green Computing", "Continuous Server Energy Modeling & Carbon Analytics")
    add_card(s8, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
             "Scientific Energy Model",
             ["SPECpower Benchmark Integration: Replaces crude static formulas with continuous server power curves.",
              "Base Idle Load: Models 25-40% baseline server power draw when compute is idle.",
              "Optimal Sweet Spot: Scales continuously up to 95% efficiency between 60-75% CPU load.",
              "Thermal Saturation Penalty: Incorporates cooling and thermal degradation curves beyond 85% CPU."], GREEN_ACCENT)
    add_card(s8, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
             "Operator Telemetry Features",
             ["Dual-Metric Switch: Toggle between continuous Efficiency Score (0-100) and raw CloudWatch CPU %.",
              "Environmental Impact Metrics: Tracks energy consumed (kWh) and carbon emitted (kg CO2e).",
              "Granular Timeframes: Inspect 24 hours, 48 hours, 72 hours, or 7-day historical trends.",
              "Hover Tooltips: Precision tooltips displaying both efficiency score and CPU % for every single hour."], PRIMARY_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 9: Implementation Screenshot Showcase
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Live Demonstration", "Implementation Screenshot: Energy & Telemetry Intelligence")
    
    # Check if screenshot file exists
    screenshot_path = os.path.join(os.getcwd(), "docs", "screenshots", "energy_efficiency_trend.png")
    if os.path.exists(screenshot_path):
        s9.shapes.add_picture(screenshot_path, Inches(0.8), Inches(1.8), width=Inches(7.2))
        add_card(s9, Inches(8.3), Inches(1.8), Inches(4.2), Inches(5.0),
                 "Screenshot Highlights",
                 ["Historical Hourly Telemetry: Real-time CloudWatch data aggregated across 24-hour window.",
                  "Aligned Grid Geometry: Chart bars perfectly aligned with 0, 25, 50, 75, 100% scale lines.",
                  "Metric Switcher: Fast interactive toggle for Efficiency vs CPU %.",
                  "Transparent Model: Clear separation between real telemetry and derived estimates."], GREEN_ACCENT)
    else:
        add_card(s9, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0),
                 "Telemetry Visualization",
                 ["Real-time CloudWatch data aggregated across 24-hour window.",
                  "Chart bars aligned with 0, 25, 50, 75, 100% scale lines.",
                  "Metric Switcher: Fast interactive toggle for Efficiency vs CPU %."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 10: Engineering Challenge & Critical Bug Fix
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Engineering Rigor", "Debugging the 50% Flatline Bug ('Is this def wrong?')")
    add_card(s10, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
             "Root Cause Analysis",
             ["Bug 1 (Backend Step Quantization): calculate_efficiency_score used rigid buckets (if cpu < 10: return 45). For idle EC2 instances (0.2-3% CPU), every hour was returned as 45.",
              "Bug 2 (CSS Alignment Offset): .chart-bars had inset: 0 0 0 while grid lines had inset: 0 0 23px. A 45% bar height (108px) + 23px label aligned exactly at 131.5px (the 50% grid line!).",
              "Result: Chart appeared artificially capped and frozen identically at 50 for 24 hours."], AMBER_ACCENT)
    add_card(s10, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
             "Engineered Solution",
             ["Replaced Step Function: Implemented smooth continuous curve with cubic scaling from idle to peak.",
              "Synchronized CSS: Set inset: 0 0 23px and placed labels outside flex height via absolute positioning.",
              "Added Dual Metric Toggle: Allowed cloud operators to inspect raw CPU % directly alongside score.",
              "Verified Build: npm run build completed with 0 errors and pushed to production GitHub repo."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 11: Intelligent Load Balancing & AI Agent
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Autonomous Operations", "Intelligent Load Balancing & Conversational AI")
    add_card(s11, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
             "Dynamic Workload Balancer",
             ["Cluster Workload Variance: Calculates standard deviation of compute pressure across instances.",
              "Hotspot Detection: Flags instances exceeding safe CPU thresholds.",
              "Traffic Rebalancing: Formulates intelligent routing suggestions to equalize node load.",
              "Auto-Scaling Triggers: Detects when cluster capacity requires scale-out or scale-in."], PRIMARY_ACCENT)
    add_card(s11, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
             "Conversational AI Assistant",
             ["Natural Language Interface: Ask complex infrastructure questions in conversational English.",
              "Automated Summarization: Explains security vulnerabilities and compliance scores in plain text.",
              "Guidance on Demand: Recommends instance downsizing, spot pricing, and security remediations.",
              "Zero Latency: Responsive chat interface directly connected to FastAPI intelligence."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 12: Testing, Verification & Performance
    # -------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Verification", "Quality Assurance, Testing & Production Metrics")
    add_card(s12, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Backend Testing",
             ["FastAPI TestClient integration.",
              "Python py_compile 0 errors.",
              "STS validation unit testing.",
              "CloudWatch mock & live tests.",
              "Sub-50ms endpoint response."], PRIMARY_ACCENT)
    add_card(s12, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Frontend Build",
             ["Vite production compilation passed in 801ms.",
              "Zero ESLint / React syntax errors.",
              "Responsive layout testing.",
              "Glassmorphic design system.",
              "Zero hydration mismatches."], AMBER_ACCENT)
    add_card(s12, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0),
             "Deployment & Git",
             ["GitHub Repository: SMOS555/Cloudmind.",
              "Branch: main (Clean sync).",
              "Production artifacts verified.",
              "Docker Compose ready.",
              "Ready for live cloud deployment."], GREEN_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 13: Conclusion & Future Scope
    # -------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Looking Forward", "Conclusion & Future Roadmap")
    add_card(s13, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
             "Project Accomplishments",
             ["Delivered a fully integrated, zero-trust cloud management platform.",
              "Successfully unified telemetry, security audits, and green computing.",
              "Solved subtle real-world mathematical quantization bugs in telemetry rendering.",
              "Provided actionable 1-click remediation scripts for cloud security posture."], GREEN_ACCENT)
    add_card(s13, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
             "Future Roadmap",
             ["Autonomous Remediation Execution: Direct execution via AWS Lambda.",
              "Multi-Cloud Federation: Extending telemetry to GCP and Microsoft Azure.",
              "Predictive AI Workload Forecasting: ML-driven autoscaling before traffic spikes.",
              "Kubernetes (EKS) Pod Support: Container-level energy and security intelligence."], PRIMARY_ACCENT)

    # -------------------------------------------------------------
    # SLIDE 14: Q&A / Thank You
    # -------------------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)

    t_box_end = s14.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.3), Inches(3.5))
    tfe = t_box_end.text_frame
    tfe.word_wrap = True

    pe0 = tfe.paragraphs[0]
    pe0.text = "PROJECT DEFENSE & EVALUATION"
    pe0.font.size = Pt(14)
    pe0.font.bold = True
    pe0.font.color.rgb = GREEN_ACCENT

    pe1 = tfe.add_paragraph()
    pe1.text = "Thank You!"
    pe1.font.size = Pt(48)
    pe1.font.bold = True
    pe1.font.color.rgb = TEXT_WHITE
    pe1.space_before = Pt(8)

    pe2 = tfe.add_paragraph()
    pe2.text = "Open for Questions, Evaluation & Live Code Demonstration"
    pe2.font.size = Pt(20)
    pe2.font.color.rgb = TEXT_MUTED
    pe2.space_before = Pt(12)

    pe3 = tfe.add_paragraph()
    pe3.text = "GitHub Repository: https://github.com/SMOS555/Cloudmind"
    pe3.font.size = Pt(14)
    pe3.font.color.rgb = PRIMARY_ACCENT
    pe3.space_before = Pt(28)

    output_path = os.path.join(os.getcwd(), "CloudMind_AI_Project_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_presentation()
