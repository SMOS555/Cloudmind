import React from "react";

const providers = [
  {
    name: "Amazon Web Services",
    short: "AWS",
    icon: "aws",
    status: "Connected",
    region: "ap-south-1",
    instances: 24,
    cpu: 68,
    memory: 61,
    cost: "₹18,420",
    health: 94,
  },
  {
    name: "Microsoft Azure",
    short: "AZ",
    icon: "azure",
    status: "Connected",
    region: "Central India",
    instances: 17,
    cpu: 54,
    memory: 48,
    cost: "₹13,870",
    health: 91,
  },
  {
    name: "Google Cloud Platform",
    short: "GCP",
    icon: "gcp",
    status: "Connected",
    region: "asia-south1",
    instances: 11,
    cpu: 47,
    memory: 43,
    cost: "₹9,980",
    health: 96,
  },
];

function CloudProviders() {
  return (
    <div className="providers-page">

      {/* HEADER */}
      <div className="providers-header">
        <div>
          <div className="eyebrow">CLOUD INFRASTRUCTURE</div>

          <h1>Cloud Providers</h1>

          <p>
            Monitor and manage your connected cloud environments.
          </p>
        </div>

        <button className="provider-add-button">
          + Add Cloud Account
        </button>
      </div>

      {/* SUMMARY */}
      <div className="provider-summary">

        <div className="provider-summary-card">
          <span>Connected Providers</span>
          <strong>3</strong>
          <small>All systems operational</small>
        </div>

        <div className="provider-summary-card">
          <span>Total Instances</span>
          <strong>52</strong>
          <small>Across all providers</small>
        </div>

        <div className="provider-summary-card">
          <span>Average CPU</span>
          <strong>56%</strong>
          <small className="green-text">Healthy utilization</small>
        </div>

        <div className="provider-summary-card">
          <span>Monthly Cloud Cost</span>
          <strong>₹42.3K</strong>
          <small className="red-text">↑ 8.4% this month</small>
        </div>

      </div>

      {/* PROVIDER CARDS */}
      <div className="providers-section">

        <div className="section-heading">
          <div>
            <h2>Connected Cloud Accounts</h2>
            <p>Current infrastructure across your providers</p>
          </div>

          <select>
            <option>All Providers</option>
            <option>AWS</option>
            <option>Azure</option>
            <option>GCP</option>
          </select>
        </div>

        <div className="provider-cards">

          {providers.map((provider) => (
            <div className="cloud-provider-card" key={provider.short}>

              {/* CARD TOP */}
              <div className="provider-card-top">

                <div className={`provider-brand ${provider.icon}`}>
                  {provider.short}
                </div>

                <div className="provider-name">
                  <h3>{provider.name}</h3>
                  <span>
                    <i className="provider-status-dot"></i>
                    {provider.status}
                  </span>
                </div>

                <button className="provider-menu">•••</button>

              </div>

              {/* HEALTH */}
              <div className="provider-health">

                <div>
                  <span>Health Score</span>

                  <strong>
                    {provider.health}
                    <small>/100</small>
                  </strong>
                </div>

                <div className="health-circle">
                  {provider.health}%
                </div>

              </div>

              {/* METRICS */}
              <div className="provider-metrics">

                <div>
                  <span>Region</span>
                  <strong>{provider.region}</strong>
                </div>

                <div>
                  <span>Instances</span>
                  <strong>{provider.instances}</strong>
                </div>

                <div>
                  <span>Monthly Cost</span>
                  <strong>{provider.cost}</strong>
                </div>

              </div>

              {/* CPU */}
              <div className="resource-row">

                <div className="resource-label">
                  <span>CPU Utilization</span>
                  <strong>{provider.cpu}%</strong>
                </div>

                <div className="resource-bar">
                  <div style={{ width: `${provider.cpu}%` }}></div>
                </div>

              </div>

              {/* MEMORY */}
              <div className="resource-row">

                <div className="resource-label">
                  <span>Memory Utilization</span>
                  <strong>{provider.memory}%</strong>
                </div>

                <div className="resource-bar memory">
                  <div style={{ width: `${provider.memory}%` }}></div>
                </div>

              </div>

              {/* BUTTON */}
              <button className="view-provider">
                View Infrastructure →
              </button>

            </div>
          ))}

        </div>

      </div>

      {/* BOTTOM PANEL */}
      <div className="provider-bottom-grid">

        <div className="provider-panel">

          <div className="panel-title">
            <div>
              <h2>Infrastructure Distribution</h2>
              <p>Instances deployed across providers</p>
            </div>
          </div>

          <div className="distribution">

            <div className="distribution-row">
              <div className="distribution-info">
                <span className="distribution-dot aws-dot"></span>
                <strong>AWS</strong>
              </div>

              <div className="distribution-bar">
                <div style={{ width: "46%" }}></div>
              </div>

              <span>24 instances</span>
            </div>

            <div className="distribution-row">
              <div className="distribution-info">
                <span className="distribution-dot azure-dot"></span>
                <strong>Azure</strong>
              </div>

              <div className="distribution-bar azure-bar">
                <div style={{ width: "33%" }}></div>
              </div>

              <span>17 instances</span>
            </div>

            <div className="distribution-row">
              <div className="distribution-info">
                <span className="distribution-dot gcp-dot"></span>
                <strong>GCP</strong>
              </div>

              <div className="distribution-bar gcp-bar">
                <div style={{ width: "21%" }}></div>
              </div>

              <span>11 instances</span>
            </div>

          </div>

        </div>

        <div className="provider-panel">

          <div className="panel-title">
            <div>
              <h2>Provider Status</h2>
              <p>Real-time infrastructure status</p>
            </div>
          </div>

          <div className="provider-status-list">

            <div>
              <span>
                <i className="status-green"></i>
                AWS
              </span>

              <strong>Operational</strong>
            </div>

            <div>
              <span>
                <i className="status-green"></i>
                Azure
              </span>

              <strong>Operational</strong>
            </div>

            <div>
              <span>
                <i className="status-green"></i>
                Google Cloud
              </span>

              <strong>Operational</strong>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CloudProviders;