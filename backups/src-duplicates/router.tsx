import Wizard from "./features/onboarding/Wizard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VerifyEmailPage from "./features/auth/VerifyEmailPage";

import DashboardPage from "./pages/DashboardPage";
import ProfessionalWorkflowPage from "./pages/ProfessionalWorkflowPage";
import DebugAudioPage from "./pages/DebugAudioPage";
import TestFullWorkflowPage from "./pages/TestFullWorkflowPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Canonical Auth Flow (CA) */}
	<Route path="/onboarding" element={<Wizard />} />
<Route path="/confirmation" element={<ConfirmationPage />} />        <Route path="/verify-email" element={<VerifyEmailPage />} />
	
        {/* Other existing pages */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/professional-workflow" element={<ProfessionalWorkflowPage />} />
        <Route path="/debug-audio" element={<DebugAudioPage />} />
        <Route path="/test-workflow" element={<TestFullWorkflowPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
