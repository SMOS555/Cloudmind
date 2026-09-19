import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function AdvancedAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to retrieve analytics."
        );
      }

      setData(result);

    } catch (err) {
      console.error("Analytics error:", err);

      setError(
        "Unable to retrieve AWS analytics data."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(
      fetchAnalytics,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  const cpu = data?.cpu_usage ?? 0;

  const history =
    data?.cpu_history ?? [];

  const instances =
    data?.instances ?? [];

  const trend =
    data?.analysis?.trend ??
    "Insufficient data";

  const prediction =
    data?.analysis?.prediction ??
    "Insufficient data";

  const recommendation =
    data?.analysis?.recommendation ??
    "No recommendation available.";

  const getCpuStatus = () => {
    if (cpu >= 80) return "High";
    if (cpu >= 50) return "Moderate";
    return "Healthy";
  };

  return (
    <div className="analytics-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            CLOUD INTELLIGENCE
          </span>

          <h1>
            Advanced Analytics
          </h1>

          <p>
            Analyze AWS infrastructure performance,
            trends and resource utilization.
          </p>

        </div>

        <button
          className="secondary-button"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : "↻ Refresh"}
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="dashboard-alert">

          <span>!</span>

          <div>
            <strong>
              Analytics unavailable
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button onClick={fetchAnalytics}>
            Retry
          </button>

        </div>
      )}


      {/* LIVE STATUS */}

      {data && (
        <div className="dashboard-live-source">

          <span className="status-dot"></span>

          <span>
            Live AWS analytics
          </span>

          <span>
            Region: {data.region}
          </span>

          <span>
            Auto-refresh: 30s
          </span>

        </div>
      )}


      {/* METRIC CARDS */}

      <div className="metrics-grid">

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
              : cpu}

            <span>%</span>

          </div>

          <div className="metric-change">
            AWS CloudWatch
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              CPU Status
            </span>

            <span className="metric-icon blue">
              ◈
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : getCpuStatus()}

          </div>

          <div className="metric-change">
            Based on current utilization
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              Running Instances
            </span>

            <span className="metric-icon purple">
              ◆
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : data?.running_instances ?? 0}

          </div>

          <div className="metric-change">
            EC2 infrastructure
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              Total Instances
            </span>

            <span className="metric-icon cyan">
              ☁
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : data?.total_instances ?? 0}

          </div>

          <div className="metric-change">
            AWS resources
          </div>

        </div>

      </div>


      {/* ANALYTICS GRID */}

      <div className="dashboard-grid">

        {/* CPU TREND */}

        <div className="panel resource-panel">

          <div className="panel-header">

            <div>

              <h2>
                CPU Performance Trend
              </h2>

              <p>
                Historical AWS CloudWatch data
              </p>

            </div>

            <span className="ai-badge">
              LIVE
            </span>

          </div>


          <div className="analytics-chart">

            {history.length === 0 ? (

              <div className="chart-empty">
                Waiting for CloudWatch data...
              </div>

            ) : (

              <div className="analytics-bars">

                {history.map(
                  (value, index) => (

                    <div
                      className="analytics-bar-wrapper"
                      key={index}
                    >

                      <div
                        className="analytics-bar"
                        style={{
                          height:
                            `${Math.max(
                              5,
                              Math.min(
                                100,
                                value
                              )
                            )}%`
                        }}
                        title={`${value}%`}
                      />

                      <span>
                        {value}%
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>


        {/* ANALYSIS */}

        <div className="panel insights-panel">

          <div className="panel-header">

            <div>

              <h2>
                AI Analysis
              </h2>

              <p>
                Infrastructure intelligence
              </p>

            </div>

            <span className="ai-badge">
              ✦ AI
            </span>

          </div>


          <div className="insight">

            <div className="insight-icon warning">
              ↗
            </div>

            <div>

              <strong>
                Performance Trend
              </strong>

              <p>
                {trend}
              </p>

              <span>
                CloudWatch analysis
              </span>

            </div>

          </div>


          <div className="insight">

            <div className="insight-icon security">
              ◈
            </div>

            <div>

              <strong>
                Prediction
              </strong>

              <p>
                {prediction}
              </p>

              <span>
                Based on recent metrics
              </span>

            </div>

          </div>


          <div className="insight">

            <div className="insight-icon saving">
              ✓
            </div>

            <div>

              <strong>
                Recommendation
              </strong>

              <p>
                {recommendation}
              </p>

              <span>
                CloudMind recommendation engine
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* INSTANCE ANALYSIS */}

      <div className="panel aws-instance-panel">

        <div className="panel-header">

          <div>

            <h2>
              Instance Performance
            </h2>

            <p>
              Resource-level AWS analysis
            </p>

          </div>

          <span className="connected-badge">

            <span className="status-dot"></span>

            AWS Connected

          </span>

        </div>


        {instances.length === 0 ? (

          <div className="chart-empty">
            No EC2 instances available for analysis.
          </div>

        ) : (

          <div className="aws-instance-list">

            {instances.map(
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
                      PERFORMANCE
                    </span>

                    <strong>

                      {instance.cpu_utilization ==
                      null
                        ? "N/A"
                        : instance.cpu_utilization >= 80
                          ? "High Load"
                          : instance.cpu_utilization >= 50
                            ? "Moderate"
                            : "Healthy"}

                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default AdvancedAnalytics;