/**
 * AiDuxCare — App Entry Point
 * Market: CA | Language: en-CA
 * Phase: 2A (Legal UI Integration)
 * WO: WO-2024-002
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🧩 Páginas principales
import HomePage from "./pages/HomePage";
import PatientConsentPage from "./pages/PatientConsentPage";
import ProfessionalWorkflowPage from "./pages/ProfessionalWorkflowPage";
import LegalAuditDashboard from "./pages/LegalAuditDashboard";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Toaster position="top-right" />

        <Routes>
          {/* 🏠 Página principal */}
          <Route path="/" element={<HomePage />} />

          {/* 🧠 Página de flujo profesional */}
          <Route path="/workflow" element={<ProfessionalWorkflowPage />} />

          {/* ✅ Página de consentimiento informado PIPEDA/PHIPA */}
          <Route path="/patient-consent" element={<PatientConsentPage />} />

          {/* 🧾 Panel de auditoría legal (solo CPO/Admin) */}
          <Route path="/legal-audit" element={<LegalAuditDashboard />} />

          {/* 🚧 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
