function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "ai-agent", icon: "✦", label: "AI Cloud Agent" },
    { id: "providers", icon: "☁", label: "Cloud Providers" },
    { id: "load", icon: "⇄", label: "Load Balancing" },
    { id: "security", icon: "◉", label: "Security" },
    { id: "energy", icon: "ϟ", label: "Energy" },
  ];

  return (
    <aside className="sidebar">

      <div className="logo">
        <div className="logo-icon">☁</div>

        <div>
          <h2>CloudMind</h2>
          <span>AI PLATFORM</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="section-label">WORKSPACE</span>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">

        <div className="system-status">
          <div className="status-dot"></div>

          <div>
            <strong>System Healthy</strong>
            <span>All services operational</span>
          </div>
        </div>

        <button className="nav-item">
          <span className="nav-icon">⚙</span>
          <span>Settings</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;