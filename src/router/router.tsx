// @ts-nocheck
import React from 'react';
import { createBrowserRouter, useParams } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';
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
import OnboardingPage from '../pages/OnboardingPage';
import { EmailVerifiedPage } from '../pages/EmailVerifiedPage';
import HospitalPortalPage from '../pages/HospitalPortalPage';
import HospitalPortalLandingPage from '../pages/HospitalPortalLandingPage';
import InpatientPortalPage from '../pages/InpatientPortalPage';
import PublicLandingPage from '../pages/PublicLandingPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import AuthActionPage from '../pages/AuthActionPage';

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

const router = createBrowserRouter([
  { path: '/', element: <HospitalPortalLandingPage /> }, // Main landing page - Hospital Portal
  { path: '/login', element: <LoginPage /> }, // Login page
  { path: '/register', element: <RegisterPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
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
  { path: '/consent-verification/:patientId', element: <AuthGuard><LayoutWrapper><ConsentVerificationPage /></LayoutWrapper></AuthGuard> },
  { path: '/consent/:token', element: <ConsentVerificationPage /> }, // Public consent link (no auth required)
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> }, // Alias for /privacy (SMS links use this)
  { path: '/hospital', element: <HospitalPortalLandingPage /> }, // Landing page with two cards
  { path: '/hospital/inpatient', element: <InpatientPortalPage /> }, // Inpatient portal with trace number
  { path: '/hospital/note', element: <HospitalPortalPage /> }, // Original note code portal (legacy)
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '/terms', element: <TermsOfServicePage /> },
  { path: '/public', element: <PublicLandingPage /> },
]);

export default router; 