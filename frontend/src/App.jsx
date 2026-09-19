import { useEffect, useState } from "react";

import { supabase } from "./utils/supabase";

import CloudProviders from "./components/CloudProviders";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import AIAgent from "./pages/AIAgent";
import Login from "./pages/Login";
import Security from "./pages/Security";
import Energy from "./pages/Energy";
import LoadBalancing from "./pages/LoadBalancing";
import Settings from "./pages/Settings";

import "./App.css";


function App() {

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activePage, setActivePage] = useState("dashboard");

  // ==========================================
  // GLOBAL AWS CREDENTIALS (USED BY ALL PAGES)
  // ==========================================
  const [awsCredentials, setAwsCredentials] = useState(() => {
    try {
      const saved =
        localStorage.getItem("cloudmind_aws_credentials") ||
        sessionStorage.getItem("cloudmind_aws_credentials") ||
        localStorage.getItem("cloudmind_aws_security_creds");

      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          accessKeyId: parsed.accessKeyId || "",
          secretAccessKey: parsed.secretAccessKey || "",
          sessionToken: parsed.sessionToken || "",
          region: parsed.region || "ap-south-1",
          useServerDefaults:
            parsed.useServerDefaults !== undefined
              ? parsed.useServerDefaults
              : parsed.accessKeyId
              ? false
              : true,
          accountId: parsed.accountId || null,
          arn: parsed.arn || null,
        };
      }
    } catch (e) {
      console.warn("Failed to load saved AWS credentials", e);
    }
    return {
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
      region: "ap-south-1",
      useServerDefaults: true,
      accountId: null,
      arn: null,
    };
  });

  const updateAwsCredentials = (newCreds) => {
    setAwsCredentials((prev) => {
      const updated = { ...prev, ...newCreds };
      try {
        localStorage.setItem(
          "cloudmind_aws_credentials",
          JSON.stringify(updated)
        );
        localStorage.setItem(
          "cloudmind_aws_security_creds",
          JSON.stringify(updated)
        );
      } catch (e) {
        console.warn("Could not persist AWS credentials", e);
      }
      return updated;
    });
  };


  // ==========================================
  // CHECK SUPABASE SESSION
  // ==========================================

  useEffect(() => {

    let mounted = true;

    const getSession = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setAuthLoading(false);
      }

    };

    getSession();


    // ========================================
    // LISTEN FOR LOGIN / LOGOUT
    // ========================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        setSession(session);

      }
    );


    return () => {

      mounted = false;

      subscription.unsubscribe();

    };

  }, []);


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setActivePage("dashboard");

  };


  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (authLoading) {

    return (
      <div className="auth-loading">

        <div className="auth-loading-logo">
          ☁
        </div>

        <p>
          Loading CloudMind...
        </p>

      </div>
    );

  }


  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!session) {

    return <Login />;

  }


  // ==========================================
  // PAGE ROUTING
  // ==========================================

  const renderPage = () => {

    switch (activePage) {

      case "dashboard":

        return (
          <Dashboard
            setActivePage={setActivePage}
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );


      case "ai-agent":

        return (
          <AIAgent
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );


      case "providers":

         return (
           <CloudProviders
             awsCredentials={awsCredentials}
             updateAwsCredentials={updateAwsCredentials}
           />
         );


      case "load":

        return (
          <LoadBalancing
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );


      case "security":

        return (
          <Security
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );


      case "energy":

        return (
          <Energy
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );


      case "settings":

        return (
          <Settings
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );


      default:

        return (
          <Dashboard
            setActivePage={setActivePage}
            awsCredentials={awsCredentials}
            updateAwsCredentials={updateAwsCredentials}
          />
        );

    }

  };


  // ==========================================
  // MAIN APP
  // ==========================================

  return (

    <div className="app-layout">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
      />


      <div className="main-area">

        <Topbar
          onLogout={handleLogout}
          user={session.user}
          setActivePage={setActivePage}
          awsCredentials={awsCredentials}
          updateAwsCredentials={updateAwsCredentials}
        />


        <main className="content">

          {renderPage()}

        </main>

      </div>

    </div>

  );

}


export default App;