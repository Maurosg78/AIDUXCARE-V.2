import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/core/components/Layout';
import HomePage from '@/pages/HomePage';
import WelcomePage from '@/pages/WelcomePage';
import AudioProcessingPage from '@/pages/AudioProcessingPage';
import ProfessionalWorkflowPage from '@/pages/ProfessionalWorkflowPage';
import PreSessionPatientViewPage from '@/pages/PreSessionPatientViewPage';
import MVPCorePage from '@/pages/MVPCorePage';

export const router = createBrowserRouter([
  // Página de bienvenida (sin layout)
  {
    path: "/",
    element: <HomePage />,
  },
  
  // Rutas principales con layout profesional
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "mvp-core",
        element: <MVPCorePage />,
      },
      {
        path: "professional-workflow",
        element: <ProfessionalWorkflowPage />,
      },
      {
        path: "audio-processing", 
        element: <AudioProcessingPage />,
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
], {
  // Future flags for React Router v6 - Eliminates deprecation warnings
  future: {
    v7_relativeSplatPath: true
  }
});