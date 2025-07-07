import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import LoginPage from '../features/auth/LoginPage';
import ConsultationPage from '../pages/ConsultationPage';
import DebugAudioPage from '../pages/DebugAudioPage';

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
  // Aquí se añadirán futuras rutas protegidas como /settings, /patients, etc.
]);
