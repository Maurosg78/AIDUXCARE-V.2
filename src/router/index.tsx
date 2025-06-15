import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import AuthenticationPage from '@/pages/AuthenticationPage';
import WelcomePage from '@/pages/WelcomePage';
import PatientListPage from '@/pages/PatientListPage';
import { PatientDataPage } from '@/pages/PatientDataPage';
import PatientCompletePage from '@/pages/PatientCompletePage';

export const router = createBrowserRouter([
  // Página principal - Landing
  {
    path: '/',
    element: <WelcomePage />
  },
  {
    path: '/welcome',
    element: <WelcomePage />
  },
  
  // Autenticación - Crear/Seleccionar perfil
  {
    path: '/auth',
    element: <AuthenticationPage />
  },
  
  // Rutas protegidas - Requieren autenticación
  {
    path: '/patients',
    element: (
      <AuthGuard>
        <PatientListPage />
      </AuthGuard>
    )
  },
  {
    path: '/patient/new',
    element: (
      <AuthGuard>
        <PatientDataPage />
      </AuthGuard>
    )
  },
  {
    path: '/patient/:id',
    element: (
      <AuthGuard>
        <PatientCompletePage />
      </AuthGuard>
    )
  },
  
  // Redirecciones para rutas obsoletas
  {
    path: '/patient-list',
    element: <Navigate to="/patients" replace />
  },
  {
    path: '/patient-data',
    element: <Navigate to="/patient/new" replace />
  },
  {
    path: '/patient-complete',
    element: <Navigate to="/patients" replace />
  },
  {
    path: '/session',
    element: <Navigate to="/patients" replace />
  }
]);