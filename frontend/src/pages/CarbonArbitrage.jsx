import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

function CarbonArbitrage({ awsCredentials, setActivePage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("us-west-2");
  const [copiedStrategy, setCopiedStrategy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      let r;
      if (awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults) {
        r = await fetch(`${API_BASE_URL}/energy/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aws_access_key_id: awsCredentials.accessKeyId.trim(),
            aws_secret_access_key: awsCredentials.secretAccessKey ? awsCredentials.secretAccessKey.trim() : "",
            aws_session_token: awsCredentials.sessionToken ? awsCredentials.sessionToken.trim() : null,
            region: awsCredentials.region || "ap-south-1",
            hours: 24,
          }),
        });
      } else {
        const query = new URLSearchParams();
        if (awsCredentials?.region) query.set("region", awsCredentials.region);
        query.set("hours", "24");
        r = await fetch(`${API_BASE_URL}/energy/analyze?${query.toString()}`);
      }

      const res = await r.json();
      if (!r.ok) throw new Error(res.detail || "Unable to retrieve carbon grid data.");
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [awsCredentials]);

  const defaultGrid = [
    { region: "ap-south-1", name: "Asia Pacific (Mumbai)", grid_gco2_per_kwh: 708, clean_factor: "Coal-Intensive Grid (Baseline)", clean_badge: "High Carbon", savings_vs_mumbai: "0%", energy_mix: "71% Coal, 16% Solar/Wind, 13% Gas" },
    { region: "us-east-1", name: "US East (N. Virginia)", grid_gco2_per_kwh: 380, clean_factor: "46% cleaner than Mumbai", clean_badge: "Moderate Carbon", savings_vs_mumbai: "-46.3%", energy_mix: "48% Gas, 32% Nuclear, 20% Renewables" },
    { region: "eu-central-1", name: "Europe (Frankfurt)", grid_gco2_per_kwh: 310, clean_factor: "56% cleaner than Mumbai", clean_badge: "Low Carbon", savings_vs_mumbai: "-56.2%", energy_mix: "52% Wind/Solar, 30% Gas, 18% Nuclear" },
    { region: "eu-west-1", name: "Europe (Ireland - Wind)", grid_gco2_per_kwh: 280, clean_factor: "60% cleaner than Mumbai", clean_badge: "Low Carbon", savings_vs_mumbai: "-60.5%", energy_mix: "62% Wind, 28% Gas, 10% Biomass" },
    { region: "us-west-2", name: "US West (Oregon - Hydro)", grid_gco2_per_kwh: 85, clean_factor: "🌱 88% cleaner than Mumbai", clean_badge: "Ultra-Green", savings_vs_mumbai: "-88.0%", energy_mix: "74% Hydroelectric, 18% Wind, 8% Solar" },
  ];

  const gridList = data?.regional_carbon_grid || defaultGrid;
  const currentRegionCode = data?.region || awsCredentials?.region || "ap-south-1";
  const selectedRegionData = gridList.find((r) => r.region === selectedRegion) || gridList[4];
  const baselineRegionData = gridList.find((r) => r.region === currentRegionCode) || gridList[0];

  const totalKwh = data?.total_energy_kwh || 0.14;
  const currentEmissionsKg = Number(((totalKwh * (baselineRegionData.grid_gco2_per_kwh || 708)) / 1000).toFixed(3));
  const targetEmissionsKg = Number(((totalKwh * (selectedRegionData.grid_gco2_per_kwh || 85)) / 1000).toFixed(3));
  const emissionsAvoidedKg = Math.max(0, Number((currentEmissionsKg - targetEmissionsKg).toFixed(3)));
  const percentageAvoided = baselineRegionData.grid_gco2_per_kwh
    ? Math.round(((baselineRegionData.grid_gco2_per_kwh - selectedRegionData.grid_gco2_per_kwh) / baselineRegionData.grid_gco2_per_kwh) * 100)
    : 88;

  const handleCopyStrategy = () => {
    const text = `# CLOUDMIND GREENOPS ARBITRAGE STRATEGY
Date: ${new Date().toISOString().split("T")[0]}
Baseline Region: ${baselineRegionData.name} (${baselineRegionData.region}) - ${baselineRegionData.grid_gco2_per_kwh} gCO2e/kWh
Target Arbitrage Region: ${selectedRegionData.name} (${selectedRegionData.region}) - ${selectedRegionData.grid_gco2_per_kwh} gCO2e/kWh
Emissions Reduction: -${percentageAvoided}% CO2e
Grid Cleanliness: ${selectedRegionData.clean_badge} (${selectedRegionData.energy_mix || "Renewable/Hydro"})
PUE Specification: AWS Datacenter 1.15 PUE vs 1.58 Industry On-Premise Baseline
SCI Formula: SCI = ((E * I) + M) / R (Green Software Foundation Standard)

RECOMMENDED ACTIONS:
1. Route asynchronous batch pipelines, ETL workflows, and CI/CD runners to ${selectedRegionData.region}.
2. Configure multi-region AWS auto-scaling to prefer ${selectedRegionData.region} during peak local grid carbon hours.
3. Decouple stateless compute workloads from data storage to exploit zero-carbon geographic elasticity.`;
    navigator.clipboard.writeText(text);
    setCopiedStrategy(true);
    setTimeout(() => setCopiedStrategy(false), 3000);
  };

  return (
    <div className="energy-page">
      {/* HEADER */}
      <div className="energy-header">
        <div>
          <span className="panel-eyebrow">GREEN SOFTWARE FOUNDATION (SCI SPECIFICATION)</span>
          <h1>Regional Grid Carbon Arbitrage & Datacenter PUE</h1>
          <p>
            Quantify electrical carbon intensity across AWS regions, evaluate PUE datacenter overhead,
            and calculate instant emissions reduction via low-carbon region migration.
          </p>
        </div>

        <div className="energy-header-controls">
          {setActivePage && (
            <button className="secondary-button" onClick={() => setActivePage("energy")}>
              ← Energy Intelligence
            </button>
          )}
          <button className="secondary-button" onClick={loadData} disabled={loading}>
            {loading ? "Analyzing..." : "↻ Refresh Telemetry"}
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert">
          <span>!</span>
          <div>
            <strong>Unable to load live carbon telemetry</strong>
            <p>{error}</p>
          </div>
          <button onClick={loadData}>Retry</button>
        </div>
      )}

      {/* TOP GREENOPS KPI CARDS (MATCHING SPECIFICATION) */}
      <div className="greenops-kpi-grid">
        <div className="greenops-card">
          <div className="gcard-header">
            <span className="gcard-icon">⚡</span>
            <span className="gcard-badge ultra-green">AWS Benchmark</span>
          </div>
          <div className="gcard-body">
            <span className="gcard-val">1.15 PUE</span>
            <span className="gcard-title">Power Usage Effectiveness</span>
            <p className="gcard-desc">
              AWS infrastructure operates at 1.15 PUE vs industry on-premise baseline of 1.58 PUE (saves 27.2% facility overhead).
            </p>
          </div>
        </div>

        <div className="greenops-card">
          <div className="gcard-header">
            <span className="gcard-icon">🌱</span>
            <span className="gcard-badge green">Scope 2 vs Scope 3</span>
          </div>
          <div className="gcard-body">
            <div className="scope-split-row">
              <div>
                <strong>{data?.scope_breakdown?.scope_2_operational_kg || "0.10"} kg</strong>
                <small>Scope 2 (Operational)</small>
              </div>
              <div>
                <strong>{data?.scope_breakdown?.scope_3_embodied_kg || "0.03"} kg</strong>
                <small>Scope 3 (Embodied)</small>
              </div>
            </div>
            <p className="gcard-desc">
              SCI Equation: <code>SCI = ((E × I) + M) / R</code> measuring real operational and hardware lifecycle footprint.
            </p>
          </div>
        </div>

        <div className="greenops-card">
          <div className="gcard-header">
            <span className="gcard-icon">🌍</span>
            <span className="gcard-badge arbitrage">Carbon Arbitrage</span>
          </div>
          <div className="gcard-body">
            <span className="gcard-val text-emerald">
              {percentageAvoided > 0 ? `-${percentageAvoided}%` : "0%"} CO₂e
            </span>
            <span className="gcard-title">Shifting to {selectedRegionData.name.split(" ")[0]} ({selectedRegionData.region})</span>
            <p className="gcard-desc">
              Moving batch workloads from {baselineRegionData.name.split(" ")[0]} ({baselineRegionData.grid_gco2_per_kwh} gCO₂/kWh) to {selectedRegionData.name.split(" ")[0]} ({selectedRegionData.grid_gco2_per_kwh} gCO₂/kWh) avoids {percentageAvoided}% of electrical emissions.
            </p>
          </div>
        </div>
      </div>

      {/* REGIONAL CARBON GRID COMPARISON TABLE */}
      <div className="regional-grid-card">
        <div className="regional-grid-header">
          <div>
            <h3>🌐 Global AWS Grid Carbon Intensity Comparison</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
              Click <strong>Select / Compare</strong> on any AWS region to model instant emissions arbitrage against your current infrastructure.
            </p>
          </div>
          <span className="grid-source-tag">Data Source: Green Software Foundation SCI Index</span>
        </div>

        <div className="grid-table-wrapper">
          <table className="regional-grid-table">
            <thead>
              <tr>
                <th>AWS Region</th>
                <th>Grid Location</th>
                <th>Carbon Intensity</th>
                <th>Relative Cleanliness</th>
                <th>Carbon Arbitrage vs Mumbai</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {gridList.map((r) => {
                const isCurrent = r.region === currentRegionCode;
                const isSelected = r.region === selectedRegion;
                return (
                  <tr key={r.region} className={isCurrent ? "current-region-row" : ""}>
                    <td>
                      <code>{r.region}</code>
                      {isCurrent && <span className="active-region-pill">Active</span>}
                    </td>
                    <td><strong>{r.name}</strong></td>
                    <td>
                      <span className="grid-intensity-val">{r.grid_gco2_per_kwh} gCO₂e/kWh</span>
                    </td>
                    <td>
                      <span className={`clean-badge ${r.clean_badge?.toLowerCase().replace(" ", "-")}`}>
                        {r.clean_badge}
                      </span>
                    </td>
                    <td>
                      <strong className={r.savings_vs_mumbai?.startsWith("-") ? "text-emerald" : ""}>
                        {r.savings_vs_mumbai}
                      </strong>
                    </td>
                    <td>
                      <button
                        className="btn-arbitrage-select"
                        onClick={() => setSelectedRegion(r.region)}
                      >
                        {isSelected ? "✓ Selected" : "Compare"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ARBITRAGE SIMULATION & MIGRATION DEEP DIVE */}
      <div className="panel" style={{ marginTop: "24px" }}>
        <div className="panel-header">
          <div>
            <h2>Carbon Arbitrage Migration Sandbox</h2>
            <p>Model the emissions reduction achieved by routing non-latency-sensitive workloads to {selectedRegionData.name}.</p>
          </div>
          <button className="primary-button" onClick={handleCopyStrategy}>
            {copiedStrategy ? "✓ Strategy Copied!" : "📋 Export Arbitrage Strategy"}
          </button>
        </div>

        <div className="greenops-kpi-grid" style={{ marginTop: "16px", marginBottom: "16px" }}>
          <div className="greenops-card" style={{ background: "rgba(30, 41, 59, 0.4)" }}>
            <span className="gcard-title">BASELINE EMISSIONS ({baselineRegionData.region})</span>
            <span className="gcard-val" style={{ fontSize: "22px" }}>{currentEmissionsKg} kg CO₂e</span>
            <p className="gcard-desc">Grid Intensity: {baselineRegionData.grid_gco2_per_kwh} gCO₂e/kWh</p>
          </div>

          <div className="greenops-card" style={{ background: "rgba(30, 41, 59, 0.4)" }}>
            <span className="gcard-title">PROJECTED IN {selectedRegionData.region.toUpperCase()}</span>
            <span className="gcard-val text-emerald" style={{ fontSize: "22px" }}>{targetEmissionsKg} kg CO₂e</span>
            <p className="gcard-desc">Grid Intensity: {selectedRegionData.grid_gco2_per_kwh} gCO₂e/kWh</p>
          </div>

          <div className="greenops-card" style={{ background: "rgba(30, 41, 59, 0.4)" }}>
            <span className="gcard-title">NET EMISSIONS AVOIDED</span>
            <span className="gcard-val text-emerald" style={{ fontSize: "22px" }}>-{percentageAvoided}%</span>
            <p className="gcard-desc">Saves ~{(emissionsAvoidedKg * 30).toFixed(2)} kg CO₂e/month across fleet</p>
          </div>
        </div>

        <div className="interpretation-list" style={{ marginTop: "16px" }}>
          <div>
            <span>1</span>
            <div>
              <strong>Asynchronous Batch Migration (Zero Latency Penalty)</strong>
              <p>
                Scheduled reporting, video encoding, ETL pipelines, and daily database backup tasks do not require low ping to end users. Migrating these execution tasks to {selectedRegionData.name} ({selectedRegionData.region}) instantly eliminates up to {percentageAvoided}% of electrical emissions without user-facing disruption.
              </p>
            </div>
          </div>
          <div>
            <span>2</span>
            <div>
              <strong>Renewable Grid Power Advantage</strong>
              <p>
                {selectedRegionData.name} draws from a grid energy mix of {selectedRegionData.energy_mix || "hydroelectric and wind power"}, providing a clean sustainability profile recognized under Greenhouse Gas Protocol (GHGP) Scope 2 market-based accounting.
              </p>
            </div>
          </div>
          <div>
            <span>3</span>
            <div>
              <strong>Datacenter Overhead Efficiency</strong>
              <p>
                Combined with AWS's custom 1.15 PUE infrastructure design, relocating compute to a cleaner grid avoids both primary operational electricity and parasitic cooling overhead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarbonArbitrage;
