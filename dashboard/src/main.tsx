import React from "react";
import { createRoot } from "react-dom/client";
import MonitoringDashboard from "./pages/MonitoringDashboard";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MonitoringDashboard />
  </React.StrictMode>
);
