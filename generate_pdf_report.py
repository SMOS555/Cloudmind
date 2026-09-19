import base64
import os
import subprocess
import shutil

def get_b64(filename):
    p = os.path.join(os.getcwd(), "docs", "screenshots", filename)
    if os.path.exists(p):
        with open(p, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    return ""

def build_pdf():
    b64_dash_top = get_b64("dashboard_top.png")
    b64_dash_bottom = get_b64("dashboard_bottom.png")
    b64_security = get_b64("security_center.png")
    b64_energy_overview = get_b64("energy_overview.png")
    b64_energy_trend = get_b64("energy_trend.png")
    b64_load_balancing = get_b64("load_balancing.png")
    b64_ai_agent = get_b64("ai_cloud_agent.png")

    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CloudMind AI - Academic Project Submission Report</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.55;
    font-size: 10.5pt;
  }
  .cover {
    page-break-after: always;
    padding-top: 60px;
    text-align: center;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 80px;
  }
  .badge {
    display: inline-block;
    background: #eff6ff;
    color: #2563eb;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    padding: 6px 16px;
    border-radius: 20px;
    border: 1px solid #bfdbfe;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  h1.project-title {
    font-size: 26pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    margin-bottom: 16px;
  }
  p.subtitle {
    font-size: 12pt;
    color: #475569;
    max-width: 650px;
    margin: 0 auto 35px auto;
  }
  .meta-table {
    margin: 40px auto 0 auto;
    width: 85%;
    border-collapse: collapse;
    text-align: left;
  }
  .meta-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 10.5pt;
  }
  .meta-table td.label {
    font-weight: 700;
    color: #334155;
    width: 38%;
  }
  .section {
    margin-top: 26px;
    margin-bottom: 22px;
  }
  .page-break {
    page-break-after: always;
  }
  h2.section-header {
    font-size: 15pt;
    color: #0f172a;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 5px;
    margin-bottom: 14px;
    margin-top: 22px;
  }
  h3.subsection-header {
    font-size: 12pt;
    color: #1e3a8a;
    margin-top: 14px;
    margin-bottom: 6px;
  }
  p {
    margin-bottom: 10px;
    color: #334155;
    text-align: justify;
  }
  ul, ol {
    margin-left: 24px;
    margin-bottom: 12px;
    color: #334155;
  }
  li {
    margin-bottom: 4px;
  }
  .callout {
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    padding: 12px 16px;
    margin: 14px 0;
    border-radius: 0 6px 6px 0;
    font-size: 10pt;
  }
  .callout.warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }
  .callout.success {
    border-left-color: #10b981;
    background: #ecfdf5;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
  }
  table.data-table th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }
  .diagram-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8pt;
    white-space: pre;
    line-height: 1.35;
    color: #0f172a;
    overflow-x: auto;
  }
  .screenshot-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
    margin-bottom: 22px;
    page-break-inside: avoid;
    box-shadow: 0 3px 8px rgba(0,0,0,0.06);
  }
  .screenshot-card img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    display: block;
  }
  .screenshot-card .caption {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e3a8a;
    margin-top: 8px;
  }
  .screenshot-card .desc {
    font-size: 9pt;
    color: #475569;
    margin-top: 2px;
    line-height: 1.4;
  }
