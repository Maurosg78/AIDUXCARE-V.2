import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/core/components/Layout';
import { ProfessionalWorkflowPage } from '@/pages/ProfessionalWorkflowPage';
import LoginPage from '@/pages/LoginPage';
import AccessPage from '@/pages/AccessPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AuditPage } from '@/features/admin/AuditPage';
import { AuditMetricsDashboard } from '@/features/admin/AuditMetricsDashboard';

// Importaciones premium con nombres únicos
import { PremiumLoginPage_20250731, PremiumWorkflowPage_20250731 } from '@/pages/premium';

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

  // RUTAS PREMIUM - NUEVAS CON NOMBRES ÚNICOS
  {
    path: '/premium-login',
    element: <PremiumLoginPage_20250731 />,
  },
  {
    path: '/premium-workflow',
    element: <PremiumWorkflowPage_20250731 />,
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