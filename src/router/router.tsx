// @ts-nocheck
import React from 'react';
import { createBrowserRouter, useParams, Navigate, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import { isSpainPilot } from '@/core/pilotDetection';
import { AuthGuard } from '../components/AuthGuard';
import { useAuth } from '../hooks/useAuth';
import { AuthOnlyGuard } from '../components/AuthOnlyGuard';
import { CommandCenterPageSprint3 } from '../features/command-center/CommandCenterPageSprint3';
import { WelcomePage } from '../pages/WelcomePage';
import LoginPage from '../pages/LoginPage';
import { PatientListPage } from '../pages/PatientsPage';
import { PatientDashboardPage } from '../features/patient-dashboard/PatientDashboardPage';
import { AppointmentListPage } from '../pages/AppointmentsPage';
import { AppointmentDetailPage } from '../pages/AppointmentsPage';
import { NotesListPage } from '../pages/NotesPage';
import { NoteDetailPage } from '../pages/NotesPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import ProfessionalWorkflowPage from '../pages/ProfessionalWorkflowPage';
import FollowUpRedirect from '../pages/FollowUpRedirect';
import { ConsentVerificationPage } from '../pages/ConsentVerificationPage';
import { PatientConsentPortalPage } from '../pages/PatientConsentPortalPage';
import DisclosurePage from '../pages/DisclosurePage';
import ConsentSuccessPage from '../pages/ConsentSuccessPage';
import OnboardingPage from '../pages/OnboardingPage';
import { ProfessionalOnboardingPage } from '../pages/ProfessionalOnboardingPage';
import { EmailVerifiedPage } from '../pages/EmailVerifiedPage';
import HospitalPortalPage from '../pages/HospitalPortalPage';
import HospitalPortalLandingPage from '../pages/HospitalPortalLandingPage';
import UnifiedLandingPage from '../pages/UnifiedLandingPage';
import InpatientPortalPage from '../pages/InpatientPortalPage';
import PublicLandingPage from '../pages/PublicLandingPage';
import LandingPage from '../landing/pages/LandingPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import AuthActionPage from '../pages/AuthActionPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetCompletePage } from '../pages/ResetCompletePage';
import TechDashboard from '../pages/Dashboard/TechDashboard';
import GrowthDashboard from '../pages/Dashboard/GrowthDashboard';
import { FeedbackReviewPage } from '../pages/FeedbackReviewPage';
import ErrorBoundary from '../components/ErrorBoundary';

// LayoutWrapper — Branding oficial: hoja de maple + AiDuxCare (gradient púrpura-azul), fijo en todas las pantallas
// WO-PILOT-FIX-03: Logout button visible on every authenticated page
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AiDuxCare
              </h1>
              {!isSpainPilot() && <span className="text-xl" aria-hidden>🍁</span>}
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}

// Wrapper para NoteDetailPage que obtiene el id de los parámetros
function NoteDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  return <NoteDetailPage id={id || ''} />;
}

