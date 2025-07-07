import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import LoginPage from '../features/auth/LoginPage';
import ConsultationPage from '../pages/ConsultationPage';

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
  // Aquí se añadirán futuras rutas protegidas como /settings, /patients, etc.
]);