</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="badge">Academic Project Documentation</div>
    <h1 class="project-title">CloudMind AI</h1>
    <p class="subtitle">An Autonomous Multi-Region AWS Telemetry, Automated Security Remediation, and Green Cloud Computing Platform</p>
    
    <table class="meta-table">
      <tr>
        <td class="label">Student Name</td>
        <td style="font-weight: 700; color: #1e3a8a; font-size: 11pt;">Safwaan Mohamed S</td>
      </tr>
      <tr>
        <td class="label">Registration Number</td>
        <td style="font-weight: 700; color: #1e3a8a; font-size: 11pt;">25BCE1188</td>
      </tr>
      <tr>
        <td class="label">Course / Domain</td>
        <td>Cloud Computing & Autonomous Distributed Systems</td>
      </tr>
      <tr>
        <td class="label">Project Title</td>
        <td>CloudMind AI (Autonomous Cloud Infrastructure Suite)</td>
      </tr>
      <tr>
        <td class="label">Frontend Technologies</td>
        <td>React 18, Vite, Responsive CSS Glassmorphism</td>
      </tr>
      <tr>
        <td class="label">Backend Architecture</td>
        <td>FastAPI (Python 3.13), Uvicorn, Boto3 AWS SDK</td>
      </tr>
      <tr>
        <td class="label">Target Cloud Provider</td>
        <td>Amazon Web Services (AWS EC2, CloudWatch, STS, IAM)</td>
      </tr>
      <tr>
        <td class="label">GitHub Repository</td>
        <td>https://github.com/SMOS555/Cloudmind</td>
      </tr>
      <tr>
        <td class="label">Academic Year</td>
        <td>2026</td>
      </tr>
    </table>
  </div>

  <!-- SECTION 1: PROBLEM STATEMENT -->
  <div class="section">
    <h2 class="section-header">1. Problem Statement</h2>
    
    <p>
      In modern enterprise cloud architectures, Amazon Web Services (AWS) hosts millions of microservices, applications, and database instances. However, infrastructure management in modern organizations suffers from four fundamental bottlenecks:
    </p>

    <h3 class="subsection-header">1.1 Fragmented Cloud Visibility & Monitoring Sprawl</h3>
    <p>
      DevOps teams and cloud administrators are routinely forced to juggle across multiple AWS Console screens, independent regional endpoints, and disconnected CloudWatch dashboards to evaluate compute health. The absence of a unified, cross-region cockpit creates operational blindspots, delays incident response times, and obscures holistic infrastructure health.
    </p>

    <h3 class="subsection-header">1.2 Pervasive Security Misconfigurations</h3>
    <p>
      Industry threat reports confirm that over 80% of enterprise cloud security breaches are directly traceable to basic misconfigurations rather than zero-day vulnerabilities. Common critical vulnerabilities in AWS deployments include:
    </p>
    <ul>
      <li><strong>Exposed Inbound Management Ports:</strong> Security groups permitting unrestricted ingress (<code>0.0.0.0/0</code>) on sensitive administrative ports such as SSH (Port 22) or RDP (Port 3389), exposing servers directly to malicious automated botnets.</li>
      <li><strong>Unencrypted Data at Rest:</strong> Elastic Block Store (EBS) volumes provisioned without default <code>AES-256</code> server-side encryption, violating SOC2, ISO 27001, and HIPAA compliance mandates.</li>
      <li><strong>Instance Metadata Service Vulnerabilities:</strong> EC2 instances operating with legacy IMDSv1 rather than enforced IMDSv2, leaving workloads vulnerable to Server-Side Request Forgery (SSRF) credential theft.</li>
    </ul>

    <h3 class="subsection-header">1.3 The Idle Compute & Carbon Emission Paradox</h3>
    <p>
      Modern enterprise servers exhibit non-linear power consumption characteristics. Groundbreaking studies from SPECpower demonstrate that an idle server draws approximately 25% to 40% of its peak electricity without executing productive workload. In over-provisioned cloud environments, instances run continuously with 0.5%-4% CPU utilization, silently consuming power and generating carbon emissions without operational justification. Typical management tools provide raw CPU numbers without translating compute into energy consumption (kWh) or carbon footprint (kg CO2e).
    </p>

    <h3 class="subsection-header">1.4 Authentication Sprawl & Usability Friction</h3>
    <p>
      Traditional student and prototype cloud dashboards force users to repeatedly enter IAM keys across individual pages or hardcode sensitive access secrets into server files. This causes high friction, security risks, and prevents multi-region agility.
    </p>

    <div class="callout success">
      <strong>Project Goal:</strong> CloudMind AI addresses all four bottlenecks by providing a zero-trust, unified, automated platform that connects directly to AWS via STS, ingests live CloudWatch telemetry, runs automated security audits with 1-click CLI remediation, and computes continuous green energy curves.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 2: WORKFLOW & SYSTEM ARCHITECTURE -->
  <div class="section">
    <h2 class="section-header">2. System Workflow & Architecture</h2>

    <h3 class="subsection-header">2.1 High-Level 4-Tier Architecture</h3>
    <p>
      CloudMind AI is architectured as a decoupled, multi-tiered cloud management platform:
    </p>

    <div class="diagram-box">
