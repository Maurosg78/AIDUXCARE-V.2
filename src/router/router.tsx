import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/core/components/Layout';
import ProfessionalWorkflowPage from '@/pages/ProfessionalWorkflowPage';
import LoginPage from '@/pages/LoginPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';

export const router = createBrowserRouter([
  // Página principal protegida: ProfessionalWorkflowPage en la raíz
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ProfessionalWorkflowPage />
      </ProtectedRoute>
    ),
  },
  // Login
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Rutas principales con layout profesional
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "professional-workflow",
        element: <ProfessionalWorkflowPage />,
      },
      {
        path: "patients",
        element: <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Pacientes</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Módulo de pacientes en desarrollo</p>
          </div>
        </div>
      },
      {
        path: "notes",
        element: <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Notas Clínicas</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Módulo de notas en desarrollo</p>
          </div>
        </div>
      },
      {
        path: "profile",
        element: <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Configuración de perfil en desarrollo</p>
          </div>
        </div>
      },
      {
        path: "settings",
        element: <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Configuración del sistema en desarrollo</p>
          </div>
        </div>
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
]); 