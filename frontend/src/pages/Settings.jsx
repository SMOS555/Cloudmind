import { useState } from "react";

function Settings() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compact, setCompact] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("cloudmind_settings", JSON.stringify({ autoRefresh, compact }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return <div className="feature-page">
    <div className="page-header">
      <div><span className="eyebrow">PLATFORM SETTINGS</span><h1>Settings</h1><p>Control how CloudMind monitors and presents your cloud workspace.</p></div>
      <button className="primary-button" onClick={save}>{saved ? "✓ Saved" : "Save Settings"}</button>
    </div>
    <div className="feature-grid">
      <div className="panel"><div className="panel-header"><div><h2>Monitoring</h2><p>Dashboard behavior and data refresh preferences.</p></div></div>
        <div className="setting-row"><div><strong>Automatic refresh</strong><span>Refresh live AWS metrics periodically.</span></div><button className={`toggle ${autoRefresh ? "on" : ""}`} onClick={() => setAutoRefresh(!autoRefresh)}><span></span></button></div>
        <div className="setting-row"><div><strong>Compact analytics</strong><span>Use denser cards and tables on analysis pages.</span></div><button className={`toggle ${compact ? "on" : ""}`} onClick={() => setCompact(!compact)}><span></span></button></div>
      </div>
      <div className="panel"><div className="panel-header"><div><h2>Data & Security</h2><p>CloudMind's current connection model.</p></div></div>
        <div className="settings-info"><span>✓</span><div><strong>Read-only AWS analysis</strong><p>Security, analytics, cost and energy modules inspect resources without changing them.</p></div></div>
        <div className="settings-info"><span>✓</span><div><strong>Credentials stay server-side</strong><p>AWS credentials are used by the backend rather than exposed in frontend code.</p></div></div>
        <div className="settings-info"><span>✓</span><div><strong>Billing-independent optimization</strong><p>Cost optimization can work from utilization and resource metadata when Cost Explorer is unavailable.</p></div></div>
      </div>
    </div>
  </div>;
}
export default Settings;
