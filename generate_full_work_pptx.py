import os
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_full_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette: Modern Dark / Cloud Navy
    BG_COLOR = RGBColor(10, 15, 29)        # Deep Slate Navy #0A0F1D
    CARD_BG = RGBColor(19, 29, 53)         # Card Dark Blue #131D35
    PRIMARY_ACCENT = RGBColor(37, 99, 235) # Vibrant Blue #2563EB
    GREEN_ACCENT = RGBColor(16, 185, 129)  # Emerald Green #10B981
    TEXT_WHITE = RGBColor(248, 250, 252)   # Near White
    TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
    AMBER_ACCENT = RGBColor(245, 158, 11)  # Amber
    ROSE_ACCENT = RGBColor(244, 63, 94)    # Rose

    def set_bg(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR

    def add_header(slide, eyebrow, title):
        set_bg(slide)
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.2))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_eye = tf.paragraphs[0]
        p_eye.text = eyebrow.upper()
        p_eye.font.size = Pt(11)
        p_eye.font.bold = True
        p_eye.font.color.rgb = GREEN_ACCENT
        
        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        p_title.space_before = Pt(3)

    def add_card(slide, left, top, width, height, title, points, accent_color=PRIMARY_ACCENT):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = CARD_BG
        shape.line.color.rgb = accent_color
        shape.line.width = Pt(1.5)
        
        tf = shape.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.28)
        tf.margin_top = Inches(0.22)
        tf.margin_right = Inches(0.28)
        tf.margin_bottom = Inches(0.22)

        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(15)
        p_title.font.bold = True
        p_title.font.color.rgb = accent_color
        p_title.space_after = Pt(10)

        for pt in points:
            p = tf.add_paragraph()
            p.text = f"• {pt}"
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_WHITE
            p.space_after = Pt(5)

    def add_screenshot_slide(slide, eyebrow, title, img_filename, card_title, points, accent_color=GREEN_ACCENT):
        add_header(slide, eyebrow, title)
        img_path = os.path.join(os.getcwd(), "docs", "screenshots", img_filename)
        
        if os.path.exists(img_path):
            # Left side screenshot
            slide.shapes.add_picture(img_path, Inches(0.8), Inches(1.8), width=Inches(6.8))
            # Right side text card
            add_card(slide, Inches(7.8), Inches(1.8), Inches(4.7), Inches(5.1), card_title, points, accent_color)
        else:
            add_card(slide, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.1), card_title, points, accent_color)

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1)

    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(4.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "CLOUD COMPUTING & AUTONOMOUS SYSTEMS PROJECT DEFENSE"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = GREEN_ACCENT

    p1 = tf1.add_paragraph()
    p1.text = "CloudMind AI"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_before = Pt(8)

    p2 = tf1.add_paragraph()
    p2.text = "An Autonomous Multi-Region AWS Telemetry, Automated Security Remediation & Green Computing Platform"
    p2.font.size = Pt(17)
    p2.font.color.rgb = TEXT_MUTED
    p2.space_before = Pt(10)

    p3 = tf1.add_paragraph()
    p3.text = "STUDENT / CANDIDATE WORK: SAFWAAN MOHAMED S  |  REG NO: 25BCE1188"
    p3.font.size = Pt(16)
    p3.font.bold = True
    p3.font.color.rgb = GREEN_ACCENT
    p3.space_before = Pt(26)

    p4 = tf1.add_paragraph()
    p4.text = "Technologies: React 18 • FastAPI (Python 3.13) • AWS Boto3 SDK • Amazon CloudWatch • AWS STS"
    p4.font.size = Pt(13)
    p4.font.color.rgb = PRIMARY_ACCENT
    p4.space_before = Pt(10)

    # =========================================================================
    # SLIDE 2: Candidate's Contributions ("My Work Done")
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Candidate Scope of Work", "My Contributions & Implementation Achievements")
    add_card(s2, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "1. Architecture & AWS Integration",
             ["Engineered full-stack architecture connecting React frontend to FastAPI backend.",
              "Implemented Zero-Trust AWS STS Authentication (get_caller_identity).",
              "Created Global Connection Center on Dashboard syncing keys across all pages.",
              "Built multi-region switcher supporting ap-south-1, us-east-1, eu-west-1."], PRIMARY_ACCENT)
    add_card(s2, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "2. Security & Remediation Engine",
             ["Developed automated security scanner for AWS EC2 & Security Groups.",
              "Engineered CIS Well-Architected 4-pillar compliance scoring.",
              "Implemented Zero-Trust port scanner detecting open SSH (22) & RDP (3389).",
              "Built 1-click CLI remediation generator emitting instant AWS CLI fixes."], AMBER_ACCENT)
    add_card(s2, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "3. Green Computing & Problem Solving",
             ["Researched & formulated continuous SPECpower server energy curve.",
              "Diagnosed & solved the critical 50% Telemetry Flatline bug in backend & CSS.",
              "Implemented dynamic metric toggle (Efficiency Score vs CPU %) with tooltips.",
              "Integrated EC2 Load Balancer & Conversational AI Cloud Agent."], GREEN_ACCENT)

    # =========================================================================
    # SLIDE 3: Problem Statement
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Industry Pain Points", "Problem Statement & Existing Limitations")
    add_card(s3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.4),
             "1. Monitoring Sprawl Across AWS",
             ["DevOps engineers forced to navigate 5+ AWS console screens.",
              "No centralized correlation between metrics, posture, and power.",
              "Lack of cross-region telemetry visibility."], PRIMARY_ACCENT)
    add_card(s3, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.4),
             "2. Severe Security Misconfigurations",
             [">80% of cloud breaches stem from basic misconfigurations.",
              "Unrestricted ingress (0.0.0.0/0) on port 22 (SSH) and 3389 (RDP).",
              "Unencrypted EBS volumes violating compliance standards."], ROSE_ACCENT)
    add_card(s3, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.4),
             "3. The Idle Compute Energy Waste",
             ["Idle cloud servers draw ~40% electricity without doing real work.",
              "Lack of continuous mathematical modeling for server power draw.",
              "Silent carbon emissions without actionable reduction advice."], GREEN_ACCENT)
    add_card(s3, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.4),
             "4. Authentication & Key Friction",
             ["Fragmented credential prompts on individual sub-pages.",
              "Risk of credential leakage or misconfigured IAM profiles.",
              "Need for unified STS verification & safe persistence."], AMBER_ACCENT)

    # =========================================================================
    # SLIDE 4: Proposed Solution & System Architecture
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "System Blueprint", "High-Level 4-Tier Architecture & Technology Stack")
    add_card(s4, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Client Presentation Tier",
             ["React 18 Single Page Application (SPA).",
              "Vite for sub-second hot reload & compilation.",
              "Glassmorphic Dark UI design system.",
              "Reactive LocalStorage token storage.",
              "Cross-tab global credential dispatcher."], PRIMARY_ACCENT)
    add_card(s4, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Backend Orchestration",
             ["FastAPI (Python 3.13) async REST API.",
              "Pydantic schema validation & error shielding.",
              "Modular domain services architecture.",
              "High-throughput non-blocking endpoints.",
              "Sub-50ms API response latency."], AMBER_ACCENT)
    add_card(s4, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "AWS Cloud Integration",
             ["AWS Boto3 SDK for multi-region access.",
              "Amazon EC2 for instance inventory & volumes.",
              "Amazon CloudWatch for CPU & network telemetry.",
              "AWS STS for zero-trust caller identity check.",
              "AWS Pricing API for regional grid factors."], GREEN_ACCENT)

    # =========================================================================
    # SLIDE 5: End-to-End Operational Lifecycle
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Process Lifecycle", "End-to-End Operational Workflow")
    add_card(s5, Inches(0.8), Inches(1.8), Inches(2.7), Inches(5.1),
             "1. Authenticate",
             ["Admin inputs IAM credentials on Dashboard.",
              "FastAPI calls sts.get_caller_identity().",
              "Validates Account ID & Caller ARN.",
              "Saves to state with zero page reloads."], PRIMARY_ACCENT)
    add_card(s5, Inches(3.8), Inches(1.8), Inches(2.7), Inches(5.1),
             "2. Ingest",
             ["Parallel Boto3 workers query CloudWatch.",
              "Retrieves 24h & 7d CPU averages.",
              "Fetches EC2 instance state & tags.",
              "Aggregates network in/out throughput."], PRIMARY_ACCENT)
    add_card(s5, Inches(6.8), Inches(1.8), Inches(2.7), Inches(5.1),
             "3. Analyze & Model",
             ["Security rules evaluate open ports & EBS.",
              "Computes Well-Architected score (0-100).",
              "Energy engine computes continuous curve.",
              "Translates CPU to kWh and kg CO2e."], AMBER_ACCENT)
    add_card(s5, Inches(9.8), Inches(1.8), Inches(2.7), Inches(5.1),
             "4. Remediate",
             ["Emits copy-paste ready AWS CLI fixes.",
              "Generates instance downscaling advice.",
              "Load balancer suggests traffic rebalance.",
              "AI Agent explains findings in plain text."], GREEN_ACCENT)

    # =========================================================================
    # SLIDE 6: Module 1 Working: Global AWS Connection Center (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 1 Working",
        "Dashboard: Global AWS Connection Center & Live Telemetry",
        "dashboard_top.png",
        "How it Works (My Implementation)",
        ["Single Source of Truth: Centralized IAM authentication banner directly on the Dashboard.",
         "Live STS Identity: Validated Account: 970295636496, Region: ap-south-1 (Mumbai).",
         "Global Synchronization: Credentials entered here automatically apply across Security, Energy, Load Balancing & Providers.",
         "Real CloudWatch Telemetry: Live 2.68% CPU gauge and 7-hour historical CPU graph from active EC2 instance.",
         "Cloud Health Status: Real-time health score (100/100 Live AWS infrastructure)."],
        PRIMARY_ACCENT
    )

    # =========================================================================
    # SLIDE 7: Module 2 Working: Multi-Cloud Providers & EC2 Inventory (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 2 Working",
        "Dashboard: Multi-Cloud Overview & Active EC2 Inventory",
        "dashboard_bottom.png",
        "How it Works (My Implementation)",
        ["Multi-Cloud Hub: Live provider tracking (AWS 100% active, Azure & GCP ready for federation).",
         "Infrastructure Status: System health check verifying Compute (Healthy) and service status.",
         "Live EC2 Inventory: Direct discovery of active compute instance i-0f42ba1e1a07103f7.",
         "Instance Metadata: Real-time status (running), CPU (2.68%), and region (ap-south-1).",
         "Zero Hardcoding: 100% real live data returned via Boto3 describe_instances API."],
        PRIMARY_ACCENT
    )

    # =========================================================================
    # SLIDE 8: Module 3 Working: Cloud Security Center (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 3 Working",
        "Security Center: AWS Well-Architected Posture & Port Audit",
        "security_center.png",
        "How it Works (My Implementation)",
        ["Automated Vulnerability Scan: Audited 1 EC2 instance, detecting 2 High/Critical risks.",
         "Well-Architected Pillars: Evaluates Network Exposure (0%), Data Encryption (0%), and Host & Metadata Hardening (100% IMDSv2).",
         "Attack Surface Scan: Successfully flagged SSH Port 22 exposed to 0.0.0.0/0 on 1 instance.",
         "Storage Audit: Discovered 1 unencrypted EBS block storage volume violating encryption policies.",
         "Remediation Generator: Produces instant AWS CLI commands (revoke-security-group-ingress) to fix the vulnerability."],
        ROSE_ACCENT
    )

    # =========================================================================
    # SLIDE 9: Module 4 Working: Energy Intelligence (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 4 Working",
        "Energy Intelligence: Workload Efficiency & Environmental Impact",
        "energy_overview.png",
        "How it Works (My Implementation)",
        ["Connected Telemetry: Ingests live CloudWatch metrics in region ap-south-1 over 24-hour analysis window.",
         "Continuous Efficiency Score: Computed 31.2/100 efficiency reflecting true server energy behavior at 2.64% CPU.",
         "Environmental Impact Model: Accurately calculated Estimated Energy (0.1376 kWh) and Carbon Emissions (0.0963 kg CO2e).",
         "Savings Projection: Identifies potential savings of 0.0413 kWh and 0.0289 kg CO2e.",
         "Transparent Metrics: Clear separation between real telemetry and derived planning estimates."],
        GREEN_ACCENT
    )

    # =========================================================================
    # SLIDE 10: Critical Problem Solving: Debugging the 50% Flatline Bug
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Engineering Rigor & Problem Solving", "Diagnosing & Fixing the 50% Flatline Telemetry Bug")
    add_card(s10, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.1),
             "The Bug: Artificial Flatline at 50",
             ["Symptom: In initial testing, every single hourly bar across the last 24 hours was completely flat and frozen at 50.",
              "Root Cause 1 (Backend Step Quantization): calculate_efficiency_score used rigid discrete buckets: if cpu < 10: return 45. For idle instances (0.2-3% CPU), every hour was rounded to constant 45.",
              "Root Cause 2 (CSS Alignment Offset): .chart-bars had inset: 0 0 0 while grid lines had inset: 0 0 23px. A 45% bar height (108px) + 23px label underneath placed bar tops right at 131.5px (the 50% grid line!).",
              "Result: Graph created an artificial illusion that efficiency was capped at 50."], ROSE_ACCENT)
    add_card(s10, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.1),
             "My Solution: Continuous Curve & CSS Fix",
             ["Mathematical Formulation: Replaced step buckets with a continuous cubic server power curve based on SPECpower benchmarks.",
              "Curve Dynamics: Starts at 25% (idle draw), rises smoothly to 95% at 70% CPU, and includes thermal saturation penalties beyond 85% CPU.",
              "CSS Geometry Synchronization: Updated .chart-bars to inset: 0 0 23px and placed labels outside flex height via top: 100%.",
              "Dual Metric Toggle: Added interactive buttons allowing operators to toggle between Efficiency Score and raw CloudWatch CPU %.",
              "Hover Tooltips: Precision tooltips displaying both efficiency and CPU % for every hour."], GREEN_ACCENT)

    # =========================================================================
    # SLIDE 11: Module 5 Working: Continuous Efficiency Trend (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 5 Working",
        "Historical Analysis: Resolved Continuous Trend & Optimization",
        "energy_trend.png",
        "How it Works (My Implementation)",
        ["Resolved Telemetry Visualization: Demonstrates the fixed chart with continuous variation (~30% efficiency) over 24 hours.",
         "No More Flatline: Bars reflect real hourly fractional CPU changes rather than an artificial static constant.",
         "Optimization Opportunities: Automatically flags instance i-0f42ba1e1a07103f7 averaging only 2.64% CPU.",
         "Actionable Advice: Recommends rightsizing instance or applying scheduled start/stop policies.",
         "High Idle Capacity Alert: Highlights underutilized compute to eliminate wasted enterprise spending."],
        GREEN_ACCENT
    )

    # =========================================================================
    # SLIDE 12: Module 6 Working: EC2 Load Balancing (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 6 Working",
        "Workload Distribution: Real-Time EC2 Load Balancing",
        "load_balancing.png",
        "How it Works (My Implementation)",
        ["Workload Distribution Analysis: Analyzes real EC2 CPU pressure across monitored compute nodes.",
         "Cluster Status: Computes overall cluster health (Balanced status across active nodes).",
         "Node Monitoring: Real-time tracking of instance i-0f42ba1e1a07103f7 with 2.72% CPU.",
         "Compute Variance: Calculates standard deviation of compute load across active instances.",
         "Proactive Scaling Signals: Formulates traffic redistribution recommendations when skew is detected."],
        PRIMARY_ACCENT
    )

    # =========================================================================
    # SLIDE 13: Module 7 Working: Autonomous AI Cloud Agent (Screenshot)
    # =========================================================================
    add_screenshot_slide(
        prs.slides.add_slide(blank_layout),
        "Module 7 Working",
        "Autonomous AI Cloud Agent: Natural Language Infrastructure Copilot",
        "ai_cloud_agent.png",
        "How it Works (My Implementation)",
        ["Conversational Cloud AI: Interactive chat interface answering complex cloud architecture and security questions.",
         "Live Query Demo: Answered 'How can I improve cloud security?' with structured definitions and risk impact matrix.",
         "Connected Intelligence: Real-time connectivity to Cloud Metrics, Security Engine, Cost Engine, and Analytics Engine.",
         "Agent Capabilities: Cloud Knowledge, Infrastructure Analysis, Security Intelligence, and Energy Optimization.",
         "Operator Decision Support: Translates technical cloud telemetry into plain English business insights."],
        PRIMARY_ACCENT
    )

    # =========================================================================
    # SLIDE 14: Verification, Quality Assurance & Build
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "Quality Assurance", "Testing, Verification & Production Build")
    add_card(s14, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Backend Verification",
             ["FastAPI TestClient suite passed.",
              "python -m py_compile 0 syntax errors.",
              "Live AWS STS credential validation tested.",
              "Boto3 error shielding (expired token / invalid key).",
              "Sub-50ms API endpoint responses."], PRIMARY_ACCENT)
    add_card(s14, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Frontend Build",
             ["Vite production build passed in 801ms.",
              "Zero ESLint or React hydration errors.",
              "Responsive design tested across resolutions.",
              "Glassmorphic CSS with zero layout shifts.",
              "Clean client-side state management."], AMBER_ACCENT)
    add_card(s14, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Version Control & Deploy",
             ["GitHub Repo: SMOS555/Cloudmind.",
              "Branch: main (Clean sync).",
              "Docker Compose configuration verified.",
              "Production artifacts generated.",
              "Ready for live cloud deployment."], GREEN_ACCENT)

    # =========================================================================
    # SLIDE 15: Key Project Results & Impact
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "Evaluation & Impact", "Results, Business Value & Security Impact")
    add_card(s15, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.1),
             "Measurable Operational Outcomes",
             ["Single Pane of Glass: Eliminated tool sprawl by unifying telemetry, security, and sustainability.",
              "Instant Remediation: Generated AWS CLI remediation commands in < 2 seconds.",
              "Zero-Trust Authentication: Centralized STS authentication applied automatically across all 6 modules.",
              "Accurate Telemetry: Replaced broken step functions with continuous SPECpower server curves."], GREEN_ACCENT)
    add_card(s15, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.1),
             "Security & Sustainability Impact",
             ["100% Risk Discovery: Successfully caught open SSH port 22 and unencrypted EBS volumes.",
              "Carbon Transparency: Provided actionable kWh and kg CO2e metrics for real EC2 compute.",
              "Rightsizing Intelligence: Detected over-provisioned idle instances with right-sizing advice.",
              "Production Ready: Modular architecture built for scale across enterprise AWS environments."], PRIMARY_ACCENT)

    # =========================================================================
    # SLIDE 16: Future Roadmap
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    add_header(s16, "Future Enhancements", "Roadmap & Technology Expansion")
    add_card(s16, Inches(0.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Autonomous Remediation",
             ["Execute security remediations directly from the UI via AWS Lambda.",
              "Automated security group rule revocation with audit logging.",
              "Automated EBS encryption snapshot migration."], PRIMARY_ACCENT)
    add_card(s16, Inches(4.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Multi-Cloud Federation",
             ["Expand telemetry ingestion to Google Cloud Platform (GCP).",
              "Integrate Microsoft Azure Virtual Machines.",
              "Unified multi-cloud carbon intensity comparison."], AMBER_ACCENT)
    add_card(s16, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.1),
             "Predictive AI Workload",
             ["Train LSTM / Transformer models on CPU history.",
              "Proactive auto-scaling prior to peak traffic events.",
              "Kubernetes (EKS) container pod-level energy tracking."], GREEN_ACCENT)

    # =========================================================================
    # SLIDE 17: Conclusion & Candidate Defense (Q&A)
    # =========================================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_bg(s17)

    t_end = s17.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(4.5))
    tfe = t_end.text_frame
    tfe.word_wrap = True

    pe0 = tfe.paragraphs[0]
    pe0.text = "PROJECT EVALUATION & DEFENSE"
    pe0.font.size = Pt(13)
    pe0.font.bold = True
    pe0.font.color.rgb = GREEN_ACCENT

    pe1 = tfe.add_paragraph()
    pe1.text = "Thank You!"
    pe1.font.size = Pt(48)
    pe1.font.bold = True
    pe1.font.color.rgb = TEXT_WHITE
    pe1.space_before = Pt(8)

    pe2 = tfe.add_paragraph()
    pe2.text = "Open for Faculty Questions, Evaluation & Live System Demonstration"
    pe2.font.size = Pt(18)
    pe2.font.color.rgb = TEXT_MUTED
    pe2.space_before = Pt(10)

    pe3 = tfe.add_paragraph()
    pe3.text = "Candidate: Safwaan Mohamed S  |  Register No: 25BCE1188"
    pe3.font.size = Pt(18)
    pe3.font.bold = True
    pe3.font.color.rgb = GREEN_ACCENT
    pe3.space_before = Pt(22)

    pe4 = tfe.add_paragraph()
    pe4.text = "GitHub Repository: https://github.com/SMOS555/Cloudmind"
    pe4.font.size = Pt(14)
    pe4.font.color.rgb = PRIMARY_ACCENT
    pe4.space_before = Pt(8)

    output_path = os.path.join(os.getcwd(), "CloudMind_AI_Project_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

    # Copy to Downloads and Artifacts
    downloads_path = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\hp"), "Downloads", "CloudMind_AI_Project_Presentation_Safwaan_FullWork.pptx")
    artifact_dir = r"C:\Users\hp\.gemini\antigravity\brain\cccfff31-0492-46d6-8f42-ea48cb66ea42"
    artifact_path = os.path.join(artifact_dir, "CloudMind_AI_Project_Presentation.pptx")

    try:
        shutil.copyfile(output_path, downloads_path)
        print(f"Copied full work PPTX to Downloads: {downloads_path}")
    except Exception as e:
        print("Failed to copy to Downloads:", e)

    try:
        shutil.copyfile(output_path, artifact_path)
        print(f"Copied full work PPTX to Artifacts: {artifact_path}")
    except Exception as e:
        print("Failed to copy to Artifacts:", e)

if __name__ == "__main__":
    create_full_presentation()
