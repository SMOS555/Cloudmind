import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

function Energy({ awsCredentials }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hours, setHours] = useState(24);

  const loadEnergy = async () => {
    setLoading(true);
    setError("");

    try {
      let response;
      if (awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults) {
        response = await fetch(`${API_BASE_URL}/energy/aws`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region: awsCredentials.region || "ap-south-1",
            hours: hours,
            aws_access_key_id: awsCredentials.accessKeyId.trim(),
            aws_secret_access_key: awsCredentials.secretAccessKey ? awsCredentials.secretAccessKey.trim() : "",
            aws_session_token: awsCredentials.sessionToken ? awsCredentials.sessionToken.trim() : null,
          }),
        });
      } else {
        const reg = awsCredentials?.region || "ap-south-1";
        response = await fetch(
          `${API_BASE_URL}/energy/aws?hours=${hours}&region=${encodeURIComponent(reg)}`
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to load energy intelligence."
        );
      }

      setData(result);
    } catch (err) {
      setError(err.message || "Energy analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnergy();
  }, [hours, awsCredentials]);

  if (loading && !data) {
    return (
      <div className="energy-page">
        <div className="energy-loading-screen">
          <div className="energy-loader"></div>
          <h2>Analyzing infrastructure</h2>
          <p>
            Reading AWS EC2 and CloudWatch utilization data...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="energy-page">
        <div className="energy-error">
          <div className="energy-error-icon">!</div>
          <h2>Energy Intelligence unavailable</h2>
          <p>{error}</p>
          <button onClick={loadEnergy}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const score = data.efficiency_score ?? data.energy_efficiency;
  const cpu = data.average_cpu;
  const instances = data.running_instances ?? 0;
  const intensity = data.energy_intensity_index;

  const energy =
    data.energy_consumption?.value ??
    data.estimated_energy_kwh;

  const savings =
    data.potential_savings?.value ??
    data.potential_energy_savings;

  const emissions =
    data.carbon?.emissions ??
    data.estimated_carbon_kg;

  const carbonReduction =
    data.carbon?.reduction ??
    data.potential_carbon_reduction;

  const recommendations = data.recommendations || [];
  const trend = data.trend || [];

  const scoreLabel =
    score == null
      ? "Waiting"
      : score >= 85
      ? "Excellent"
      : score >= 70
      ? "Efficient"
      : score >= 50
      ? "Moderate"
      : "Needs attention";

  const scoreClass =
    score == null
      ? "neutral"
      : score >= 85
      ? "excellent"
      : score >= 70
      ? "good"
      : score >= 50
      ? "moderate"
      : "poor";

  return (
    <div className="feature-page energy-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="energy-header">

        <div>
          <div className="energy-eyebrow">
            <span></span>
            GREEN COMPUTING
          </div>

          <h1>Energy Intelligence</h1>

          <p>
            Understand infrastructure efficiency, workload utilization
            and potential sustainability improvements.
          </p>
        </div>

        <div className="energy-header-actions">

          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
            <option value={72}>72 hours</option>
            <option value={168}>7 days</option>
          </select>

          <button
            className="energy-refresh"
            onClick={loadEnergy}
            disabled={loading}
          >
            {loading ? "Updating..." : "↻ Refresh"}
          </button>

        </div>

      </header>

      {/* =====================================================
          DATA STATUS
      ===================================================== */}

      <div className="energy-status-bar">

        <div className="energy-live-status">
          <span className="live-dot"></span>
          <strong>AWS telemetry connected</strong>
        </div>

        <div className="energy-status-item">
          <span>Region</span>
          <strong>{data.region || "ap-south-1"}</strong>
        </div>

        <div className="energy-status-item">
          <span>Analysis</span>
          <strong>{hours} hours</strong>
        </div>

        <div className="energy-status-item">
          <span>Mode</span>
          <strong>Read-only</strong>
        </div>

      </div>

      {/* =====================================================
          TRANSPARENCY
      ===================================================== */}

      <div className="energy-notice">

        <div className="energy-notice-icon">ϟ</div>

        <div>
          <strong>Transparent measurement model</strong>

          <p>
            CPU utilization and EC2 inventory come from real AWS
            telemetry. Energy consumption and carbon values are
            derived planning estimates, not physical meter readings.
          </p>
        </div>

      </div>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <section className="energy-metrics">

        <div className="energy-metric-card featured">

          <div className="energy-metric-label">
            Efficiency Score
            <span>ϟ</span>
          </div>

          <div className="energy-metric-number">
            {score ?? "—"}
            {score != null && <small>/100</small>}
          </div>

          <div className={`energy-metric-status ${scoreClass}`}>
            {scoreLabel}
          </div>

        </div>

        <div className="energy-metric-card">

          <div className="energy-metric-label">
            Average CPU
            <span>◉</span>
          </div>

          <div className="energy-metric-number">
            {cpu ?? "—"}
            {cpu != null && <small>%</small>}
          </div>

          <p>CloudWatch utilization</p>

        </div>

        <div className="energy-metric-card">

          <div className="energy-metric-label">
            Running Compute
            <span>☁</span>
          </div>

          <div className="energy-metric-number">
            {instances}
          </div>

          <p>EC2 instances</p>

        </div>

        <div className="energy-metric-card">

          <div className="energy-metric-label">
            Intensity Index
            <span>◆</span>
          </div>

          <div className="energy-metric-number">
            {intensity ?? "—"}
          </div>

          <p>Relative planning metric</p>

        </div>

      </section>

      {/* =====================================================
          MAIN ANALYSIS
      ===================================================== */}

      <section className="energy-main-grid">

        {/* EFFICIENCY */}
        <div className="energy-panel efficiency-panel">

          <div className="energy-panel-header">

            <div>
              <span className="panel-eyebrow">
                RESOURCE UTILIZATION
              </span>

              <h2>Efficiency Profile</h2>

              <p>
                How effectively allocated compute is being utilized.
              </p>
            </div>

            <span className={`energy-badge ${scoreClass}`}>
              {scoreLabel}
            </span>

          </div>

          <div className="energy-score-area">

            <div
              className="energy-score-ring"
              style={{
                "--score-angle":
                  score != null
                    ? `${Math.min(score, 100) * 3.6}deg`
                    : "0deg",
              }}
            >
              <div>
                <strong>{score ?? "—"}</strong>
                {score != null && <span>/100</span>}
              </div>
            </div>

            <div className="energy-score-details">

              <div>
                <span>CPU utilization</span>
                <strong>{cpu ?? "—"}%</strong>
              </div>

              <div>
                <span>Running instances</span>
                <strong>{instances}</strong>
              </div>

              <div>
                <span>Infrastructure status</span>
                <strong>{data.estimated_status || "Unknown"}</strong>
              </div>

            </div>

          </div>

          <div className="energy-utilization">

            <div className="utilization-header">
              <span>Current utilization</span>
              <strong>{cpu ?? 0}%</strong>
            </div>

            <div className="utilization-track">
              <div
                style={{
                  width: `${Math.min(cpu ?? 0, 100)}%`,
                }}
              />
            </div>

            <div className="utilization-labels">
              <span>Idle</span>
              <span>Balanced</span>
              <span>High</span>
            </div>

          </div>

        </div>

        {/* IMPACT */}
        <div className="energy-panel">

          <div className="energy-panel-header">

            <div>
              <span className="panel-eyebrow">
                SUSTAINABILITY
              </span>

              <h2>Environmental Impact</h2>

              <p>
                Estimated impact of the analyzed infrastructure.
              </p>
            </div>

          </div>

          <div className="impact-list">

            <div className="impact-row">

              <div className="impact-icon energy">
                ϟ
              </div>

              <div>
                <span>Estimated energy</span>
                <strong>
                  {energy ?? "—"}{" "}
                  <small>kWh</small>
                </strong>
              </div>

            </div>

            <div className="impact-row">

              <div className="impact-icon savings">
                ↓
              </div>

              <div>
                <span>Potential energy savings</span>
                <strong>
                  {savings ?? "—"}{" "}
                  <small>kWh</small>
                </strong>
              </div>

            </div>

            <div className="impact-row">

              <div className="impact-icon carbon">
                CO₂
              </div>

              <div>
                <span>Estimated emissions</span>
                <strong>
                  {emissions ?? "—"}{" "}
                  <small>kg CO₂e</small>
                </strong>
              </div>

            </div>

            <div className="impact-row">

              <div className="impact-icon reduction">
                ↓
              </div>

              <div>
                <span>Potential CO₂ reduction</span>
                <strong>
                  {carbonReduction ?? "—"}{" "}
                  <small>kg CO₂e</small>
                </strong>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          TREND
      ===================================================== */}

      <section className="energy-panel energy-trend">

        <div className="energy-panel-header">

          <div>
            <span className="panel-eyebrow">
              HISTORICAL ANALYSIS
            </span>

            <h2>Efficiency Trend</h2>

            <p>
              Hourly efficiency calculated from CloudWatch utilization.
            </p>
          </div>

          <span className="energy-chart-period">
            {hours === 168 ? "7D" : `${hours}H`}
          </span>

        </div>

        {trend.length > 0 ? (

          <div className="energy-chart">

            <div className="chart-scale">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="chart-content">

              <div className="chart-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="chart-bars">

                {trend.map((item, index) => {

                  const value = Number(
                    item.efficiency ??
                    item.score ??
                    item.value ??
                    0
                  );

                  return (
                    <div
                      className="chart-column"
                      key={index}
                      title={`${value}/100`}
                    >

                      <div
                        className="chart-bar"
                        style={{
                          height: `${Math.max(
                            3,
                            Math.min(value, 100)
                          )}%`,
                        }}
                      />

                      <span>
                        {item.label || ""}
                      </span>

                    </div>
                  );
                })}

              </div>

            </div>

          </div>

        ) : (

          <div className="energy-chart-empty">

            <div>⌁</div>

            <strong>
              Not enough history yet
            </strong>

            <p>
              CloudWatch samples will appear here as your EC2
              workload continues running.
            </p>

          </div>

        )}

      </section>

      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      <section className="energy-panel">

        <div className="energy-panel-header">

          <div>
            <span className="panel-eyebrow">
              OPTIMIZATION
            </span>

            <h2>Optimization Opportunities</h2>

            <p>
              Actions derived from observed workload utilization.
            </p>
          </div>

          <span className="energy-chart-period">
            {recommendations.length} actions
          </span>

        </div>

        {recommendations.length > 0 ? (

          <div className="energy-recommendations">

            {recommendations.map((item, index) => (

              <div
                className="energy-recommendation"
                key={index}
              >

                <div
                  className={`recommendation-priority ${
                    item.priority || "medium"
                  }`}
                >
                  {item.priority === "high" ? "!" : "✓"}
                </div>

                <div className="recommendation-body">

                  <div className="recommendation-title-row">

                    <strong>{item.title}</strong>

                    <span
                      className={`priority-tag ${
                        item.priority || "medium"
                      }`}
                    >
                      {item.priority || "medium"}
                    </span>

                  </div>

                  <p>{item.description}</p>

                  {item.action && (
                    <div className="recommendation-action">
                      <span>→</span>
                      {item.action}
                    </div>
                  )}

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="energy-no-recommendations">

            <div>✓</div>

            <div>
              <strong>No optimization opportunities detected</strong>
              <p>
                Current workload data does not indicate an immediate
                optimization action.
              </p>
            </div>

          </div>

        )}

      </section>

      {/* =====================================================
          METHODOLOGY
      ===================================================== */}

      <section className="energy-methodology">

        <div>
          <span className="panel-eyebrow">
            TRANSPARENCY
          </span>

          <h2>How CloudMind calculates this</h2>

          <p>
            CloudMind separates observed AWS telemetry from derived
            sustainability estimates.
          </p>
        </div>

        <div className="methodology-items">

          <div>
            <span>01</span>
            <strong>Collect</strong>
            <p>
              EC2 inventory and CPU utilization are collected from AWS.
            </p>
          </div>

          <div>
            <span>02</span>
            <strong>Analyze</strong>
            <p>
              Utilization patterns are evaluated for efficiency.
            </p>
          </div>

          <div>
            <span>03</span>
            <strong>Estimate</strong>
            <p>
              Energy and carbon are calculated using planning assumptions.
            </p>
          </div>

          <div>
            <span>04</span>
            <strong>Optimize</strong>
            <p>
              Inefficient patterns are converted into recommendations.
            </p>
          </div>

        </div>

        <div className="energy-method-footer">
          <span>Data source: AWS EC2 + CloudWatch</span>
          <span>Region: {data.region || "ap-south-1"}</span>
          <span>Read-only analysis</span>
        </div>

      </section>

    </div>
  );
}

export default Energy;