+----------------------------------------------------------------------------------------------------+
|                                      CLIENT PRESENTATION TIER                                      |
|   React 18 Single Page App | Vite Bundler | Global Credential Sync | Glassmorphic Telemetry UI     |
+----------------------------------------------------------------------------------------------------+
                                                  │ (REST API / JSON Payload)
                                                  ▼
+----------------------------------------------------------------------------------------------------+
|                                    API & ORCHESTRATION GATEWAY                                     |
|           FastAPI (Python 3.13) | Uvicorn ASGI Server | Pydantic Request/Response Models           |
+----------------------------------------------------------------------------------------------------+
       │                                │                                │
       ▼                                ▼                                ▼
+--------------------+        +--------------------+        +--------------------+
|  Security Analysis |        |   Energy & Carbon  |        |  Workload Balancer |
|  & CLI Remediation |        |   SPECpower Curve  |        |  & Variance Engine |
+--------------------+        +--------------------+        +--------------------+
       │                                │                                │
       └────────────────────────────────┼────────────────────────────────┘
                                        ▼ (AWS Boto3 SDK via STS)
+----------------------------------------------------------------------------------------------------+
|                                      AMAZON WEB SERVICES (AWS)                                     |
|  AWS STS (Identity) | Amazon EC2 (Nodes & EBS) | Amazon CloudWatch (Metrics) | Regional Grid Factors|
+----------------------------------------------------------------------------------------------------+
    </div>

    <h3 class="subsection-header">2.2 Global AWS STS Authentication Workflow</h3>
    <p>
      To enforce Zero-Trust security principles, CloudMind AI introduces a centralized <strong>Global Connection Center</strong> on the main Dashboard. Users authenticate once, and credentials flow seamlessly across all modules.
    </p>

    <div class="diagram-box">
