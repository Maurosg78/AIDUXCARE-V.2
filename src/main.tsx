import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Configuración global para desarrollo
if (import.meta.env.DEV) {
  console.log("🚀 AiDuxCare V.2 - Modo Desarrollo - Fase 3");
  console.log("📍 Página Principal:", "http://localhost:3000/");
  console.log("🔐 Autenticación:", "http://localhost:3000/auth");
  console.log("🏥 Página Completa Paciente:", "http://localhost:3000/patient-complete");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  // Temporalmente deshabilitado StrictMode para evitar problemas con hooks
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
);