import React, { useState } from "react";
import "./index.css";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

import { Home } from "./pages/Home";
import { Monitoring } from "./pages/Monitoring";
import { HealthAI } from "./pages/HealthAI";
import { AlertsHistory } from "./pages/AlertsHistory";
import { Reports } from "./pages/Reports";
import { DeviceStatus } from "./pages/DeviceStatus";

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":       return <Home setActiveTab={setActiveTab} />;
      case "monitoring": return <Monitoring />;
      case "health":     return <HealthAI />;
      case "alerts":     return <AlertsHistory />;
      case "reports":    return <Reports />;
      case "device":     return <DeviceStatus />;
      default:           return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        minHeight: "100vh", 
        backgroundColor: "var(--bg-canvas)", 
        color: "var(--text-primary)" 
      }}
    >
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, width: "100%" }}>
        <div
          key={activeTab}
          className="page-enter"
          style={{ 
            maxWidth: "var(--page-max-width)", 
            margin: "0 auto", 
            padding: "clamp(24px, 3vw, 40px) clamp(16px, 3.2vw, 52px) 80px", 
            width: "100%" 
          }}
        >
          {renderContent()}
        </div>
      </main>
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