Cloud Administrator            Dashboard UI                     FastAPI Backend                 AWS STS Service
        │                            │                                 │                               │
        │── 1. Enter IAM Keys ──────>│                                 │                               │
        │      (Key, Secret, Region) │── 2. POST /security/validate ──>│                               │
        │                            │                                 │── 3. get_caller_identity() ──>│
        │                            │                                 │                               │
        │                            │                                 │<── 4. Return Account & ARN ───│
        │                            │<── 5. 200 OK (Validated) ───────│                               │
        │                            │                                 │                               │
        │                            │── 6. Save to LocalStorage & Dispatch Global React State ────────┐
        │                            │                                                                 │
        │<── 7. Display Connected ───│<── 8. Propagate to Security, Energy, LoadBalancing Modules ─────┘
    </div>

    <h3 class="subsection-header">2.3 Automated Security Audit & Remediation Pipeline</h3>
    <p>
      The security engine performs automated scans across 3 critical vectors:
    </p>
    <ol>
      <li><strong>Ingress Rules:</strong> Queries EC2 security groups; flags any rule allowing <code>0.0.0.0/0</code> on TCP port 22 or 3389 as <em>CRITICAL</em>.</li>
      <li><strong>Storage Encryption:</strong> Queries EBS volumes; flags unencrypted volumes as <em>HIGH RISK</em>.</li>
      <li><strong>Well-Architected Scoring:</strong> Calculates a weighted score from 0 to 100 representing cloud compliance posture.</li>
      <li><strong>One-Click CLI Remediation:</strong> Automatically formats precise AWS CLI commands (e.g. <code>aws ec2 revoke-security-group-ingress</code>) for instant mitigation.</li>
    </ol>

    <h3 class="subsection-header">2.4 Green Computing & Continuous Energy Curve Formulation</h3>
    <p>
      Unlike naive step models that artificially flatline at low utilization, CloudMind applies a continuous server power model based on SPECpower benchmarks:
    </p>
    <div class="callout">
      <strong>Continuous Efficiency Formula:</strong><br>
      • For 0 &lt; CPU &le; 15%: Score = 25.0 + (CPU / 15.0) &times; 35.0<br>
      • For 15% &lt; CPU &le; 70%: Score = 60.0 + ((CPU - 15.0) / 55.0) &times; 35.0<br>
      • For 70% &lt; CPU &le; 85%: Score = 95.0 + ((CPU - 70.0) / 15.0) &times; 3.0<br>
      • For CPU &gt; 85%: Score = 98.0 - ((CPU - 85.0) / 15.0) &times; 15.0 (Thermal saturation penalty)
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: IMPLEMENTATION MODULE ARCHITECTURE -->
  <div class="section">
    <h2 class="section-header">3. Implementation & Module Architecture</h2>
    <p>
      CloudMind AI is implemented as a cohesive suite of functional modules, each engineered to address specific operational and security requirements:
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th>Module</th>
          <th>Primary Capabilities</th>
          <th>Key AWS Services</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Dashboard & Connection Center</strong></td>
          <td>Single entry point for AWS credentials, instant STS identity check, live CPU gauge, instance counts, and multi-region dropdown.</td>
          <td>AWS STS, EC2, CloudWatch</td>
        </tr>
        <tr>
          <td><strong>Security Posture Audit</strong></td>
          <td>Deep security scanning, Well-Architected compliance score (0-100), port 22/3389 exposure alerts, and instant AWS CLI remediation generator.</td>
          <td>AWS EC2, IAM, Security Groups</td>
        </tr>
        <tr>
          <td><strong>Energy Intelligence</strong></td>
          <td>Continuous power draw modeling, metric toggle (Efficiency Score vs CloudWatch CPU %), carbon emissions (kg CO2e), and downscaling advice.</td>
          <td>CloudWatch, AWS Pricing API</td>
        </tr>
        <tr>
          <td><strong>Load Balancing & Workload</strong></td>
          <td>Compute variance analysis, hotspot instance detection, traffic distribution recommendations, and auto-scaling triggers.</td>
          <td>EC2, CloudWatch</td>
        </tr>
        <tr>
          <td><strong>Conversational AI Agent</strong></td>
          <td>Natural language cloud copilot answering infrastructure queries, explaining security vulnerabilities, and offering optimizations.</td>
          <td>FastAPI LLM Service</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 4: ENGINEERING RIGOR -->
  <div class="section">
    <h2 class="section-header">4. Engineering Challenges & Problem Solving</h2>
    
    <h3 class="subsection-header">4.1 The Telemetry Flatline Issue ("Is this def wrong?")</h3>
    <p>
      During initial testing of the Energy Intelligence module, historical telemetry displayed a completely horizontal line across all 24 hours, with every bar visually pinned to 50:
    </p>

    <div class="callout warning">
      <strong>Identified Root Cause:</strong><br>
      1. <em>Backend Discretization:</em> The backend method <code>calculate_efficiency_score</code> used rigid stair-step buckets: <code>if cpu &lt; 10: return 45</code>. For lightly-loaded instances running background tasks (0.2%-3.5% CPU), every single hour yielded the exact constant 45.<br>
      2. <em>CSS Coordinate Mismatch:</em> The grid lines spanned 217px (<code>inset: 0 0 23px</code>) to leave room for bottom labels, but the bar container spanned 240px (<code>inset: 0 0 0</code>). A 45% bar height (108px) plus the 23px label underneath aligned the top of each bar at 131.5px, which mathematically matched the 50% grid line (131.5px) to the exact pixel!
    </div>

    <p>
      <strong>Engineered Resolution:</strong>
    </p>
    <ol>
      <li>Replaced the discrete step function with a smooth server energy efficiency curve based on SPECpower benchmarks.</li>
      <li>Added <code>cpu</code> telemetry fields directly into the trend API payload.</li>
      <li>Synchronized CSS <code>inset: 0 0 23px</code> on <code>.chart-bars</code> and positioned labels outside the flex height via <code>top: 100%</code>.</li>
      <li>Added interactive metric switch buttons permitting operators to inspect Efficiency and raw CPU % with rich tooltips.</li>
    </ol>
  </div>

  <!-- SECTION 5: QUALITY ASSURANCE & VERIFICATION -->
  <div class="section">
    <h2 class="section-header">5. Verification, Testing & Results</h2>
    <p>
      CloudMind AI was comprehensively verified across backend and frontend environments:
    </p>
    <ul>
      <li><strong>FastAPI Endpoints:</strong> All routes (<code>/security/aws/validate-credentials</code>, <code>/api/metrics</code>, <code>/energy/aws</code>) tested with live AWS credentials.</li>
      <li><strong>Frontend Build:</strong> Vite production build passed in 801ms with zero errors.</li>
      <li><strong>Source Code Management:</strong> Complete code, styles, documentation, and presentation files synchronized with GitHub repository <code>SMOS555/Cloudmind</code> on branch <code>main</code>.</li>
    </ul>
  </div>

  <!-- SECTION 6: CONCLUSION -->
  <div class="section">
    <h2 class="section-header">6. Conclusion & Future Scope</h2>
    <p>
      CloudMind AI bridges the gap between infrastructure observability, automated security posture governance, and green cloud computing. It provides a robust, production-ready foundation for modern cloud operations.
    </p>
    <ul>
      <li><strong>Autonomous Remediation:</strong> Direct execution of security fixes via AWS Lambda functions.</li>
      <li><strong>Multi-Cloud Telemetry:</strong> Extending telemetry federation to Google Cloud Platform (GCP) and Microsoft Azure.</li>
      <li><strong>Predictive ML Scaling:</strong> Machine learning models predicting workload spikes to optimize EC2 spot instances.</li>
    </ul>

    <div class="callout success">
      <strong>Candidate Summary:</strong> Prepared and presented by <strong>Safwaan Mohamed S</strong> (Registration No: <strong>25BCE1188</strong>) for academic project submission and evaluation.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 7: IMPLEMENTATION SCREENSHOTS SHOWCASE -->
  <div class="section">
    <h2 class="section-header">7. Implementation Screenshots Showcase</h2>
    <p>
      The following high-resolution screenshots demonstrate the live, operational CloudMind AI application connected to active AWS multi-region infrastructure:
    </p>

    <!-- Screenshot 1: Dashboard Top -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_DASH_TOP__" alt="Dashboard & Global Connection Center" />
      <div class="caption">Figure 7.1: Dashboard & Global AWS Connection Center</div>
      <div class="desc">
        Demonstrates active AWS IAM connection (Account: <code>970295636496</code>, Region: <code>ap-south-1</code>), live Cloud Health indicator (100/100), real-time CloudWatch CPU utilization gauge (2.68%), and historical CPU trend chart.
      </div>
    </div>

    <!-- Screenshot 2: Dashboard Bottom -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_DASH_BOTTOM__" alt="Cloud Providers & EC2 Inventory" />
      <div class="caption">Figure 7.2: Multi-Cloud Provider Integration & Active EC2 Inventory</div>
      <div class="desc">
        Renders multi-cloud distribution status (AWS 100%), compute health monitoring, and live EC2 instance inventory showing active node <code>i-0f42ba1e1a07103f7</code> running in <code>ap-south-1</code>.
      </div>
    </div>

    <div class="page-break"></div>

    <!-- Screenshot 3: Security Center -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_SECURITY__" alt="Security Posture Audit Center" />
      <div class="caption">Figure 7.3: Cloud Infrastructure Security Center & Well-Architected Audit</div>
      <div class="desc">
        Renders real-time AWS posture analysis (50/100 Moderate Risk), CIS AWS Well-Architected pillar breakdown (Host & Metadata Hardening 100%), and identified public attack surface exposures (SSH Port 22 open on 1 instance).
      </div>
    </div>

    <!-- Screenshot 4: Energy Overview -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_ENERGY_OVERVIEW__" alt="Energy Intelligence Overview" />
      <div class="caption">Figure 7.4: Energy Intelligence - Workload Utilization & Environmental Impact</div>
      <div class="desc">
        Demonstrates live AWS telemetry connection in region <code>ap-south-1</code>, displaying continuous Efficiency Score (31.2/100), Average CPU (2.64%), and calculated sustainability metrics (0.1376 kWh energy, 0.0963 kg CO2e emissions).
      </div>
    </div>

    <div class="page-break"></div>

    <!-- Screenshot 5: Energy Trend -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_ENERGY_TREND__" alt="Continuous Efficiency Trend Chart" />
      <div class="caption">Figure 7.5: Historical Analysis - Continuous Efficiency Trend & Optimization Opportunities</div>
      <div class="desc">
        Illustrates the resolved continuous telemetry trend chart across 24 hours (eliminating the flat 50% bug), rendering real dynamic fluctuations at ~30% along with automated right-sizing suggestions for instance <code>i-0f42ba1e1a07103f7</code>.
      </div>
    </div>

    <!-- Screenshot 6: Load Balancing -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_LOAD_BALANCING__" alt="Load Balancing Workload Distribution" />
      <div class="caption">Figure 7.6: Workload Distribution - Real-Time EC2 Load Balancing & Server Health</div>
      <div class="desc">
        Displays cluster status (Balanced), real-time CPU pressure (2.72%), server count, and active node health monitoring for compute instance <code>i-0f42ba1e1a07103f7</code>.
      </div>
    </div>

    <div class="page-break"></div>

    <!-- Screenshot 7: AI Cloud Agent -->
    <div class="screenshot-card">
      <img src="data:image/png;base64,__IMG_AI_AGENT__" alt="Autonomous AI Cloud Agent" />
      <div class="caption">Figure 7.7: Autonomous AI Cloud Agent - Natural Language Infrastructure Copilot</div>
      <div class="desc">
        Illustrates conversational cloud assistance answering security questions, risk assessments, and connected intelligence engines (Cloud Metrics, Security Engine, Cost Engine, Analytics Engine Connected).
      </div>
    </div>
  </div>

