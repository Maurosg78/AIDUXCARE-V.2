import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import RegisterPage from "./features/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfessionalWorkflowPage from "./pages/ProfessionalWorkflowPage";
import DebugAudioPage from "./pages/DebugAudioPage";
import TestFullWorkflowPage from "./pages/TestFullWorkflowPage";
import PatientHistoryPage from "./pages/PatientHistoryPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/professional-workflow" element={<ProfessionalWorkflowPage />} />
        <Route path="/debug-audio" element={<DebugAudioPage />} />
        <Route path="/test-workflow" element={<TestFullWorkflowPage />} />
        <Route path="/patient-history/:patientId" element={<PatientHistoryPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
