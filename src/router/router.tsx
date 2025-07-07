import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import LoginPage from '../features/auth/LoginPage';
import ConsultationPage from '../pages/ConsultationPage';
import DebugAudioPage from '../pages/DebugAudioPage';
import { DebugCloudFunctionPage } from '../pages/DebugCloudFunctionPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ConsultationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/debug-audio',
    element: (
      <ProtectedRoute>
        <DebugAudioPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/debug-cloud-function',
    element: (
      <ProtectedRoute>
        <DebugCloudFunctionPage />
      </ProtectedRoute>
    ),
  },
  // Aquí se añadirán futuras rutas protegidas como /settings, /patients, etc.
]);