</body>
</html>"""

    # Replace image placeholders
    final_html = html_content
    final_html = final_html.replace("__IMG_DASH_TOP__", b64_dash_top)
    final_html = final_html.replace("__IMG_DASH_BOTTOM__", b64_dash_bottom)
    final_html = final_html.replace("__IMG_SECURITY__", b64_security)
    final_html = final_html.replace("__IMG_ENERGY_OVERVIEW__", b64_energy_overview)
    final_html = final_html.replace("__IMG_ENERGY_TREND__", b64_energy_trend)
    final_html = final_html.replace("__IMG_LOAD_BALANCING__", b64_load_balancing)
    final_html = final_html.replace("__IMG_AI_AGENT__", b64_ai_agent)

    html_file = os.path.join(os.getcwd(), "REPORT_FOR_PDF.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(final_html)
    print(f"Generated HTML template at: {html_file}")

    # Output PDF paths
    pdf_filename = "CloudMind_Project_Report.pdf"
    workspace_pdf = os.path.join(os.getcwd(), pdf_filename)
    downloads_pdf = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\hp"), "Downloads", pdf_filename)
    artifact_dir = r"C:\Users\hp\.gemini\antigravity\brain\cccfff31-0492-46d6-8f42-ea48cb66ea42"
    artifact_pdf = os.path.join(artifact_dir, pdf_filename)

    # Edge / Chrome headless execution
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    browser = edge_path if os.path.exists(edge_path) else chrome_path

    cmd = [
        browser,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={workspace_pdf}",
        html_file
    ]

    print("Running browser to render PDF:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Browser exit code:", res.returncode)

    if os.path.exists(workspace_pdf):
        print(f"PDF successfully created at: {workspace_pdf} (Size: {os.path.getsize(workspace_pdf)} bytes)")
        
        # Copy to Downloads
        try:
            shutil.copyfile(workspace_pdf, downloads_pdf)
            print(f"Copied PDF to Downloads: {downloads_pdf}")
        except Exception as e:
            print("Failed to copy PDF to Downloads:", e)

        # Copy to Artifacts
        try:
            shutil.copyfile(workspace_pdf, artifact_pdf)
            print(f"Copied PDF to Artifacts: {artifact_pdf}")
        except Exception as e:
            print("Failed to copy PDF to Artifacts:", e)
    else:
        print("PDF creation failed. Stderr:", res.stderr)

if __name__ == "__main__":
    build_pdf()
