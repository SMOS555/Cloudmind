import { useEffect, useState, useMemo } from "react";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

const STORAGE_KEY = "cloudmind_aws_security_creds";

const AWS_REGIONS = [
  { id: "ap-south-1", label: "Asia Pacific (Mumbai) - ap-south-1" },
  { id: "us-east-1", label: "US East (N. Virginia) - us-east-1" },
  { id: "us-east-2", label: "US East (Ohio) - us-east-2" },
  { id: "us-west-2", label: "US West (Oregon) - us-west-2" },
  { id: "eu-west-1", label: "Europe (Ireland) - eu-west-1" },
  { id: "eu-central-1", label: "Europe (Frankfurt) - eu-central-1" },
  { id: "ap-southeast-1", label: "Asia Pacific (Singapore) - ap-southeast-1" },
  { id: "ap-northeast-1", label: "Asia Pacific (Tokyo) - ap-northeast-1" },
];

function Security({ awsCredentials, updateAwsCredentials }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("analytics"); // 'analytics' | 'instances' | 'findings' | 'security_groups' | 'credentials'

  // AWS Credentials State
  const [accessKeyId, setAccessKeyId] = useState(awsCredentials?.accessKeyId || "");
  const [secretAccessKey, setSecretAccessKey] = useState(awsCredentials?.secretAccessKey || "");
  const [sessionToken, setSessionToken] = useState(awsCredentials?.sessionToken || "");
  const [region, setRegion] = useState(awsCredentials?.region || "ap-south-1");
  const [useServerDefaults, setUseServerDefaults] = useState(
    awsCredentials?.useServerDefaults ?? true
  );
  const [rememberCreds, setRememberCreds] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  // Verification & Scan State
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Filters & Search State
  const [instanceSearch, setInstanceSearch] = useState("");
  const [instanceFilter, setInstanceFilter] = useState("all"); // 'all' | 'running' | 'public' | 'at_risk' | 'unencrypted'
  const [findingSeverityFilter, setFindingSeverityFilter] = useState("all"); // 'all' | 'Critical' | 'High' | 'Medium' | 'Low'
  const [findingCategoryFilter, setFindingCategoryFilter] = useState("all");
  const [expandedInstanceId, setExpandedInstanceId] = useState(null);

  // Show credentials drawer / modal
  const [showCredsDrawer, setShowCredsDrawer] = useState(false);

  // ============================================================
  // SYNC WITH GLOBAL AWS CREDENTIALS (FROM DASHBOARD OR STORAGE)
  // ============================================================
  useEffect(() => {
    if (awsCredentials) {
      setAccessKeyId(awsCredentials.accessKeyId || "");
      setSecretAccessKey(awsCredentials.secretAccessKey || "");
      setSessionToken(awsCredentials.sessionToken || "");
      setRegion(awsCredentials.region || "ap-south-1");
      setUseServerDefaults(awsCredentials.useServerDefaults ?? true);
      runSecurityScan(awsCredentials.region, awsCredentials);
    }
  }, [awsCredentials]);

  // ============================================================
  // RUN SECURITY SCAN
  // ============================================================
  const runSecurityScan = async (overrideRegion, overrideCreds = null) => {
    setScanning(true);
    setError("");
    setLoading(true);

    const activeCreds = overrideCreds || awsCredentials;
    const scanRegion = overrideRegion || activeCreds?.region || region || "ap-south-1";

    const payload = {
      region: scanRegion,
    };

    const isServer = activeCreds ? activeCreds.useServerDefaults : useServerDefaults;
    const key = (activeCreds?.accessKeyId || accessKeyId || "").trim();
    const secret = (activeCreds?.secretAccessKey || secretAccessKey || "").trim();
    const token = (activeCreds?.sessionToken || sessionToken || "").trim();

    if (!isServer && key && secret) {
      payload.aws_access_key_id = key;
      payload.aws_secret_access_key = secret;
      if (token) {
        payload.aws_session_token = token;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/security/aws/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Scan failed with status ${response.status}`);
      }

      const data = await response.json();
      setSecurityData(data);

      // Save credentials globally if requested
      if (rememberCreds && updateAwsCredentials) {
        updateAwsCredentials({
          accessKeyId: key,
          secretAccessKey: secret,
          sessionToken: token,
          region: scanRegion,
          useServerDefaults: isServer,
          accountId: data?.account_id || null,
        });
      }
    } catch (err) {
      console.error("Security scan error:", err);
      setError(err.message || "Failed to complete AWS security audit.");
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  // ============================================================
  // TEST / VALIDATE AWS CREDENTIALS
  // ============================================================
  const testAwsCredentials = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const payload = {
      region: region || "ap-south-1",
    };

    if (!useServerDefaults) {
      if (!accessKeyId.trim() || !secretAccessKey.trim()) {
        setTestResult({
          valid: false,
          message: "Please enter both AWS Access Key ID and Secret Access Key.",
        });
        setTestingConnection(false);
        return;
      }
      payload.aws_access_key_id = accessKeyId.trim();
      payload.aws_secret_access_key = secretAccessKey.trim();
      if (sessionToken.trim()) {
        payload.aws_session_token = sessionToken.trim();
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/security/aws/validate-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setTestResult({
          valid: true,
          account_id: data.account_id,
          arn: data.arn,
          source: data.credential_source,
          message: `Connected successfully to AWS Account ${data.account_id}`,
        });
      } else {
        setTestResult({
          valid: false,
          message: data.detail || data.message || "AWS validation failed. Verify your access keys.",
        });
      }
    } catch (err) {
      setTestResult({
        valid: false,
        message: err.message || "Network error while connecting to backend verification endpoint.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClearCredentials = () => {
    setAccessKeyId("");
    setSecretAccessKey("");
    setSessionToken("");
    setUseServerDefaults(true);
    setTestResult(null);
    if (updateAwsCredentials) {
      updateAwsCredentials({
        accessKeyId: "",
        secretAccessKey: "",
        sessionToken: "",
        region: "ap-south-1",
        useServerDefaults: true,
        accountId: null,
        arn: null,
      });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ============================================================
  // DERIVED METRICS & FILTERED DATA
  // ============================================================
  const score = securityData?.security_score ?? 100;
  const riskLevel = securityData?.risk_level ?? "Low";
  const instances = securityData?.instances ?? [];
  const findings = securityData?.findings ?? [];
  const securityGroups = securityData?.security_groups ?? [];
  const compliance = securityData?.compliance_pillars ?? {
    network_security: 100,
    data_protection: 100,
    identity_access: 100,
    host_hardening: 100,
    overall_average: 100,
  };
  const portExposure = securityData?.port_exposure ?? {
    ssh_22: 0,
    rdp_3389: 0,
    all_traffic: 0,
    databases: 0,
  };

  // Filter instances
  const filteredInstances = useMemo(() => {
    return instances.filter((inst) => {
      // Search
      const searchTarget = `${inst.name} ${inst.id} ${inst.public_ip || ""} ${inst.private_ip || ""} ${inst.instance_type || ""}`.toLowerCase();
      if (instanceSearch && !searchTarget.includes(instanceSearch.toLowerCase())) {
        return false;
      }
      // Filter
      if (instanceFilter === "running") return inst.state === "running";
      if (instanceFilter === "public") return Boolean(inst.public_ip);
      if (instanceFilter === "at_risk") return inst.risk_level === "High" || inst.risk_level === "Critical";
      if (instanceFilter === "unencrypted") return inst.unencrypted_volumes_count > 0;
      return true;
    });
  }, [instances, instanceSearch, instanceFilter]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (findingSeverityFilter !== "all" && f.severity !== findingSeverityFilter) return false;
      if (findingCategoryFilter !== "all" && f.category !== findingCategoryFilter) return false;
      return true;
    });
  }, [findings, findingSeverityFilter, findingCategoryFilter]);

  // Categories list
  const findingCategories = useMemo(() => {
    const cats = new Set(findings.map((f) => f.category));
    return Array.from(cats);
  }, [findings]);

  // Grade helper
  const getSecurityGrade = (val) => {
    if (val >= 90) return { grade: "A+", desc: "Excellent", class: "grade-a" };
    if (val >= 75) return { grade: "B", desc: "Good", class: "grade-b" };
    if (val >= 50) return { grade: "C", desc: "Moderate Risk", class: "grade-c" };
    return { grade: "F", desc: "Critical Risk", class: "grade-f" };
  };

  const gradeInfo = getSecurityGrade(score);

  return (
    <div className="security-page-v2">
      {/* =======================================================
          TOP BAR & CREDENTIALS BANNER
      ======================================================= */}
      <div className="security-top-badge-bar">
        <div className="security-conn-indicator">
          <span className={`live-pulse-dot ${useServerDefaults ? "server-mode" : "custom-mode"}`}></span>
          <span className="conn-text">
            {useServerDefaults ? (
              <>
                <strong>AWS Identity:</strong>{" "}
                {securityData?.account_id ? `Account ${securityData.account_id}` : "Server Defaults (.env)"}
              </>
            ) : (
              <>
                <strong>Custom AWS Credentials:</strong>{" "}
                {accessKeyId ? `${accessKeyId.slice(0, 7)}••••••••` : "Not Configured"}
              </>
            )}
          </span>
          {securityData?.region && <span className="region-chip">🌍 {securityData.region}</span>}
        </div>

        <div className="security-top-actions">
          <select
            className="security-region-select"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              runSecurityScan(e.target.value);
            }}
          >
            {AWS_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} ({r.label.split(" - ")[0]})
              </option>
            ))}
          </select>

          <button
            className="btn-sec-creds"
            onClick={() => setShowCredsDrawer((prev) => !prev)}
            title="Configure AWS Access Keys"
          >
            <span className="btn-icon">🔑</span>
            <span>{showCredsDrawer ? "Close AWS Keys" : "AWS Access Keys"}</span>
          </button>

          <button
            className="btn-sec-scan"
            onClick={() => runSecurityScan()}
            disabled={scanning}
          >
            <span className={`btn-icon ${scanning ? "spin" : ""}`}>↻</span>
            <span>{scanning ? "Scanning AWS..." : "Run Security Scan"}</span>
          </button>
        </div>
      </div>

      {/* =======================================================
          AWS CREDENTIALS CONFIGURATION DRAWER / MODAL
      ======================================================= */}
      {showCredsDrawer && (
        <div className="security-creds-drawer">
          <div className="creds-drawer-header">
            <div>
              <h3>AWS Credentials Configuration</h3>
              <p>Provide your AWS Access Key to scan EC2 instances and analyze cloud security posture.</p>
            </div>
            <button className="btn-close-drawer" onClick={() => setShowCredsDrawer(false)}>
              ✕
            </button>
          </div>

          <div className="creds-drawer-body">
            <div className="creds-mode-toggle">
              <label className={`mode-pill ${useServerDefaults ? "active" : ""}`}>
                <input
                  type="radio"
                  name="creds-mode"
                  checked={useServerDefaults}
                  onChange={() => setUseServerDefaults(true)}
                />
                Use Server Default Credentials (.env)
              </label>

              <label className={`mode-pill ${!useServerDefaults ? "active" : ""}`}>
                <input
                  type="radio"
                  name="creds-mode"
                  checked={!useServerDefaults}
                  onChange={() => setUseServerDefaults(false)}
                />
                Enter Custom AWS Access Key & Secret
              </label>
            </div>

            {!useServerDefaults && (
              <div className="creds-form-grid">
                <div className="form-field">
                  <label>AWS Access Key ID</label>
                  <input
                    type="text"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={accessKeyId}
                    onChange={(e) => setAccessKeyId(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <small>Requires SecurityAudit or EC2 ReadOnly permissions.</small>
                </div>

                <div className="form-field">
                  <label>AWS Secret Access Key</label>
                  <div className="input-with-eye">
                    <input
                      type={showSecret ? "text" : "password"}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={secretAccessKey}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="btn-toggle-eye"
                      onClick={() => setShowSecret((v) => !v)}
                    >
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small>Never shared externally; sent only to your local backend.</small>
                </div>

                <div className="form-field full-width">
                  <label>AWS Session Token (Optional)</label>
                  <input
                    type="text"
                    placeholder="Required only for temporary STS credentials / AWS Academy / Learner Lab"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="form-field">
                  <label>Default AWS Region</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    {AWS_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field flex-center">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberCreds}
                      onChange={(e) => setRememberCreds(e.target.checked)}
                    />
                    Remember credentials in browser storage
                  </label>
                </div>
              </div>
            )}

            {testResult && (
              <div className={`creds-test-banner ${testResult.valid ? "success" : "error"}`}>
                <span className="test-status-icon">{testResult.valid ? "✓" : "!"}</span>
                <div>
                  <strong>{testResult.valid ? "AWS Connection Verified" : "Authentication Error"}</strong>
                  <p>{testResult.message}</p>
                  {testResult.arn && <code>{testResult.arn}</code>}
                </div>
              </div>
            )}

            <div className="creds-actions">
              <button
                className="btn-secondary"
                onClick={testAwsCredentials}
                disabled={testingConnection}
              >
                {testingConnection ? "Verifying..." : "⚡ Test AWS Connection"}
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  runSecurityScan();
                  setShowCredsDrawer(false);
                }}
                disabled={scanning}
              >
                💾 Save & Run Audit Now
              </button>

              {!useServerDefaults && (
                <button className="btn-ghost danger" onClick={handleClearCredentials}>
                  Clear Keys
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PAGE HEADER
      ======================================================= */}
      <div className="sec-page-header">
        <div>
          <span className="sec-eyebrow">AWS SECURITY AUDIT & ANALYTICS</span>
          <h1>Cloud Infrastructure Security Center</h1>
          <p>
            Real-time vulnerability assessment, EC2 instance posture, network exposure analytics, and automated
            remediation.
          </p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="sec-error-banner">
          <div className="error-icon">⚠️</div>
          <div>
            <strong>AWS Security Scan Error</strong>
            <p>{error}</p>
          </div>
          <button className="btn-retry" onClick={() => runSecurityScan()}>
            Retry Scan
          </button>
        </div>
      )}

      {/* =======================================================
          EXECUTIVE SECURITY SCORE & KPI BAR
      ======================================================= */}
      <div className="sec-kpi-grid">
        {/* SCORE GAUGE */}
        <div className={`sec-score-card ${gradeInfo.class}`}>
          <div className="score-ring-container">
            <svg className="score-svg" viewBox="0 0 100 100">
              <circle className="score-bg-circle" cx="50" cy="50" r="42" />
              <circle
                className="score-progress-circle"
                cx="50"
                cy="50"
                r="42"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * Math.max(0, Math.min(100, score))) / 100}
              />
            </svg>
            <div className="score-content">
              <span className="score-number">{score}</span>
              <span className="score-max">/100</span>
            </div>
          </div>

          <div className="score-details">
            <div className="grade-badge">{gradeInfo.grade}</div>
            <h3>{gradeInfo.desc}</h3>
            <span className="risk-level-tag">Risk Level: {riskLevel}</span>
            <p>Calculated across network, storage, IAM, and host posture checks.</p>
          </div>
        </div>

        {/* STAT 1: INSTANCES AUDITED */}
        <div className="sec-stat-card">
          <div className="stat-header">
            <span>EC2 INSTANCES</span>
            <span className="stat-icon">🖥️</span>
          </div>
          <div className="stat-value">{securityData?.total_instances ?? 0}</div>
          <div className="stat-meta">
            <span className="tag-running">{securityData?.running_instances ?? 0} Running</span>
            <span className="tag-stopped">{securityData?.stopped_instances ?? 0} Stopped</span>
          </div>
        </div>

        {/* STAT 2: CRITICAL & HIGH FINDINGS */}
        <div className="sec-stat-card danger">
          <div className="stat-header">
            <span>HIGH / CRITICAL RISKS</span>
            <span className="stat-icon">🚨</span>
          </div>
          <div className="stat-value text-red">
            {(securityData?.severity_breakdown?.critical ?? 0) + (securityData?.severity_breakdown?.high ?? 0)}
          </div>
          <div className="stat-meta">
            <span className="tag-critical">{securityData?.severity_breakdown?.critical ?? 0} Critical</span>
            <span className="tag-high">{securityData?.severity_breakdown?.high ?? 0} High</span>
          </div>
        </div>

        {/* STAT 3: PUBLIC EXPOSURE */}
        <div className="sec-stat-card warning">
          <div className="stat-header">
            <span>PUBLIC IP EXPOSURE</span>
            <span className="stat-icon">🌐</span>
          </div>
          <div className="stat-value text-amber">{securityData?.public_instances ?? 0}</div>
          <div className="stat-meta">
            <span>Directly Internet-facing</span>
          </div>
        </div>

        {/* STAT 4: UNENCRYPTED VOLUMES */}
        <div className="sec-stat-card warning">
          <div className="stat-header">
            <span>UNENCRYPTED EBS VOLUMES</span>
            <span className="stat-icon">💾</span>
          </div>
          <div className="stat-value text-amber">{securityData?.unencrypted_volumes_count ?? 0}</div>
          <div className="stat-meta">
            <span>Data-at-rest unencrypted</span>
          </div>
        </div>
      </div>

      {/* =======================================================
          TAB NAVIGATION
      ======================================================= */}
      <div className="sec-tab-nav">
        <button
          className={`sec-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <span className="tab-icon">📊</span>
          <span>Security Posture & Analytics</span>
        </button>

        <button
          className={`sec-tab-btn ${activeTab === "instances" ? "active" : ""}`}
          onClick={() => setActiveTab("instances")}
        >
          <span className="tab-icon">🖥️</span>
          <span>Instance Inventory ({instances.length})</span>
        </button>

        <button
          className={`sec-tab-btn ${activeTab === "findings" ? "active" : ""}`}
          onClick={() => setActiveTab("findings")}
        >
          <span className="tab-icon">⚠️</span>
          <span>Vulnerability Findings ({findings.length})</span>
        </button>

        <button
          className={`sec-tab-btn ${activeTab === "security_groups" ? "active" : ""}`}
          onClick={() => setActiveTab("security_groups")}
        >
          <span className="tab-icon">🛡️</span>
          <span>Security Groups & Ports ({securityGroups.length})</span>
        </button>

        <button
          className={`sec-tab-btn ${activeTab === "credentials" ? "active" : ""}`}
          onClick={() => setActiveTab("credentials")}
        >
          <span className="tab-icon">🔑</span>
          <span>AWS Credentials</span>
        </button>
      </div>

      {/* =======================================================
          TAB 1: POSTURE & ANALYTICS
      ======================================================= */}
      {activeTab === "analytics" && (
        <div className="sec-tab-content">
          {/* COMPLIANCE PILLARS */}
          <div className="sec-panel">
            <div className="panel-title-row">
              <div>
                <h2>AWS Well-Architected Security Pillars</h2>
                <p>Compliance score based on CIS AWS Foundations and AWS Security Best Practices</p>
              </div>
              <span className="compliance-avg-chip">
                Average Compliance: {compliance.overall_average}%
              </span>
            </div>

            <div className="pillars-grid">
              {/* Pillar 1: Network */}
              <div className="pillar-item">
                <div className="pillar-header">
                  <span className="pillar-name">Network Exposure</span>
                  <span className={`pillar-score ${compliance.network_security < 80 ? "warn" : "good"}`}>
                    {compliance.network_security}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{ width: `${compliance.network_security}%` }}
                  ></div>
                </div>
                <p>Public IP separation, perimeter security, and open CIDR restriction</p>
              </div>

              {/* Pillar 2: Storage */}
              <div className="pillar-item">
                <div className="pillar-header">
                  <span className="pillar-name">Data Encryption</span>
                  <span className={`pillar-score ${compliance.data_protection < 80 ? "warn" : "good"}`}>
                    {compliance.data_protection}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{ width: `${compliance.data_protection}%` }}
                  ></div>
                </div>
                <p>EBS volume KMS encryption at rest and snapshot hygiene</p>
              </div>

              {/* Pillar 3: IAM */}
              <div className="pillar-item">
                <div className="pillar-header">
                  <span className="pillar-name">Identity & Access</span>
                  <span className={`pillar-score ${compliance.identity_access < 80 ? "warn" : "good"}`}>
                    {compliance.identity_access}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{ width: `${compliance.identity_access}%` }}
                  ></div>
                </div>
                <p>EC2 instance IAM profile attachments and least privilege roles</p>
              </div>

              {/* Pillar 4: Host Hardening */}
              <div className="pillar-item">
                <div className="pillar-header">
                  <span className="pillar-name">Host & Metadata Hardening</span>
                  <span className={`pillar-score ${compliance.host_hardening < 80 ? "warn" : "good"}`}>
                    {compliance.host_hardening}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{ width: `${compliance.host_hardening}%` }}
                  ></div>
                </div>
                <p>IMDSv2 enforcement (SSRF protection) and detailed CloudWatch monitoring</p>
              </div>
            </div>
          </div>

          {/* ATTACK SURFACE PORT RADAR & SEVERITY BREAKDOWN */}
          <div className="sec-two-column-grid">
            {/* Attack Surface */}
            <div className="sec-panel">
              <div className="panel-title-row">
                <div>
                  <h2>Attack Surface & Exposed Ports</h2>
                  <p>Inbound ports with unrestricted 0.0.0.0/0 exposure</p>
                </div>
              </div>

              <div className="radar-list">
                <div className={`radar-item ${portExposure.ssh_22 > 0 ? "danger" : "safe"}`}>
                  <div className="radar-status-dot"></div>
                  <div className="radar-info">
                    <strong>SSH (Port 22)</strong>
                    <span>Secure Shell remote administration</span>
                  </div>
                  <span className="radar-badge">
                    {portExposure.ssh_22 > 0 ? `${portExposure.ssh_22} Instance(s) Exposed` : "Protected"}
                  </span>
                </div>

                <div className={`radar-item ${portExposure.rdp_3389 > 0 ? "danger" : "safe"}`}>
                  <div className="radar-status-dot"></div>
                  <div className="radar-info">
                    <strong>RDP (Port 3389)</strong>
                    <span>Windows Remote Desktop Protocol</span>
                  </div>
                  <span className="radar-badge">
                    {portExposure.rdp_3389 > 0 ? `${portExposure.rdp_3389} Instance(s) Exposed` : "Protected"}
                  </span>
                </div>

                <div className={`radar-item ${portExposure.all_traffic > 0 ? "critical" : "safe"}`}>
                  <div className="radar-status-dot"></div>
                  <div className="radar-info">
                    <strong>All Inbound Traffic (-1)</strong>
                    <span>Any protocol, any port open to world</span>
                  </div>
                  <span className="radar-badge">
                    {portExposure.all_traffic > 0 ? `${portExposure.all_traffic} SG(s) Open` : "Protected"}
                  </span>
                </div>

                <div className={`radar-item ${portExposure.databases > 0 ? "critical" : "safe"}`}>
                  <div className="radar-status-dot"></div>
                  <div className="radar-info">
                    <strong>Database Ports (3306, 5432, etc.)</strong>
                    <span>MySQL, PostgreSQL, MongoDB, Redis</span>
                  </div>
                  <span className="radar-badge">
                    {portExposure.databases > 0 ? `${portExposure.databases} Instance(s) Exposed` : "Protected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Severity Distribution & Summary */}
            <div className="sec-panel">
              <div className="panel-title-row">
                <div>
                  <h2>Executive Audit Summary</h2>
                  <p>Aggregated posture breakdown for {securityData?.region}</p>
                </div>
                <span className="ai-ready-badge">✦ AI AUDIT</span>
              </div>

              <div className="summary-box">
                <p className="summary-text">{securityData?.summary || "No active findings."}</p>
              </div>

              <div className="severity-bar-container">
                <div className="severity-bar-labels">
                  <span>Critical: {securityData?.severity_breakdown?.critical ?? 0}</span>
                  <span>High: {securityData?.severity_breakdown?.high ?? 0}</span>
                  <span>Medium: {securityData?.severity_breakdown?.medium ?? 0}</span>
                  <span>Low: {securityData?.severity_breakdown?.low ?? 0}</span>
                </div>
                <div className="multi-color-bar">
                  <div
                    className="bar-seg critical"
                    style={{
                      width: `${findings.length ? ((securityData?.severity_breakdown?.critical ?? 0) / findings.length) * 100 : 0}%`,
                    }}
                  ></div>
                  <div
                    className="bar-seg high"
                    style={{
                      width: `${findings.length ? ((securityData?.severity_breakdown?.high ?? 0) / findings.length) * 100 : 0}%`,
                    }}
                  ></div>
                  <div
                    className="bar-seg medium"
                    style={{
                      width: `${findings.length ? ((securityData?.severity_breakdown?.medium ?? 0) / findings.length) * 100 : 0}%`,
                    }}
                  ></div>
                  <div
                    className="bar-seg low"
                    style={{
                      width: `${findings.length ? ((securityData?.severity_breakdown?.low ?? 0) / findings.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="quick-stats-row">
                <div>
                  <span>Scanned Account</span>
                  <strong>{securityData?.account_id || "Connected"}</strong>
                </div>
                <div>
                  <span>Security Groups</span>
                  <strong>{securityData?.security_groups_count || 0}</strong>
                </div>
                <div>
                  <span>Last Audit</span>
                  <strong>
                    {securityData?.scan_timestamp
                      ? new Date(securityData.scan_timestamp).toLocaleTimeString()
                      : "Just now"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 2: INSTANCE INVENTORY
      ======================================================= */}
      {activeTab === "instances" && (
        <div className="sec-tab-content">
          <div className="sec-panel">
            <div className="panel-header-controls">
              <div className="search-bar-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search instances by name, ID, IP, or type..."
                  value={instanceSearch}
                  onChange={(e) => setInstanceSearch(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                <button
                  className={`pill-btn ${instanceFilter === "all" ? "active" : ""}`}
                  onClick={() => setInstanceFilter("all")}
                >
                  All ({instances.length})
                </button>
                <button
                  className={`pill-btn ${instanceFilter === "running" ? "active" : ""}`}
                  onClick={() => setInstanceFilter("running")}
                >
                  Running ({instances.filter((i) => i.state === "running").length})
                </button>
                <button
                  className={`pill-btn ${instanceFilter === "public" ? "active" : ""}`}
                  onClick={() => setInstanceFilter("public")}
                >
                  Public IPs ({instances.filter((i) => i.public_ip).length})
                </button>
                <button
                  className={`pill-btn ${instanceFilter === "at_risk" ? "active" : ""}`}
                  onClick={() => setInstanceFilter("at_risk")}
                >
                  At Risk ({instances.filter((i) => i.risk_level === "High" || i.risk_level === "Critical").length})
                </button>
                <button
                  className={`pill-btn ${instanceFilter === "unencrypted" ? "active" : ""}`}
                  onClick={() => setInstanceFilter("unencrypted")}
                >
                  Unencrypted Storage ({instances.filter((i) => i.unencrypted_volumes_count > 0).length})
                </button>
              </div>
            </div>

            {filteredInstances.length === 0 ? (
              <div className="sec-empty-state">
                <div className="empty-icon">🖥️</div>
                <h3>No Instances Match Your Criteria</h3>
                <p>
                  {instances.length === 0
                    ? `No EC2 instances were found in AWS region '${securityData?.region || region}'. Switch regions or verify your AWS credentials.`
                    : "Try adjusting your search query or filter tags."}
                </p>
                {instances.length === 0 && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setRegion("us-east-1");
                      runSecurityScan("us-east-1");
                    }}
                  >
                    Scan us-east-1 (N. Virginia)
                  </button>
                )}
              </div>
            ) : (
              <div className="instances-list">
                {filteredInstances.map((inst) => (
                  <div
                    key={inst.id}
                    className={`instance-card ${expandedInstanceId === inst.id ? "expanded" : ""}`}
                  >
                    <div
                      className="instance-card-summary"
                      onClick={() =>
                        setExpandedInstanceId(expandedInstanceId === inst.id ? null : inst.id)
                      }
                    >
                      <div className="instance-main-col">
                        <div className="instance-name-row">
                          <span className={`state-indicator ${inst.state}`}></span>
                          <strong>{inst.name}</strong>
                          <code className="inst-id-badge">{inst.id}</code>
                          <span className="inst-type-badge">{inst.instance_type}</span>
                        </div>
                        <div className="instance-meta-row">
                          <span>
                            Private: <code>{inst.private_ip || "None"}</code>
                          </span>
                          {inst.public_ip ? (
                            <span className="text-red">
                              Public: <strong>{inst.public_ip}</strong> ⚠️
                            </span>
                          ) : (
                            <span className="text-muted">Public: None (Private Subnet)</span>
                          )}
                          <span>AZ: {inst.availability_zone}</span>
                          <span>VPC: {inst.vpc_id}</span>
                        </div>
                      </div>

                      <div className="instance-security-tags">
                        {/* Storage encryption */}
                        <span
                          className={`sec-tag ${inst.unencrypted_volumes_count > 0 ? "warn" : "good"}`}
                          title="EBS Volume Encryption"
                        >
                          💾 {inst.unencrypted_volumes_count > 0 ? `${inst.unencrypted_volumes_count} Unencrypted` : "Encrypted"}
                        </span>

                        {/* IMDSv2 */}
                        <span
                          className={`sec-tag ${inst.imdsv2_enforced ? "good" : "warn"}`}
                          title="IMDSv2 SSRF Protection"
                        >
                          🛡️ {inst.imdsv2_enforced ? "IMDSv2" : "IMDSv1 Vulnerable"}
                        </span>

                        {/* IAM Role */}
                        <span
                          className={`sec-tag ${inst.iam_profile ? "good" : "muted"}`}
                          title="IAM Instance Profile"
                        >
                          👤 {inst.iam_profile ? "IAM Attached" : "No Role"}
                        </span>

                        {/* Risk level badge */}
                        <span className={`risk-badge ${inst.risk_level.toLowerCase()}`}>
                          {inst.risk_level} Risk ({inst.risk_score}/100)
                        </span>

                        <button className="btn-expand-arrow">
                          {expandedInstanceId === inst.id ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {expandedInstanceId === inst.id && (
                      <div className="instance-expanded-details">
                        <div className="expanded-section">
                          <h4>Attached Security Groups ({inst.security_groups.length})</h4>
                          <div className="sgs-chip-wrap">
                            {inst.security_groups.map((sg) => (
                              <div
                                key={sg.id}
                                className={`sg-chip ${sg.is_risky ? "risky" : "clean"}`}
                              >
                                <strong>{sg.name}</strong>
                                <code>{sg.id}</code>
                                {sg.is_risky && (
                                  <span className="risk-warning-badge">⚠️ Open Ports</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="expanded-section">
                          <h4>EBS Storage Volumes ({inst.volumes.length})</h4>
                          <div className="volumes-table">
                            {inst.volumes.map((vol) => (
                              <div key={vol.volume_id} className="vol-row">
                                <code>{vol.volume_id}</code>
                                <span>{vol.device_name}</span>
                                <span>{vol.size_gb ? `${vol.size_gb} GB` : "EBS"}</span>
                                <span className={vol.encrypted ? "text-green" : "text-red"}>
                                  {vol.encrypted ? "✓ Encrypted (KMS)" : "✗ Unencrypted"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {inst.findings.length > 0 && (
                          <div className="expanded-section">
                            <h4>Instance Findings ({inst.findings.length})</h4>
                            <div className="inst-findings-list">
                              {inst.findings.map((f, idx) => (
                                <div key={idx} className={`inst-finding-item ${f.severity.toLowerCase()}`}>
                                  <div className="f-header">
                                    <span className={`f-sev-badge ${f.severity.toLowerCase()}`}>
                                      {f.severity}
                                    </span>
                                    <strong>{f.title}</strong>
                                  </div>
                                  <p>{f.description}</p>
                                  {f.remediation_cli && (
                                    <div className="cli-snippet">
                                      <code>{f.remediation_cli}</code>
                                      <button
                                        onClick={() => copyToClipboard(f.remediation_cli, f.id)}
                                      >
                                        {copiedId === f.id ? "✓ Copied" : "Copy CLI"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 3: FINDINGS & REMEDIATION
      ======================================================= */}
      {activeTab === "findings" && (
        <div className="sec-tab-content">
          <div className="sec-panel">
            <div className="panel-header-controls">
              <div className="filter-group">
                <label>Severity:</label>
                <select
                  value={findingSeverityFilter}
                  onChange={(e) => setFindingSeverityFilter(e.target.value)}
                >
                  <option value="all">All Severities ({findings.length})</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {findingCategories.length > 0 && (
                <div className="filter-group">
                  <label>Category:</label>
                  <select
                    value={findingCategoryFilter}
                    onChange={(e) => setFindingCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {findingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {filteredFindings.length === 0 ? (
              <div className="sec-empty-state">
                <div className="empty-icon text-green">✓</div>
                <h3>No Security Findings Detected</h3>
                <p>
                  {findings.length === 0
                    ? "Your AWS infrastructure scan did not detect any security vulnerabilities."
                    : "No findings match your selected severity and category filters."}
                </p>
              </div>
            ) : (
              <div className="findings-full-list">
                {filteredFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className={`finding-card-v2 ${finding.severity.toLowerCase()}`}
                  >
                    <div className="finding-header-v2">
                      <div className="finding-badge-wrap">
                        <span className={`sev-tag ${finding.severity.toLowerCase()}`}>
                          {finding.severity}
                        </span>
                        <span className="cat-tag">{finding.category}</span>
                      </div>
                      <span className="finding-id-tag">{finding.id}</span>
                    </div>

                    <h3 className="finding-title-v2">{finding.title}</h3>

                    <div className="finding-resource-v2">
                      <span>Affected Resource:</span>
                      <code>{finding.resource}</code>
                      {finding.resource_name && finding.resource_name !== finding.resource && (
                        <span className="res-name">({finding.resource_name})</span>
                      )}
                    </div>

                    <p className="finding-desc-v2">{finding.description}</p>

                    <div className="remediation-box">
                      <div className="remediation-head">
                        <span className="remediation-icon">💡</span>
                        <strong>Remediation Recommendation</strong>
                      </div>
                      <p>{finding.recommendation}</p>

                      {finding.remediation_cli && (
                        <div className="cli-block">
                          <div className="cli-block-head">
                            <span>AWS CLI Fix Command</span>
                            <button
                              className="btn-copy-cli"
                              onClick={() => copyToClipboard(finding.remediation_cli, finding.id)}
                            >
                              {copiedId === finding.id ? "✓ Copied!" : "📋 Copy Command"}
                            </button>
                          </div>
                          <code>{finding.remediation_cli}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 4: SECURITY GROUPS & PORTS
      ======================================================= */}
      {activeTab === "security_groups" && (
        <div className="sec-tab-content">
          <div className="sec-panel">
            <div className="panel-title-row">
              <div>
                <h2>Security Groups & Inbound Rules Inspection</h2>
                <p>Auditing network firewalls and ingress exposure to public CIDR blocks</p>
              </div>
              <span className="sg-count-badge">{securityGroups.length} Security Groups Analyzed</span>
            </div>

            {securityGroups.length === 0 ? (
              <div className="sec-empty-state">
                <div className="empty-icon">🛡️</div>
                <h3>No Security Groups Found</h3>
                <p>No security groups were retrieved for this region.</p>
              </div>
            ) : (
              <div className="sg-grid">
                {securityGroups.map((sg) => (
                  <div key={sg.group_id} className={`sg-card ${sg.is_risky ? "risky" : "safe"}`}>
                    <div className="sg-card-header">
                      <div>
                        <strong>{sg.group_name}</strong>
                        <code>{sg.group_id}</code>
                      </div>
                      <span className={`sg-status-badge ${sg.is_risky ? "danger" : "pass"}`}>
                        {sg.is_risky ? "⚠️ Risky Rules" : "✓ Clean"}
                      </span>
                    </div>

                    {sg.description && <p className="sg-desc">{sg.description}</p>}

                    {sg.is_risky && sg.risks && (
                      <div className="sg-risks-callout">
                        {sg.risks.map((r, i) => (
                          <div key={i} className="sg-risk-point">
                            <span>!</span>
                            <p>{r.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="sg-rules-table">
                      <div className="rules-head">
                        <span>Protocol</span>
                        <span>Port Range</span>
                        <span>Source CIDR</span>
                      </div>
                      {sg.ip_permissions.length === 0 ? (
                        <div className="no-rules">No inbound rules defined (default deny).</div>
                      ) : (
                        sg.ip_permissions.map((rule, idx) => (
                          <div key={idx} className="rule-row">
                            <span>{rule.protocol === "-1" ? "ALL" : rule.protocol.toUpperCase()}</span>
                            <span>
                              {rule.from_port === rule.to_port
                                ? rule.from_port ?? "ALL"
                                : `${rule.from_port} - ${rule.to_port}`}
                            </span>
                            <div>
                              {rule.ip_ranges.length > 0 ? (
                                rule.ip_ranges.map((cidr, ci) => (
                                  <span
                                    key={ci}
                                    className={`cidr-tag ${cidr === "0.0.0.0/0" ? "world-open" : ""}`}
                                  >
                                    {cidr}
                                    {cidr === "0.0.0.0/0" && " (WORLD)"}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted">Security Group Ref</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 5: AWS CREDENTIALS & SETTINGS
      ======================================================= */}
      {activeTab === "credentials" && (
        <div className="sec-tab-content">
          <div className="sec-panel">
            <div className="panel-title-row">
              <div>
                <h2>AWS Credentials & Access Key Management</h2>
                <p>Configure access keys to scan your EC2 infrastructure directly.</p>
              </div>
            </div>

            <div className="creds-settings-box">
              <div className="creds-mode-selector">
                <div
                  className={`mode-card ${useServerDefaults ? "selected" : ""}`}
                  onClick={() => setUseServerDefaults(true)}
                >
                  <div className="mode-radio">
                    <span className="dot"></span>
                  </div>
                  <div>
                    <strong>Use Server Environment (.env)</strong>
                    <p>Uses credentials pre-configured in the backend environment.</p>
                  </div>
                </div>

                <div
                  className={`mode-card ${!useServerDefaults ? "selected" : ""}`}
                  onClick={() => setUseServerDefaults(false)}
                >
                  <div className="mode-radio">
                    <span className="dot"></span>
                  </div>
                  <div>
                    <strong>Custom AWS Access Key</strong>
                    <p>Enter an IAM Access Key ID and Secret Access Key for on-demand scanning.</p>
                  </div>
                </div>
              </div>

              {!useServerDefaults && (
                <div className="custom-keys-form">
                  <div className="form-group">
                    <label>AWS Access Key ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>AWS Secret Access Key</label>
                    <div className="input-with-eye">
                      <input
                        type={showSecret ? "text" : "password"}
                        className="form-input"
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        value={secretAccessKey}
                        onChange={(e) => setSecretAccessKey(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-toggle-eye"
                        onClick={() => setShowSecret((s) => !s)}
                      >
                        {showSecret ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>AWS Session Token (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional STS temporary session token"
                      value={sessionToken}
                      onChange={(e) => setSessionToken(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>AWS Region</label>
                    <select
                      className="form-input"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      {AWS_REGIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="remember-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={rememberCreds}
                        onChange={(e) => setRememberCreds(e.target.checked)}
                      />
                      Persist credentials in local storage
                    </label>
                  </div>
                </div>
              )}

              {testResult && (
                <div className={`creds-test-banner ${testResult.valid ? "success" : "error"}`}>
                  <span className="test-status-icon">{testResult.valid ? "✓" : "!"}</span>
                  <div>
                    <strong>{testResult.valid ? "Connection Successful" : "Connection Error"}</strong>
                    <p>{testResult.message}</p>
                    {testResult.arn && <code>{testResult.arn}</code>}
                  </div>
                </div>
              )}

              <div className="creds-btn-row">
                <button
                  className="btn-primary"
                  onClick={() => {
                    runSecurityScan();
                    setActiveTab("analytics");
                  }}
                  disabled={scanning}
                >
                  {scanning ? "Scanning..." : "💾 Save & Execute Audit"}
                </button>

                <button
                  className="btn-secondary"
                  onClick={testAwsCredentials}
                  disabled={testingConnection}
                >
                  {testingConnection ? "Testing..." : "⚡ Test Credentials"}
                </button>

                {!useServerDefaults && (
                  <button className="btn-ghost danger" onClick={handleClearCredentials}>
                    Clear Saved Credentials
                  </button>
                )}
              </div>

              <div className="security-notice-card">
                <h4>🔒 Security & Privacy Notice</h4>
                <p>
                  CloudMind only executes read operations (such as <code>ec2:DescribeInstances</code>,{" "}
                  <code>ec2:DescribeSecurityGroups</code>, and <code>ec2:DescribeVolumes</code>).
                  It never makes changes or deletes resources. To follow AWS best practices, assign
                  the <code>SecurityAudit</code> or <code>ReadOnlyAccess</code> managed IAM policy to your IAM user.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Security;