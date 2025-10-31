import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 🧩 Páginas principales
import HomePage from "./pages/HomePage"; // si no existe, se creará luego
import ProfessionalWorkflowPage from "./pages/ProfessionalWorkflowPage";
import PatientConsentPage from "./pages/PatientConsentPage";

// 🛠️ (opcional) componentes comunes
import { Toaster } from "react-hot-toast";

// ⚙️ Configuración general de la app
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Toaster position="top-right" />

        <Routes>
          {/* 🏠 Página principal */}
          <Route path="/" element={<HomePage />} />

          {/* 🧠 Página de flujo profesional */}
          <Route path="/workflow" element={<ProfessionalWorkflowPage />} />

          {/* ✅ NUEVA RUTA: Consentimiento informado PIPEDA */}
          <Route
            path="/patient-consent"
            element={<PatientConsentPage />}
          />

          {/* 🚫 Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}