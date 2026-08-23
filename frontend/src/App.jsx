import { useState } from "react";
import CloudProviders from "./components/CloudProviders";
import Sidebar from "./components/SIdebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import AIAgent from "./pages/AIAgent";
import "./App.css";


function App() {

  const [activePage, setActivePage] = useState("dashboard");


  const renderPage = () => {

    switch (activePage) {

      case "dashboard":
        return <Dashboard setActivePage={setActivePage} />;

      case "ai-agent":
        return <AIAgent />;

      

      case "providers":
        return (
          <div className="placeholder-page">
            <span>☁</span>
            <h1>Cloud Providers</h1>
            <p>
              Multi-cloud provider intelligence.
            </p>
          </div>
        );

      case "load":
        return (
          <div className="placeholder-page">
            <span>⇄</span>
            <h1>Load Balancing</h1>
            <p>
              Intelligent workload optimization.
            </p>
          </div>
        );

      case "security":
        return (
          <div className="placeholder-page">
            <span>◉</span>
            <h1>Security Center</h1>
            <p>
              AI-powered cloud security analysis.
            </p>
          </div>
        );

      case "cost":
        return (
          <div className="placeholder-page">
            <span>◆</span>
            <h1>Cost Optimizer</h1>
            <p>
              Intelligent cloud cost optimization.
            </p>
          </div>
        );

      case "energy":
        return (
          <div className="placeholder-page">
            <span>ϟ</span>
            <h1>Energy Intelligence</h1>
            <p>
              Energy-efficient cloud optimization.
            </p>
          </div>
        );

      case "analytics":
        return (
          <div className="placeholder-page">
            <span>▥</span>
            <h1>Advanced Analytics</h1>
            <p>
              Cloud performance analytics and prediction.
            </p>
          </div>
        );

      default:
        return <Dashboard />;

    }

  };


  return (

    <div className="app-layout">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="main-area">

        <Topbar />

        <main className="content">
          {renderPage()}
        </main>

      </div>

    </div>

  );
}

export default App;