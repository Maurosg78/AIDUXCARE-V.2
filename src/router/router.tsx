import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/core/components/Layout';
import { ProfessionalWorkflowPage } from '@/pages/ProfessionalWorkflowPage';
import LoginPage from '@/pages/LoginPage';
import AccessPage from '@/pages/AccessPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AuditPage } from '@/features/admin/AuditPage';
import { AuditMetricsDashboard } from '@/features/admin/AuditMetricsDashboard';
import OrganizationTeamPage from '../pages/OrganizationTeamPage';
import OrganizationDashboardPage from '../pages/OrganizationDashboardPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import MFAGuidePage from '../pages/MFAGuidePage';
import OnboardingConfirmationPage from '../pages/OnboardingConfirmationPage';
import ProfessionalOnboardingPage from '../pages/ProfessionalOnboardingPage';
import ClinicalInfoPage from '../pages/ClinicalInfoPage';
import HumanFigurePage from '../pages/HumanFigurePage';
import SOAPEditorPage from '../pages/SOAPEditorPage';

// Configuración de future flags para React Router v7
const future = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

export const router = createBrowserRouter([
  // Página principal: Acceso directo
  {
    path: '/',
    element: <AccessPage />,
  },
  // Login
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Onboarding
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  // Onboarding Profesional - SIN LAYOUT
  {
    path: '/professional-onboarding',
    element: (
      <ProtectedRoute>
        <ProfessionalOnboardingPage />
      </ProtectedRoute>
    ),
  },
  // Páginas de Documentación - PÚBLICAS
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/mfa-guide',
    element: <MFAGuidePage />,
  },
  // Página de Confirmación de Onboarding - PÚBLICA
  {
    path: '/onboarding-confirmation',
    element: <OnboardingConfirmationPage />,
  },

  // Rutas principales con layout profesional - PROTEGIDAS
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "professional-workflow",
        element: (
          <ProtectedRoute>
            <ProfessionalWorkflowPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "clinical-info",
        element: (
          <ProtectedRoute>
            <ClinicalInfoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "human-figure",
        element: (
          <ProtectedRoute>
            <HumanFigurePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "soap-editor",
        element: (
          <ProtectedRoute>
            <SOAPEditorPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "audit",
        element: (
          <ProtectedRoute requiredRoles={['ADMIN', 'OWNER']}>
            <AuditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "audit-metrics",
        element: (
          <ProtectedRoute requiredRoles={['ADMIN', 'OWNER']}>
            <AuditMetricsDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "patients",
        element: (
          <ProtectedRoute>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Pacientes</h1>
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Módulo de pacientes en desarrollo</p>
              </div>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: "notes",
        element: (
          <ProtectedRoute>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Notas Clínicas</h1>
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Módulo de notas en desarrollo</p>
              </div>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Configuración de perfil en desarrollo</p>
              </div>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración</h1>
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Configuración del sistema en desarrollo</p>
              </div>
            </div>
          </ProtectedRoute>
        )
      },

      // Rutas de Organización
      {
        path: "organization",
        children: [
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <OrganizationDashboardPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "team",
            element: (
              <ProtectedRoute requiredRoles={['ADMIN', 'OWNER']}>
                <OrganizationTeamPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "patients",
            element: (
              <ProtectedRoute>
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Pacientes de la Organización</h1>
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">Gestión de pacientes de la organización en desarrollo</p>
                  </div>
                </div>
              </ProtectedRoute>
            ),
          },
          {
            path: "analytics",
            element: (
              <ProtectedRoute requiredRoles={['ADMIN', 'OWNER']}>
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics de la Organización</h1>
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">Analytics y métricas de la organización en desarrollo</p>
                  </div>
                </div>
              </ProtectedRoute>
            ),
          },
          {
            path: "audit",
            element: (
              <ProtectedRoute requiredRoles={['ADMIN', 'OWNER']}>
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Auditoría de la Organización</h1>
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">Logs de auditoría de la organización en desarrollo</p>
                  </div>
                </div>
              </ProtectedRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <ProtectedRoute requiredRoles={['ADMIN', 'OWNER']}>
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración de la Organización</h1>
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">Configuración de la organización en desarrollo</p>
                  </div>
                </div>
              </ProtectedRoute>
            ),
          },
        ],
      },
    ]
  },

  // Página de error 404
  {
    path: "*",
    element: <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
        <a 
          href="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  }
], { future }); 