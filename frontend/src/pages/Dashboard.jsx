import { useEffect, useState } from "react";

import { supabase } from "../utils/supabase";


const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

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


function Dashboard({ setActivePage, awsCredentials, updateAwsCredentials }) {

  // ==========================================
  // AWS GLOBAL CREDENTIALS STATE (APPLIED APP-WIDE)
  // ==========================================
  const [inputAccessKey, setInputAccessKey] = useState(
    awsCredentials?.accessKeyId || ""
  );
  const [inputSecretKey, setInputSecretKey] = useState(
    awsCredentials?.secretAccessKey || ""
  );
  const [inputSessionToken, setInputSessionToken] = useState(
    awsCredentials?.sessionToken || ""
  );
  const [inputRegion, setInputRegion] = useState(
    awsCredentials?.region || "ap-south-1"
  );
  const [inputUseServer, setInputUseServer] = useState(
    awsCredentials?.useServerDefaults ?? true
  );
  const [showSecret, setShowSecret] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [showCredsCard, setShowCredsCard] = useState(
    Boolean(!awsCredentials?.accountId && !awsCredentials?.accessKeyId)
  );

  useEffect(() => {
    if (awsCredentials) {
      setInputAccessKey(awsCredentials.accessKeyId || "");
      setInputSecretKey(awsCredentials.secretAccessKey || "");
      setInputSessionToken(awsCredentials.sessionToken || "");
      setInputRegion(awsCredentials.region || "ap-south-1");
      setInputUseServer(awsCredentials.useServerDefaults ?? true);
    }
  }, [awsCredentials]);

  const [showAddAccount, setShowAddAccount] =
    useState(false);

  const [selectedProvider, setSelectedProvider] =
    useState(null);

  const [accountName, setAccountName] =
    useState("");

  const [accountId, setAccountId] =
    useState("");

  const [region, setRegion] =
    useState("");

  const [savingAccount, setSavingAccount] =
    useState(false);

  const [accountError, setAccountError] =
    useState("");

  const [metrics, setMetrics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [metricsError, setMetricsError] =
    useState(false);

  const [timeRange, setTimeRange] =
    useState("Last 7 hours");


  // ==========================================
  // ADD CLOUD ACCOUNT
  // ==========================================

  const handleAddAccount = async () => {

    setAccountError("");

    if (!selectedProvider) {

      setAccountError(
        "Please select a cloud provider."
      );

      return;
    }

    if (!accountName.trim()) {

      setAccountError(
        "Please enter an account name."
      );

      return;
    }

    setSavingAccount(true);

    try {

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {

        throw new Error(
          "You must be logged in."
        );
      }

      const { error } = await supabase
        .from("cloud_accounts")
        .insert({
          user_id: user.id,
          provider: selectedProvider,
          account_name: accountName.trim(),
          account_id:
            accountId.trim() || null,
          region:
            region.trim() || null,
          status: "connected",
        });

      if (error) {
        throw error;
      }

      setSelectedProvider(null);
      setAccountName("");
      setAccountId("");
      setRegion("");

      setShowAddAccount(false);

      fetchMetrics();

    } catch (error) {

      console.error(
        "Add cloud account error:",
        error
      );

      setAccountError(
        error.message ||
        "Unable to add cloud account."
      );

    } finally {

      setSavingAccount(false);
    }
  };


  // ==========================================
  // FETCH REAL AWS METRICS
  // ==========================================

  const fetchMetrics = async (credsOverride = null) => {
    setMetricsError(false);
    setLoading(true);

    const activeCreds = credsOverride || awsCredentials;

    try {
      let response;
      if (activeCreds?.accessKeyId && !activeCreds?.useServerDefaults) {
        response = await fetch(`${API_BASE_URL}/api/metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aws_access_key_id: activeCreds.accessKeyId.trim(),
            aws_secret_access_key: activeCreds.secretAccessKey ? activeCreds.secretAccessKey.trim() : "",
            aws_session_token: activeCreds.sessionToken ? activeCreds.sessionToken.trim() : null,
            region: activeCreds.region || "ap-south-1",
          }),
        });
      } else {
        const reg = activeCreds?.region || "ap-south-1";
        response = await fetch(`${API_BASE_URL}/api/metrics?region=${encodeURIComponent(reg)}`);
      }

      if (!response.ok) {
        throw new Error("Unable to retrieve AWS metrics.");
      }

      const data = await response.json();
      console.log("Real AWS CloudWatch metrics:", data);
      setMetrics(data);
    } catch (error) {
      console.error("Metrics error:", error);
      setMetricsError(true);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // TEST AWS CREDENTIALS VIA STS
  // ==========================================

  const handleTestCredentials = async () => {
    setTestingConnection(true);
    setTestResult(null);
    setSaveSuccessMsg("");

    const payload = {
      region: inputRegion || "ap-south-1",
    };

    if (!inputUseServer) {
      if (!inputAccessKey.trim() || !inputSecretKey.trim()) {
        setTestResult({
          valid: false,
          message: "Please enter both AWS Access Key ID and Secret Access Key.",
        });
        setTestingConnection(false);
        return;
      }
      payload.aws_access_key_id = inputAccessKey.trim();
      payload.aws_secret_access_key = inputSecretKey.trim();
      if (inputSessionToken.trim()) {
        payload.aws_session_token = inputSessionToken.trim();
      }
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/security/aws/validate-credentials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok && data.valid) {
        setTestResult({
          valid: true,
          account_id: data.account_id,
          arn: data.arn,
          region: data.region || inputRegion,
          message: `Connected successfully to AWS Account ${data.account_id} (${data.region || inputRegion})`,
        });
      } else {
        setTestResult({
          valid: false,
          message:
            data.detail ||
            data.message ||
            "AWS verification failed. Verify your access keys.",
        });
      }
    } catch (err) {
      setTestResult({
        valid: false,
        message: err.message || "Network error connecting to verification endpoint.",
      });
    } finally {
      setTestingConnection(false);
    }
  };


  // ==========================================
  // SAVE & APPLY CREDENTIALS GLOBALLY
  // ==========================================

  const handleSaveCredentials = async () => {
    setSaveSuccessMsg("");

    const newCreds = {
      accessKeyId: inputAccessKey.trim(),
      secretAccessKey: inputSecretKey.trim(),
      sessionToken: inputSessionToken.trim(),
      region: inputRegion || "ap-south-1",
      useServerDefaults: inputUseServer,
      accountId: testResult?.account_id || awsCredentials?.accountId || null,
      arn: testResult?.arn || awsCredentials?.arn || null,
    };

    if (updateAwsCredentials) {
      updateAwsCredentials(newCreds);
    }

    setSaveSuccessMsg(
      "✓ AWS credentials saved and applied globally across all sidebar tabs!"
    );
    setTimeout(() => setSaveSuccessMsg(""), 6000);

    // Re-fetch metrics immediately with the new credentials
    await fetchMetrics(newCreds);
  };


  // ==========================================
  // RESET TO SERVER ENVIRONMENT DEFAULTS
  // ==========================================

  const handleResetToDefaults = async () => {
    const defaultCreds = {
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
      region: "ap-south-1",
      useServerDefaults: true,
      accountId: null,
      arn: null,
    };
    setInputAccessKey("");
    setInputSecretKey("");
    setInputSessionToken("");
    setInputRegion("ap-south-1");
    setInputUseServer(true);
    setTestResult(null);
    if (updateAwsCredentials) {
      updateAwsCredentials(defaultCreds);
    }
    setSaveSuccessMsg("Reset to default server environment credentials.");
    setTimeout(() => setSaveSuccessMsg(""), 4000);
    await fetchMetrics(defaultCreds);
  };


  // ==========================================
  // INITIAL LOAD + AUTO REFRESH + SYNC
  // ==========================================

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [awsCredentials]);


  // ==========================================
  // SAFE VALUES
  // ==========================================

  const cloudHealth =
    metrics?.cloud_health ?? 0;

  const monthlyCost =
    metrics?.monthly_cost;

  const energyEfficiency =
    metrics?.energy_efficiency ?? 0;

  const securityScore =
    metrics?.security_score;

  const cpuUsage =
    metrics?.cpu_usage ?? 0;

  const memoryUsage =
    metrics?.memory_usage;

  const networkUsage =
    metrics?.network_usage;

  const providers =
    metrics?.providers ?? {
      aws: 0,
      azure: 0,
      gcp: 0,
    };

  const infrastructure =
    metrics?.infrastructure ?? {
      compute: "Loading",
      database: "Not Monitored",
      network: "Not Monitored",
      security: "Not Monitored",
    };

  const cpuHistory =
    metrics?.history?.cpu ?? [];

  const awsInstances =
    metrics?.aws?.instances ??
    metrics?.servers ??
    [];

  const totalInstances =
    metrics?.total_servers ??
    0;

  const runningInstances =
    metrics?.running_servers ??
    0;

  const awsRegion =
    metrics?.region ??
    "Unknown";


  // ==========================================
  // NAVIGATION
  // ==========================================

  const goTo = (page) => {

    if (setActivePage) {

      setActivePage(page);

    }
  };


  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {

    if (status === "Healthy") {

      return "online";

    }

    return "warning-dot";
  };


  const getStatusTextClass = (status) => {

    if (status === "Healthy") {

      return "";

    }

    return "warning-text";
  };


  // ==========================================
  // RENDER CPU GRAPH
  // ==========================================

  const getGraphPoints = () => {

    if (!cpuHistory.length) {

      return "";
    }

    const width = 700;
    const height = 220;

    const max =
      Math.max(
        ...cpuHistory,
        100
      );

    const min = 0;

    return cpuHistory
      .map((value, index) => {

        const x =
          cpuHistory.length === 1
            ? width / 2
            : (
                index /
                (cpuHistory.length - 1)
              ) * width;

        const y =
          height -
          (
            (value - min) /
            (max - min)
          ) * height;

        return `${x},${y}`;

      })
      .join(" ");
  };


  const graphPoints =
    getGraphPoints();


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="dashboard-page">


      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            CLOUD INTELLIGENCE
          </span>

          <h1>
            Good evening 👋
          </h1>

          <p>
            Here's what's happening across
            your AWS infrastructure.
          </p>

        </div>


        <div className="dashboard-header-actions">

          <button
            className="secondary-button"
            onClick={fetchMetrics}
            disabled={loading}
          >

            {loading
              ? "Refreshing..."
              : "↻ Refresh"}

          </button>


          <button
            className="primary-button"
            onClick={() => {

              setAccountError("");
              setShowAddAccount(true);

            }}
          >

            + Add Cloud Account

          </button>

        </div>

      </div>


      {/* ======================================
          GLOBAL AWS CREDENTIALS CONTROL BAR
      ====================================== */}
      <div className="dashboard-aws-banner">
        <div className="dashboard-aws-banner-main">
          <div className="aws-banner-status">
            <span
              className={`aws-status-indicator ${
                awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults
                  ? "active"
                  : "default"
              }`}
            ></span>
            <div className="aws-banner-info">
              <div className="aws-banner-title-line">
                <strong>
                  {awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults
                    ? "Active Custom AWS IAM Connection"
                    : "Using Backend Server Environment (.env)"}
                </strong>
                <span className="aws-global-badge">GLOBAL (ALL TABS)</span>
              </div>
              <p>
                {awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults
                  ? `Access Key: ${awsCredentials.accessKeyId.slice(0, 4)}••••${awsCredentials.accessKeyId.slice(-4)} | Region: ${awsCredentials.region || "ap-south-1"} ${
                      awsCredentials.accountId ? `| Account: ${awsCredentials.accountId}` : ""
                    }`
                  : `Default cloud account credentials | Active Region: ${
                      awsCredentials?.region || "ap-south-1"
                    }`}
              </p>
            </div>
          </div>

          <div className="aws-banner-actions">
            <div className="banner-region-wrapper">
              <label>Region:</label>
              <select
                value={awsCredentials?.region || inputRegion}
                onChange={(e) => {
                  const newReg = e.target.value;
                  setInputRegion(newReg);
                  if (updateAwsCredentials) {
                    updateAwsCredentials({ region: newReg });
                  }
                }}
                className="banner-region-select"
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="secondary-button banner-btn"
              onClick={handleTestCredentials}
              disabled={testingConnection}
            >
              {testingConnection ? "Testing..." : "⚡ Quick Test"}
            </button>

            <button
              className={`primary-button banner-btn ${showCredsCard ? "active" : ""}`}
              onClick={() => setShowCredsCard((prev) => !prev)}
            >
              {showCredsCard ? "▲ Close AWS Keys" : "⚙ Configure AWS Keys"}
            </button>
          </div>
        </div>

        {/* Expandable Configuration Card */}
        {showCredsCard && (
          <div className="dashboard-creds-drawer">
            <div className="drawer-header">
              <div>
                <h3>Global AWS Cloud Access Configuration</h3>
                <p>
                  These credentials apply globally across all sidebar modules: <strong>Dashboard</strong>,{" "}
                  <strong>AI Cloud Agent</strong>, <strong>Cloud Providers</strong>,{" "}
                  <strong>Load Balancing</strong>, <strong>Security Scan</strong>, and <strong>Energy</strong>.
                </p>
              </div>
            </div>

            <div className="creds-mode-selector">
              <div
                className={`mode-card ${!inputUseServer ? "selected" : ""}`}
                onClick={() => setInputUseServer(false)}
              >
                <div className="mode-radio">
                  {!inputUseServer && <div className="dot"></div>}
                </div>
                <div>
                  <strong>Custom IAM Access Key & Secret</strong>
                  <p>Provide your own AWS IAM user credentials to inspect instances and metrics</p>
                </div>
              </div>

              <div
                className={`mode-card ${inputUseServer ? "selected" : ""}`}
                onClick={() => setInputUseServer(true)}
              >
                <div className="mode-radio">
                  {inputUseServer && <div className="dot"></div>}
                </div>
                <div>
                  <strong>Backend Server Environment (.env)</strong>
                  <p>Use preconfigured backend AWS credentials</p>
                </div>
              </div>
            </div>

            {!inputUseServer && (
              <div className="custom-keys-form">
                <div className="creds-form-grid">
                  <div className="form-group">
                    <label>AWS Access Key ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                      value={inputAccessKey}
                      onChange={(e) => setInputAccessKey(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label>AWS Secret Access Key *</label>
                    <div className="secret-input-wrapper">
                      <input
                        type={showSecret ? "text" : "password"}
                        className="form-input"
                        placeholder="e.g. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        value={inputSecretKey}
                        onChange={(e) => setInputSecretKey(e.target.value)}
                        autoComplete="off"
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
                </div>

                <div className="creds-form-grid">
                  <div className="form-group">
                    <label>AWS Session Token (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Required only for temporary STS / Academy / SSO credentials"
                      value={inputSessionToken}
                      onChange={(e) => setInputSessionToken(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Default AWS Region</label>
                    <select
                      className="form-input"
                      value={inputRegion}
                      onChange={(e) => setInputRegion(e.target.value)}
                    >
                      {AWS_REGIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {testResult && (
              <div
                className={`creds-test-banner ${
                  testResult.valid ? "success" : "error"
                }`}
              >
                <span className="test-status-icon">
                  {testResult.valid ? "✓" : "!"}
                </span>
                <div>
                  <strong>
                    {testResult.valid ? "Connection Verified" : "Connection Failed"}
                  </strong>
                  <p>{testResult.message}</p>
                  {testResult.arn && <code>{testResult.arn}</code>}
                </div>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="creds-test-banner success">
                <span className="test-status-icon">✓</span>
                <div>
                  <strong>Global Update Successful</strong>
                  <p>{saveSuccessMsg}</p>
                </div>
              </div>
            )}

            <div className="creds-btn-row">
              <button
                className="primary-button"
                onClick={handleSaveCredentials}
              >
                💾 Save & Apply Globally
              </button>

              <button
                className="secondary-button"
                onClick={handleTestCredentials}
                disabled={testingConnection}
              >
                {testingConnection ? "Validating STS..." : "⚡ Test Connection"}
              </button>

              {!inputUseServer && (
                <button
                  className="secondary-button danger-button"
                  onClick={handleResetToDefaults}
                >
                  ↺ Reset to Server Defaults
                </button>
              )}
            </div>

            <div className="security-notice-card">
              <h4>🔒 Security & Read-Only Guarantee</h4>
              <p>
                CloudMind runs only non-mutating AWS API calls (such as <code>ec2:DescribeInstances</code>,{" "}
                <code>cloudwatch:GetMetricData</code>, and <code>ec2:DescribeSecurityGroups</code>).
                Your credentials are stored securely in browser storage and are never persisted to a remote database.
              </p>
            </div>
          </div>
        )}
      </div>


      {/* ======================================
          ERROR
      ====================================== */}

      {metricsError && (

        <div className="dashboard-alert">

          <span>!</span>

          <div>

            <strong>
              AWS metrics unavailable
            </strong>

            <p>
              Could not retrieve real AWS
              infrastructure data from the
              backend.
            </p>

          </div>

          <button
            onClick={fetchMetrics}
          >
            Retry
          </button>

        </div>

      )}


      {/* ======================================
          REAL AWS SOURCE
      ====================================== */}

      {metrics && (

        <div className="dashboard-live-source">

          <span className="status-dot"></span>

          <span>
            Live AWS CloudWatch data
          </span>

          <span>
            Region: {awsRegion}
          </span>

          <span>
            Auto-refresh: 30s
          </span>

        </div>

      )}


      {/* ======================================
          METRICS
      ====================================== */}

      <div className="metrics-grid">


        {/* CLOUD HEALTH */}

        <div className="metric-card">

          <div className="metric-top">

            <span>
              Cloud Health
            </span>

            <span className="metric-icon blue">
              ◈
            </span>

          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : cloudHealth}

            <span>
              /100
            </span>

          </div>

          <div className="metric-change positive">

            ↑ Live

            <span>
              AWS infrastructure
            </span>

          </div>

        </div>


        {/* MONTHLY COST */}

        <div className="metric-card">

          <div className="metric-top">

            <span>
              Monthly Cost
            </span>

            <span className="metric-icon purple">
              ◆
            </span>

          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : monthlyCost == null
                ? "N/A"
                : `₹${(
                    monthlyCost / 1000
                  ).toFixed(1)}`}

            {monthlyCost != null && (
              <span>K</span>
            )}

          </div>

          <div className="metric-change">

            AWS Cost Explorer

            <span>
              not connected
            </span>

          </div>

        </div>


        {/* ENERGY */}

        <div className="metric-card">

          <div className="metric-top">

            <span>
              Energy Efficiency
            </span>

            <span className="metric-icon cyan">
              ϟ
            </span>

          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : energyEfficiency}

            <span>
              %
            </span>

          </div>

          <div className="metric-change positive">

            ↑ Estimated

            <span>
              from CPU utilization
            </span>

          </div>

        </div>


        {/* CPU */}

        <div className="metric-card">

          <div className="metric-top">

            <span>
              CPU Utilization
            </span>

            <span className="metric-icon green">
              ◉
            </span>

          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : cpuUsage}

            <span>
              %
            </span>

          </div>

          <div className="metric-change positive">

            ↑ Live

            <span>
              AWS CloudWatch
            </span>

          </div>

        </div>

      </div>


      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div className="dashboard-grid">


        {/* ====================================
            REAL CPU CHART
        ==================================== */}

        <div className="panel resource-panel">

          <div className="panel-header">

            <div>

              <h2>
                CPU Utilization
              </h2>

              <p>
                Real AWS CloudWatch CPU metrics
              </p>

            </div>

            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(
                  e.target.value
                )
              }
            >

              <option>
                Last 7 hours
              </option>

              <option disabled>
                Last 24 hours
              </option>

              <option disabled>
                Last 30 days
              </option>

            </select>

          </div>


          <div className="chart">

            <div className="chart-y">

              <span>
                100%
              </span>

              <span>
                75%
              </span>

              <span>
                50%
              </span>

              <span>
                25%
              </span>

              <span>
                0%
              </span>

            </div>


            <div className="chart-area">

              <div className="grid-line line-1"></div>

              <div className="grid-line line-2"></div>

              <div className="grid-line line-3"></div>

              <div className="grid-line line-4"></div>


              {cpuHistory.length > 0 ? (

                <svg
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                >

                  <polyline
                    points={graphPoints}
                    fill="none"
                    stroke="#e5484d"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />

                </svg>

              ) : (

                <div className="chart-empty">

                  Waiting for
                  CloudWatch data...

                </div>

              )}

            </div>

          </div>


          {/* RESOURCE SUMMARY */}

          <div className="usage-summary">

            <div className="usage-item">

              <span>
                CPU
              </span>

              <strong>
                {loading
                  ? "—"
                  : `${cpuUsage}%`}
              </strong>

            </div>


            <div className="usage-item">

              <span>
                Memory
              </span>

              <strong>
                {loading
                  ? "—"
                  : memoryUsage == null
                    ? "N/A"
                    : `${memoryUsage}%`}
              </strong>

            </div>


            <div className="usage-item">

              <span>
                Network
              </span>

              <strong>
                {loading
                  ? "—"
                  : networkUsage == null
                    ? "N/A"
                    : `${networkUsage}%`}
              </strong>

            </div>

          </div>


          <div className="chart-labels">

            {cpuHistory.map(
              (_, index) => (

                <span key={index}>

                  {index ===
                    cpuHistory.length - 1
                    ? "Now"
                    : `${cpuHistory.length - index - 1}h`}

                </span>

              )
            )}

          </div>

        </div>


        {/* ====================================
            AI INSIGHTS
        ==================================== */}

        <div className="panel insights-panel">

          <div className="panel-header">

            <div>

              <h2>
                AI Insights
              </h2>

              <p>
                Intelligent recommendations
              </p>

            </div>

            <span className="ai-badge">
              ✦ AI
            </span>

          </div>


          <div className="insight">

            <div className="insight-icon warning">
              !
            </div>

            <div>

              <strong>
                CPU utilization
              </strong>

              <p>

                Current average CPU
                utilization is{" "}
                {cpuUsage}% across{" "}
                {runningInstances} running
                EC2 instance
                {runningInstances !== 1
                  ? "s"
                  : ""}.

              </p>

              <span>
                CloudWatch
              </span>

            </div>

          </div>


          <div className="insight">

            <div className="insight-icon saving">
              ₹
            </div>

            <div>

              <strong>
                Cost monitoring
              </strong>

              <p>
                AWS billing data is not
                connected yet. Cost Explorer
                integration can be added next.
              </p>

              <span>
                Pending
              </span>

            </div>

          </div>


          <div className="insight">

            <div className="insight-icon security">
              ✓
            </div>

            <div>

              <strong>
                Infrastructure
              </strong>

              <p>
                {totalInstances} EC2 instance
                {totalInstances !== 1
                  ? "s"
                  : ""} detected in{" "}
                {awsRegion}.
              </p>

              <span>
                Live
              </span>

            </div>

          </div>


          <button
            className="view-all"
            onClick={() =>
              goTo("analytics")
            }
          >
            View all insights →
          </button>

        </div>

      </div>


      {/* ======================================
          BOTTOM GRID
      ====================================== */}

      <div className="bottom-grid">


        {/* ====================================
            CLOUD PROVIDERS
        ==================================== */}

        <div className="panel provider-panel">

          <div className="panel-header">

            <div>

              <h2>
                Cloud Providers
              </h2>

              <p>
                Real AWS infrastructure
              </p>

            </div>

            <button
              className="text-button"
              onClick={() =>
                goTo("providers")
              }
            >
              Manage →
            </button>

          </div>


          <div className="provider-row">

            <div className="provider-logo aws">
              A
            </div>

            <div className="provider-info">

              <strong>
                AWS
              </strong>

              <span>
                {totalInstances} EC2
                instance
                {totalInstances !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            <div className="provider-bar">

              <div
                style={{
                  width:
                    `${providers.aws}%`,
                }}
              ></div>

            </div>

            <strong>
              {providers.aws}%
            </strong>

          </div>


          <div className="provider-row">

            <div className="provider-logo azure">
              A
            </div>

            <div className="provider-info">

              <strong>
                Azure
              </strong>

              <span>
                Not monitored
              </span>

            </div>

            <div className="provider-bar">

              <div
                style={{
                  width:
                    `${providers.azure}%`,
                }}
              ></div>

            </div>

            <strong>
              {providers.azure}%
            </strong>

          </div>


          <div className="provider-row">

            <div className="provider-logo gcp">
              G
            </div>

            <div className="provider-info">

              <strong>
                Google Cloud
              </strong>

              <span>
                Not monitored
              </span>

            </div>

            <div className="provider-bar">

              <div
                style={{
                  width:
                    `${providers.gcp}%`,
                }}
              ></div>

            </div>

            <strong>
              {providers.gcp}%
            </strong>

          </div>

        </div>


        {/* ====================================
            INFRASTRUCTURE STATUS
        ==================================== */}

        <div className="panel status-panel">

          <div className="panel-header">

            <div>

              <h2>
                Infrastructure Status
              </h2>

              <p>
                Live AWS system overview
              </p>

            </div>

          </div>


          <div className="status-item">

            <span>

              <i
                className={getStatusClass(
                  infrastructure.compute
                )}
              ></i>

              Compute

            </span>

            <strong
              className={getStatusTextClass(
                infrastructure.compute
              )}
            >
              {infrastructure.compute}
            </strong>

          </div>


          <div className="status-item">

            <span>

              <i className="warning-dot"></i>

              Database

            </span>

            <strong className="warning-text">
              Not Monitored
            </strong>

          </div>


          <div className="status-item">

            <span>

              <i className="warning-dot"></i>

              Network

            </span>

            <strong className="warning-text">
              Not Monitored
            </strong>

          </div>


          <div className="status-item">

            <span>

              <i className="warning-dot"></i>

              Security

            </span>

            <strong className="warning-text">
              Not Monitored
            </strong>

          </div>

        </div>

      </div>


      {/* ======================================
          REAL EC2 INSTANCES
      ====================================== */}

      {awsInstances.length > 0 && (

        <div className="panel aws-instance-panel">

          <div className="panel-header">

            <div>

              <h2>
                AWS EC2 Instances
              </h2>

              <p>
                Live instances returned by AWS
              </p>

            </div>

            <span className="connected-badge">

              <span className="status-dot"></span>

              {runningInstances} Running

            </span>

          </div>


          <div className="aws-instance-list">

            {awsInstances.map(
              (instance) => (

                <div
                  className="aws-instance-row"
                  key={instance.id}
                >

                  <div>

                    <strong>
                      {instance.id}
                    </strong>

                    <span>
                      {instance.type ||
                        "Unknown type"}
                    </span>

                  </div>


                  <div>

                    <span>
                      STATE
                    </span>

                    <strong>
                      {instance.state}
                    </strong>

                  </div>


                  <div>

                    <span>
                      CPU
                    </span>

                    <strong>

                      {instance.cpu_utilization ==
                      null
                        ? "N/A"
                        : `${instance.cpu_utilization}%`}

                    </strong>

                  </div>


                  <div>

                    <span>
                      REGION
                    </span>

                    <strong>
                      {instance.region}
                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}


      {/* ======================================
          ADD CLOUD ACCOUNT MODAL
      ====================================== */}

      {showAddAccount && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddAccount(false)
          }
        >

          <div
            className="cloud-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  CLOUD CONNECTION
                </span>

                <h2>
                  Add Cloud Account
                </h2>

                <p>
                  Connect a cloud provider
                  to CloudMind.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowAddAccount(false)
                }
              >
                ×
              </button>

            </div>


            <div className="cloud-options">


              {/* AWS */}

              <button
                className="cloud-option"
                onClick={() => {

                  setSelectedProvider(
                    "AWS"
                  );

                  setAccountError("");

                }}
              >

                <div className="cloud-option-icon aws">
                  A
                </div>

                <div>

                  <strong>
                    Amazon Web Services
                  </strong>

                  <span>
                    Connect your AWS
                    infrastructure
                  </span>

                </div>

                <span>
                  →
                </span>

              </button>


              {/* AZURE */}

              <button
                className="cloud-option"
                onClick={() => {

                  setSelectedProvider(
                    "Azure"
                  );

                  setAccountError("");

                }}
              >

                <div className="cloud-option-icon azure">
                  A
                </div>

                <div>

                  <strong>
                    Microsoft Azure
                  </strong>

                  <span>
                    Connect your Azure
                    resources
                  </span>

                </div>

                <span>
                  →
                </span>

              </button>


              {/* GCP */}

              <button
                className="cloud-option"
                onClick={() => {

                  setSelectedProvider(
                    "GCP"
                  );

                  setAccountError("");

                }}
              >

                <div className="cloud-option-icon gcp">
                  G
                </div>

                <div>

                  <strong>
                    Google Cloud
                  </strong>

                  <span>
                    Connect your GCP
                    infrastructure
                  </span>

                </div>

                <span>
                  →
                </span>

              </button>


              {selectedProvider && (

                <div className="cloud-account-form">

                  <h3>
                    Connect {selectedProvider}
                  </h3>


                  <div className="cloud-account-form-grid">

                    <div className="cloud-account-field full">

                      <label>
                        Account Name
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Production AWS"
                        value={accountName}
                        onChange={(e) =>
                          setAccountName(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <div className="cloud-account-field">

                      <label>
                        Account ID
                      </label>

                      <input
                        type="text"
                        placeholder="Optional"
                        value={accountId}
                        onChange={(e) =>
                          setAccountId(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <div className="cloud-account-field">

                      <label>
                        Region
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. ap-south-1"
                        value={region}
                        onChange={(e) =>
                          setRegion(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>


                  {accountError && (

                    <div className="auth-error">
                      {accountError}
                    </div>

                  )}


                  <div className="cloud-account-actions">

                    <button
                      className="cloud-account-cancel"
                      onClick={() => {

                        setSelectedProvider(
                          null
                        );

                        setAccountError("");

                      }}
                    >
                      Back
                    </button>


                    <button
                      className="cloud-account-save"
                      onClick={
                        handleAddAccount
                      }
                      disabled={
                        savingAccount
                      }
                    >

                      {savingAccount
                        ? "Saving..."
                        : "Save Cloud Account"}

                    </button>

                  </div>

                </div>

              )}

            </div>


            <div className="modal-note">

              <span>
                🔒
              </span>

              AWS infrastructure data is
              retrieved securely by the
              CloudMind backend using AWS
              credentials.

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;