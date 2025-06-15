import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import AuthenticationPage from '@/pages/AuthenticationPage';
import WelcomePage from '@/pages/WelcomePage';
import SmartDashboard from '@/pages/SmartDashboard';
import PatientSelectionPage from '@/pages/PatientSelectionPage';
import PreConsultationPage from '@/pages/PreConsultationPage';
import PatientListPage from '@/pages/PatientListPage';
import { PatientDataPage } from '@/pages/PatientDataPage';
import PatientCompletePage from '@/pages/PatientCompletePage';

export const router = createBrowserRouter([
  // 🏠 WELCOME PAGE - Primera Impresión
  {
    path: '/',
    element: <WelcomePage />
  },
  {
    path: '/welcome',
    element: <WelcomePage />
  },
  
  // 🔐 AUTHENTICATION - Login Inteligente
  {
    path: '/auth',
    element: <AuthenticationPage />
  },
  
  // 🎯 SMART DASHBOARD - Centro de Comando IA
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <SmartDashboard />
      </AuthGuard>
    )
  },
  
  // 👥 PATIENT SELECTION - Búsqueda Inteligente
  {
    path: '/patient-selection',
    element: (
      <AuthGuard>
        <PatientSelectionPage />
      </AuthGuard>
    )
  },
  
  // 📋 PRE-CONSULTATION - Preparación IA
  {
    path: '/patient/:id/pre-consultation',
    element: (
      <AuthGuard>
        <PreConsultationPage />
      </AuthGuard>
    )
  },
  
  // 🎤 ACTIVE SESSION - Consulta en Vivo
  {
    path: '/patient/:id/session',
    element: (
      <AuthGuard>
        <PatientCompletePage />
      </AuthGuard>
    )
  },
  
  // ✅ POST-CONSULTATION - Revisión y Envío
  {
    path: '/patient/:id/review',
    element: (
      <AuthGuard>
        <PatientCompletePage />
      </AuthGuard>
    )
  },
  
  // ⚠️ PRIORITY REVIEW - Alertas de Riesgo
  {
    path: '/patient/:patientName/priority-review',
    element: (
      <AuthGuard>
        <PatientCompletePage />
      </AuthGuard>
    )
  },
  
  // 🎮 DEMO INTERACTIVO
  {
    path: '/demo',
    element: <WelcomePage /> // Por ahora redirige a welcome, luego crearemos demo específico
  },
  
  // Rutas legacy mantenidas para compatibilidad
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
  
  // Redirecciones inteligentes para rutas obsoletas
  {
    path: '/patient-list',
    element: <Navigate to="/patient-selection" replace />
  },
  {
    path: '/patient-data',
    element: <Navigate to="/patient-selection" replace />
  },
  {
    path: '/patient-complete',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/session',
    element: <Navigate to="/dashboard" replace />
  }
]);