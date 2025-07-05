import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import ConsultationPage from '@/pages/ConsultationPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/consultation-workspace',
    element: (
      <ProtectedRoute>
        <ConsultationPage />
      </ProtectedRoute>
    ),
  },
  // Página de error 404
  {
    path: '*',
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