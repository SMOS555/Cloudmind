import { useEffect, useState } from "react";

function Dashboard({ setActivePage }) {
  const [showAddAccount, setShowAddAccount] = useState(false);

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);

  const [timeRange, setTimeRange] = useState("Last 24 hours");

  // ==========================================
  // FETCH CLOUD METRICS
  // ==========================================

  const fetchMetrics = async () => {
    setLoading(true);
    setMetricsError(false);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/metrics"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();

      console.log("Cloud metrics:", data);

      setMetrics(data);
    } catch (error) {
      console.error("Metrics error:", error);
      setMetricsError(true);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD METRICS
  // ==========================================

  useEffect(() => {
    fetchMetrics();
  }, []);

  // ==========================================
  // SAFE METRIC VALUES
  // ==========================================

  const cloudHealth =
    metrics?.cloud_health ??
    metrics?.health ??
    91;

  const monthlyCost =
    metrics?.monthly_cost ??
    metrics?.cost ??
    42300;

  const energyEfficiency =
    metrics?.energy_efficiency ??
    metrics?.energy ??
    88;

  const securityScore =
    metrics?.security_score ??
    metrics?.security ??
    94;

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goTo = (page) => {
    if (setActivePage) {
      setActivePage(page);
    }
  };

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
            Here's what's happening across your cloud
            infrastructure.
          </p>

        </div>


        <div className="dashboard-header-actions">

          <button
            className="secondary-button"
            onClick={fetchMetrics}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            className="primary-button"
            onClick={() => setShowAddAccount(true)}
          >
            + Add Cloud Account
          </button>

        </div>

      </div>


      {/* ======================================
          ERROR
      ====================================== */}

      {metricsError && (
        <div className="dashboard-alert">

          <span>!</span>

          <div>
            <strong>
              Cloud metrics unavailable
            </strong>

            <p>
              Using demonstration data. Make sure your
              FastAPI backend is running.
            </p>
          </div>

          <button onClick={fetchMetrics}>
            Retry
          </button>

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

            {loading ? "—" : cloudHealth}

            <span>
              /100
            </span>

          </div>


          <div className="metric-change positive">

            ↑ 4.2%

            <span>
              vs last week
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
              : `₹${(monthlyCost / 1000).toFixed(1)}`
            }

            <span>
              K
            </span>

          </div>


          <div className="metric-change negative">

            ↑ 8.4%

            <span>
              vs last month
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

            {loading ? "—" : energyEfficiency}

            <span>
              %
            </span>

          </div>


          <div className="metric-change positive">

            ↑ 6.1%

            <span>
              optimized
            </span>

          </div>

        </div>


        {/* SECURITY */}

        <div className="metric-card">

          <div className="metric-top">

            <span>
              Security Score
            </span>

            <span className="metric-icon green">
              ◉
            </span>

          </div>


          <div className="metric-value">

            {loading ? "—" : securityScore}

            <span>
              /100
            </span>

          </div>


          <div className="metric-change positive">

            ↑ 2.7%

            <span>
              improved
            </span>

          </div>

        </div>

      </div>


      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div className="dashboard-grid">


        {/* ====================================
            RESOURCE CHART
        ==================================== */}

        <div className="panel resource-panel">

          <div className="panel-header">

            <div>

              <h2>
                Resource Utilization
              </h2>

              <p>
                Infrastructure performance
              </p>

            </div>


            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value)
              }
            >

              <option>
                Last 24 hours
              </option>

              <option>
                Last 7 days
              </option>

              <option>
                Last 30 days
              </option>

            </select>

          </div>


          <div className="chart">

            <div className="chart-y">

              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>

            </div>


            <div className="chart-area">

              <div className="grid-line line-1"></div>
              <div className="grid-line line-2"></div>
              <div className="grid-line line-3"></div>
              <div className="grid-line line-4"></div>


              <svg
                viewBox="0 0 700 220"
                preserveAspectRatio="none"
              >

                <defs>

                  <linearGradient
                    id="areaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#e5484d"
                      stopOpacity="0.28"
                    />

                    <stop
                      offset="100%"
                      stopColor="#e5484d"
                      stopOpacity="0"
                    />

                  </linearGradient>

                </defs>


                <path
                  d="
                    M0 170
                    C40 150 55 120 95 135
                    S145 165 185 125
                    S230 75 270 100
                    S320 145 355 105
                    S405 60 445 80
                    S500 130 535 95
                    S590 45 625 70
                    S675 105 700 55
                    L700 220
                    L0 220
                    Z
                  "
                  fill="url(#areaGradient)"
                />


                <path
                  d="
                    M0 170
                    C40 150 55 120 95 135
                    S145 165 185 125
                    S230 75 270 100
                    S320 145 355 105
                    S405 60 445 80
                    S500 130 535 95
                    S590 45 625 70
                    S675 105 700 55
                  "
                  fill="none"
                  stroke="#e5484d"
                  strokeWidth="3"
                />

              </svg>

            </div>

          </div>


          <div className="chart-labels">

            <span>12 AM</span>
            <span>4 AM</span>
            <span>8 AM</span>
            <span>12 PM</span>
            <span>4 PM</span>
            <span>8 PM</span>
            <span>Now</span>

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
                CPU spike detected
              </strong>

              <p>
                VM-03 has exceeded 80% utilization
                for the last 15 minutes.
              </p>

              <span>
                8 min ago
              </span>

            </div>

          </div>


          <div className="insight">

            <div className="insight-icon saving">
              ₹
            </div>

            <div>

              <strong>
                Potential savings found
              </strong>

              <p>
                You could save approximately
                ₹4,200/month by optimizing 3 VMs.
              </p>

              <span>
                23 min ago
              </span>

            </div>

          </div>


          <div className="insight">

            <div className="insight-icon security">
              ✓
            </div>

            <div>

              <strong>
                Security posture improved
              </strong>

              <p>
                2 high-risk configuration issues
                were resolved.
              </p>

              <span>
                1 hr ago
              </span>

            </div>

          </div>


          <button
            className="view-all"
            onClick={() => goTo("analytics")}
          >
            View all insights →
          </button>

        </div>

      </div>


      {/* ======================================
          BOTTOM GRID
      ====================================== */}

      <div className="bottom-grid">


        {/* CLOUD PROVIDERS */}

        <div className="panel provider-panel">

          <div className="panel-header">

            <div>

              <h2>
                Cloud Providers
              </h2>

              <p>
                Current infrastructure distribution
              </p>

            </div>


            <button
              className="text-button"
              onClick={() => goTo("providers")}
            >
              Manage →
            </button>

          </div>


          {/* AWS */}

          <div className="provider-row">

            <div className="provider-logo aws">
              A
            </div>


            <div className="provider-info">

              <strong>
                AWS
              </strong>

              <span>
                12 resources
              </span>

            </div>


            <div className="provider-bar">

              <div
                style={{
                  width: "72%"
                }}
              />

            </div>


            <strong>
              72%
            </strong>

          </div>


          {/* AZURE */}

          <div className="provider-row">

            <div className="provider-logo azure">
              A
            </div>


            <div className="provider-info">

              <strong>
                Azure
              </strong>

              <span>
                7 resources
              </span>

            </div>


            <div className="provider-bar">

              <div
                style={{
                  width: "43%"
                }}
              />

            </div>


            <strong>
              43%
            </strong>

          </div>


          {/* GCP */}

          <div className="provider-row">

            <div className="provider-logo gcp">
              G
            </div>


            <div className="provider-info">

              <strong>
                Google Cloud
              </strong>

              <span>
                5 resources
              </span>

            </div>


            <div className="provider-bar">

              <div
                style={{
                  width: "28%"
                }}
              />

            </div>


            <strong>
              28%
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
                Live system overview
              </p>

            </div>

          </div>


          <div className="status-item">

            <span>

              <i className="online"></i>

              Compute

            </span>

            <strong>
              Healthy
            </strong>

          </div>


          <div className="status-item">

            <span>

              <i className="online"></i>

              Database

            </span>

            <strong>
              Healthy
            </strong>

          </div>


          <div className="status-item">

            <span>

              <i className="online"></i>

              Network

            </span>

            <strong>
              Healthy
            </strong>

          </div>


          <div className="status-item">

            <span>

              <i className="warning-dot"></i>

              Security

            </span>

            <strong className="warning-text">
              2 Issues
            </strong>

          </div>

        </div>

      </div>


      {/* ======================================
          ADD CLOUD ACCOUNT MODAL
      ====================================== */}

      {showAddAccount && (

        <div
          className="modal-overlay"
          onClick={() => setShowAddAccount(false)}
        >

          <div
            className="cloud-modal"
            onClick={(e) => e.stopPropagation()}
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
                  Connect a cloud provider to CloudMind.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() => setShowAddAccount(false)}
              >
                ×
              </button>

            </div>


            <div className="cloud-options">


              {/* AWS */}

              <button
                className="cloud-option"
                onClick={() => {
                  alert(
                    "AWS connection setup will be added during cloud deployment."
                  );
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
                    Connect your AWS infrastructure
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
                  alert(
                    "Azure connection setup will be added during cloud deployment."
                  );
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
                    Connect your Azure resources
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
                  alert(
                    "Google Cloud connection setup will be added during cloud deployment."
                  );
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
                    Connect your GCP infrastructure
                  </span>

                </div>

                <span>
                  →
                </span>

              </button>

            </div>


            <div className="modal-note">

              <span>
                🔒
              </span>

              Your cloud credentials will be handled
              securely by the backend.

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;