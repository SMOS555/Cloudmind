import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

function LoadBalancing({ awsCredentials }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      let r;
      if (awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults) {
        r = await fetch(`${API_BASE_URL}/provider/aws/metrics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aws_access_key_id: awsCredentials.accessKeyId.trim(),
            aws_secret_access_key: awsCredentials.secretAccessKey ? awsCredentials.secretAccessKey.trim() : "",
            aws_session_token: awsCredentials.sessionToken ? awsCredentials.sessionToken.trim() : null,
            region: awsCredentials.region || "ap-south-1",
            history_hours: 7
          })
        });
      } else {
        const query = new URLSearchParams();
        if (awsCredentials?.region) query.set("region", awsCredentials.region);
        query.set("history_hours", "7");
        r = await fetch(`${API_BASE_URL}/provider/aws/metrics?${query.toString()}`);
      }

      const b = await r.json();
      if (!r.ok) throw new Error(b.detail || "Unable to retrieve AWS load data.");

      const servers = (b.instances || [])
        .filter((x) => x.state === "running")
        .map((x) => ({
          id: x.id,
          cpu: x.cpu_utilization ?? 0,
          ram: 0,
          traffic: 0,
        }));

      const ar = await fetch(`${API_BASE_URL}/load-balancing/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servers }),
      });

      const result = await ar.json();
      if (!ar.ok) throw new Error(result.detail || "Unable to analyze load.");

      setData({ ...result, source: b });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [awsCredentials]);

  return (
    <div className="feature-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">WORKLOAD DISTRIBUTION</span>
          <h1>Load Balancing</h1>
          <p>Analyze real EC2 CPU pressure and identify workload redistribution opportunities.</p>
        </div>
        <button className="secondary-button" onClick={load}>
          {loading ? "Analyzing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="feature-notice">
        <strong>Current limitation</strong>
        <span>
          AWS traffic and RAM metrics are not connected yet, so this analyzer uses real EC2 CPU utilization as its load signal.
        </span>
      </div>

      {error && (
        <div className="dashboard-alert">
          <span>!</span>
          <div>
            <strong>Load analysis unavailable</strong>
            <p>{error}</p>
          </div>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {data && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-top">
                <span>Overall Status</span>
                <span className="metric-icon blue">⇄</span>
              </div>
              <div className="metric-value analytics-small">{data.overall_status}</div>
            </div>
            <div className="metric-card">
              <div className="metric-top">
                <span>Average CPU</span>
                <span className="metric-icon purple">◉</span>
              </div>
              <div className="metric-value">{data.average_cpu}<span>%</span></div>
            </div>
            <div className="metric-card">
              <div className="metric-top">
                <span>Servers</span>
                <span className="metric-icon green">☁</span>
              </div>
              <div className="metric-value">{data.servers.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-top">
                <span>Recommendations</span>
                <span className="metric-icon cyan">!</span>
              </div>
              <div className="metric-value">{data.recommendations.length}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Server Load</h2>
                <p>Live EC2 CPU utilization used as the current load signal.</p>
              </div>
            </div>
            <div className="load-table">
              <div className="load-row load-head">
                <span>RESOURCE</span>
                <span>CPU</span>
                <span>STATUS</span>
                <span>ACTION</span>
              </div>
              {data.servers.length ? (
                data.servers.map((s) => (
                  <div className="load-row" key={s.id}>
                    <strong>{s.id}</strong>
                    <span>{s.cpu}%</span>
                    <span className={s.status.toLowerCase().replace(" ", "-")}>{s.status}</span>
                    <span>{s.status === "Overloaded" ? "Redistribute" : "Monitor"}</span>
                  </div>
                ))
              ) : (
                <div className="feature-empty">
                  <strong>No running EC2 instances</strong>
                  <span>Start an instance in AWS to generate real load analysis.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LoadBalancing;
