// @ts-nocheck
import React from 'react';
import { createBrowserRouter, useParams, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';
import { AuthOnlyGuard } from '../components/AuthOnlyGuard';
import { CommandCenterPageSprint3 } from '../features/command-center/CommandCenterPageSprint3';
import { WelcomePage } from '../pages/WelcomePage';
import LoginPage from '../pages/LoginPage';
import { PatientListPage } from '../pages/PatientsPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';
import { AppointmentListPage } from '../pages/AppointmentsPage';
import { AppointmentDetailPage } from '../pages/AppointmentsPage';
import { NotesListPage } from '../pages/NotesPage';
import { NoteDetailPage } from '../pages/NotesPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import ProfessionalWorkflowPage from '../pages/ProfessionalWorkflowPage';
import { ConsentVerificationPage } from '../pages/ConsentVerificationPage';
import { PatientConsentPortalPage } from '../pages/PatientConsentPortalPage';
import OnboardingPage from '../pages/OnboardingPage';
import { ProfessionalOnboardingPage } from '../pages/ProfessionalOnboardingPage';
import { EmailVerifiedPage } from '../pages/EmailVerifiedPage';
import HospitalPortalPage from '../pages/HospitalPortalPage';
import HospitalPortalLandingPage from '../pages/HospitalPortalLandingPage';
import UnifiedLandingPage from '../pages/UnifiedLandingPage';
import InpatientPortalPage from '../pages/InpatientPortalPage';
import PublicLandingPage from '../pages/PublicLandingPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import AuthActionPage from '../pages/AuthActionPage';
import TechDashboard from '../pages/Dashboard/TechDashboard';
import GrowthDashboard from '../pages/Dashboard/GrowthDashboard';

// LayoutWrapper simple
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-slate-900">AiDuxCare</h1>
              </div>
            </div>
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
  { path: '/', element: <UnifiedLandingPage /> }, // Main landing page - Unified (Hospital, Private Practice, Get Started)
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
  {
    path: '/command-center',
    element: <AuthGuard><LayoutWrapper><CommandCenterPageSprint3 /></LayoutWrapper></AuthGuard>
  },
  { path: '/patients', element: <AuthGuard><LayoutWrapper><PatientListPage /></LayoutWrapper></AuthGuard> },
  { path: '/patients/:id', element: <AuthGuard><LayoutWrapper><PatientDetailPage /></LayoutWrapper></AuthGuard> },
  { path: '/appointments', element: <AuthGuard><LayoutWrapper><AppointmentListPage /></LayoutWrapper></AuthGuard> },
  { path: '/appointments/:id', element: <AuthGuard><LayoutWrapper><AppointmentDetailPage /></LayoutWrapper></AuthGuard> },
  { path: '/notes', element: <AuthGuard><LayoutWrapper><NotesListPage /></LayoutWrapper></AuthGuard> },
  { path: '/notes/:id', element: <AuthGuard><LayoutWrapper><NoteDetailWrapper /></LayoutWrapper></AuthGuard> },
  { path: '/workflow', element: <AuthGuard><LayoutWrapper><ProfessionalWorkflowPage /></LayoutWrapper></AuthGuard> },
  { path: '/workflow/:sessionId', element: <AuthGuard><LayoutWrapper><ProfessionalWorkflowPage /></LayoutWrapper></AuthGuard> },
  { path: '/dashboard/tech', element: <AuthGuard><LayoutWrapper><TechDashboard /></LayoutWrapper></AuthGuard> },
  { path: '/dashboard/growth', element: <AuthGuard><LayoutWrapper><GrowthDashboard /></LayoutWrapper></AuthGuard> },
  { path: '/consent-verification/:patientId', element: <AuthGuard><LayoutWrapper><ConsentVerificationPage /></LayoutWrapper></AuthGuard> },
  { path: '/consent/:token', element: <PatientConsentPortalPage /> }, // Public consent link (no auth required) - Prioridad 2: Implementado
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> }, // Alias for /privacy (SMS links use this)
  { path: '/hospital', element: <HospitalPortalLandingPage /> }, // Landing page with two cards
  { path: '/hospital/inpatient', element: <InpatientPortalPage /> }, // Inpatient portal with trace number
  { path: '/hospital/note', element: <HospitalPortalPage /> }, // Original note code portal (legacy)
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '/terms', element: <TermsOfServicePage /> },
  { path: '/public', element: <PublicLandingPage /> },
]);

// Mantener exportación por defecto para compatibilidad
const router = createRouter();
export default router; 