export const createRouter = () => createBrowserRouter([
  // Root: unified landing (Hospital Patient / Private Practice / Get Started)
  { path: '/', element: <UnifiedLandingPage /> }, // Main landing page
  { path: '/login', element: <LoginPage /> }, // Login page
  { path: '/register', element: <RegisterPage /> },
  // WO-ONB-UNIFY-01: Redirigir /onboarding a /professional-onboarding (único proceso de onboarding)
  // Todos los usuarios (nuevos y existentes) usan el mismo formulario ProfessionalOnboardingPage
  { path: '/onboarding', element: <Navigate to="/professional-onboarding" replace /> },
  // WO-ONB-SIGNUP-01: /professional-onboarding permite acceso sin autenticación para nuevos usuarios
  // Si el usuario no está autenticado, puede crear cuenta durante el onboarding
  // WO-UX-AUTH-SHELL-01: ProfessionalOnboardingPage tiene su propio shell (igual que LoginPage), no necesita LayoutWrapper
  { path: '/professional-onboarding', element: <ProfessionalOnboardingPage /> },
  { path: '/verify-email', element: <EmailVerifiedPage /> },
  { path: '/email-verified', element: <EmailVerifiedPage /> },
  { path: '/auth/action', element: <AuthActionPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-complete', element: <ResetCompletePage /> },
  {
    path: '/command-center',
    element: <AuthGuard><LayoutWrapper><CommandCenterPageSprint3 /></LayoutWrapper></AuthGuard>
  },
  { path: '/feedback-review', element: <AuthGuard><LayoutWrapper><FeedbackReviewPage /></LayoutWrapper></AuthGuard> },
  { path: '/patients', element: <AuthGuard><LayoutWrapper><PatientListPage /></LayoutWrapper></AuthGuard> },
  { path: '/patients/:id/history', element: <AuthGuard><LayoutWrapper><PatientDashboardPage /></LayoutWrapper></AuthGuard> }, // alias: same content as /patients/:id
  { path: '/patients/:id', element: <AuthGuard><LayoutWrapper><PatientDashboardPage /></LayoutWrapper></AuthGuard> },
  { path: '/appointments', element: <AuthGuard><LayoutWrapper><AppointmentListPage /></LayoutWrapper></AuthGuard> },
  { path: '/appointments/:id', element: <AuthGuard><LayoutWrapper><AppointmentDetailPage /></LayoutWrapper></AuthGuard> },
  { path: '/notes', element: <AuthGuard><LayoutWrapper><NotesListPage /></LayoutWrapper></AuthGuard> },
  { path: '/notes/:id', element: <AuthGuard><LayoutWrapper><NoteDetailWrapper /></LayoutWrapper></AuthGuard> },
  { path: '/workflow', element: <AuthGuard><LayoutWrapper><ErrorBoundary><ProfessionalWorkflowPage /></ErrorBoundary></LayoutWrapper></AuthGuard> },
  { path: '/workflow/:sessionId', element: <AuthGuard><LayoutWrapper><ErrorBoundary><ProfessionalWorkflowPage /></ErrorBoundary></LayoutWrapper></AuthGuard> },
  // MVP longitudinal: follow-up workflows unified in ProfessionalWorkflowPage so SOAP → encounter → trajectory → memory pipeline always runs
  { path: '/follow-up', element: <AuthGuard><FollowUpRedirect /></AuthGuard> },
  { path: '/dashboard/tech', element: <AuthGuard><LayoutWrapper><TechDashboard /></LayoutWrapper></AuthGuard> },
  { path: '/dashboard/growth', element: <AuthGuard><LayoutWrapper><GrowthDashboard /></LayoutWrapper></AuthGuard> },
  // ✅ T2: Legacy/internal page — do not verify without token (redirects to /consent/:token if token provided)
  { path: '/consent-verification/:patientId', element: <AuthGuard><LayoutWrapper><ConsentVerificationPage /></LayoutWrapper></AuthGuard> },
  { path: '/consent/:token', element: <PatientConsentPortalPage /> }, // ✅ Public consent link (no auth required) - ÚNICA ruta de verificación real
  { path: '/consent/success', element: <ConsentSuccessPage /> }, // ✅ Terminal success page (prevents back navigation)
  { path: '/disclosure/:patientId', element: <DisclosurePage /> }, // ✅ Public disclosure document (SMS link after verbal consent)
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> }, // Alias for /privacy (SMS links use this)
  { path: '/hospital', element: <HospitalPortalLandingPage /> }, // Landing page with two cards
  { path: '/hospital/inpatient', element: <InpatientPortalPage /> }, // Inpatient portal with trace number
  { path: '/hospital/note', element: <HospitalPortalPage /> }, // Original note code portal (legacy)
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '/terms', element: <TermsOfServicePage /> },
  { path: '/public', element: <PublicLandingPage /> },
  { path: '/landing', element: <LandingPage /> },
]);

// Mantener exportación por defecto para compatibilidad
const router = createRouter();
export default router; 