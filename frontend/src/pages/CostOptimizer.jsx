import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function CostOptimizer() {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCostData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cost`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to retrieve cost data."
        );
      }

      setCostData(data);
    } catch (err) {
      console.error("Cost data error:", err);

      setError(
        err.message ||
          "Unable to connect to the cost engine."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, []);

  const monthlyCost =
    costData?.monthly_cost ?? null;

  const estimatedSavings =
    costData?.estimated_savings ?? 0;

  const services =
    costData?.services ?? [];

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <span className="eyebrow">
            CLOUD INTELLIGENCE
          </span>

          <h1>
            Cost Optimizer
          </h1>

          <p>
            Analyze cloud spending and discover
            potential savings across your
            infrastructure.
          </p>
        </div>

        <div className="dashboard-header-actions">

          <button
            className="secondary-button"
            onClick={fetchCostData}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="dashboard-alert">

          <span>!</span>

          <div>
            <strong>
              Cost data unavailable
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button onClick={fetchCostData}>
            Retry
          </button>

        </div>
      )}


      {/* LIVE STATUS */}

      <div className="dashboard-live-source">

        <span className="status-dot"></span>

        <span>
          AWS Cost Intelligence
        </span>

        <span>
          {costData?.status ||
            "Waiting for cost data"}
        </span>

      </div>


      {/* METRICS */}

      <div className="metrics-grid">

        <div className="metric-card">

          <div className="metric-top">
            <span>
              Monthly Cost
            </span>

            <span className="metric-icon purple">
              ₹
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : monthlyCost == null
                ? "N/A"
                : `₹${monthlyCost.toLocaleString()}`}

          </div>

          <div className="metric-change">
            AWS billing
            <span>
              Current estimate
            </span>
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              Potential Savings
            </span>

            <span className="metric-icon green">
              ↓
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : `₹${estimatedSavings.toLocaleString()}`}

          </div>

          <div className="metric-change positive">
            Optimization
            <span>
              Estimated savings
            </span>
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              Services
            </span>

            <span className="metric-icon blue">
              ◈
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : services.length}

          </div>

          <div className="metric-change">
            AWS
            <span>
              Monitored services
            </span>
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              Optimization
            </span>

            <span className="metric-icon cyan">
              ✦
            </span>
          </div>

          <div className="metric-value">

            {loading
              ? "—"
              : monthlyCost
                ? `${Math.round(
                    (estimatedSavings /
                      monthlyCost) *
                      100
                  )}%`
                : "N/A"}

          </div>

          <div className="metric-change positive">
            AI analysis
            <span>
              Savings opportunity
            </span>
          </div>

        </div>

      </div>


      {/* MAIN GRID */}

      <div className="dashboard-grid">

        {/* COST BREAKDOWN */}

        <div className="panel resource-panel">

          <div className="panel-header">

            <div>
              <h2>
                Cost Breakdown
              </h2>

              <p>
                AWS spending by service
              </p>
            </div>

          </div>


          {services.length > 0 ? (

            <div className="aws-instance-list">

              {services.map(
                (service, index) => {

                  const name =
                    service.name ||
                    service.service ||
                    `Service ${index + 1}`;

                  const cost =
                    service.cost ?? 0;

                  return (
                    <div
                      className="aws-instance-row"
                      key={index}
                    >

                      <div>
                        <strong>
                          {name}
                        </strong>

                        <span>
                          AWS service
                        </span>
                      </div>

                      <div>
                        <span>
                          COST
                        </span>

                        <strong>
                          ₹{Number(cost).toLocaleString()}
                        </strong>
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <div className="chart-empty">

              {loading
                ? "Loading AWS cost data..."
                : "No AWS Cost Explorer data available."}

            </div>

          )}

        </div>


        {/* AI RECOMMENDATIONS */}

        <div className="panel insights-panel">

          <div className="panel-header">

            <div>
              <h2>
                AI Cost Insights
              </h2>

              <p>
                Intelligent savings recommendations
              </p>
            </div>

            <span className="ai-badge">
              ✦ AI
            </span>

          </div>


          <div className="insight">

            <div className="insight-icon saving">
              ₹
            </div>

            <div>
              <strong>
                Identify unused resources
              </strong>

              <p>
                Look for stopped, idle, or
                underutilized resources that
                may still generate charges.
              </p>

              <span>
                Optimization
              </span>
            </div>

          </div>


          <div className="insight">

            <div className="insight-icon warning">
              !
            </div>

            <div>
              <strong>
                Review expensive services
              </strong>

              <p>
                Analyze services with the
                highest contribution to your
                monthly cloud spending.
              </p>

              <span>
                Cost analysis
              </span>
            </div>

          </div>


          <div className="insight">

            <div className="insight-icon security">
              ✓
            </div>

            <div>
              <strong>
                Right-size infrastructure
              </strong>

              <p>
                Match compute resources to
                actual workload requirements
                to reduce unnecessary costs.
              </p>

              <span>
                Recommendation
              </span>
            </div>

          </div>

        </div>

      </div>


      {/* COST ENGINE INFORMATION */}

      <div className="panel">

        <div className="panel-header">

          <div>
            <h2>
              Cost Intelligence Engine
            </h2>

            <p>
              CloudMind analyzes infrastructure
              spending and identifies optimization
              opportunities.
            </p>
          </div>

          <span className="connected-badge">
            <span className="status-dot"></span>
            {costData?.status || "Not connected"}
          </span>

        </div>

      </div>

    </div>
  );
}

export default CostOptimizer;