import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import AuthenticationPage from '@/pages/AuthenticationPage';
import WelcomePage from '@/pages/WelcomePage';
import ClinicalWorkflowPage from '@/pages/ClinicalWorkflowPage';
import SmartDashboard from '@/pages/SmartDashboard';
import PatientSelectionPage from '@/pages/PatientSelectionPage';
import PreConsultationPage from '@/pages/PreConsultationPage';
import PatientListPage from '@/pages/PatientListPage';
import { PatientDataPage } from '@/pages/PatientDataPage';
import PatientCompletePage from '@/pages/PatientCompletePage';
import IntegratedConsultationPage from '@/pages/IntegratedConsultationPage';
import SimpleConsultationPage from '@/pages/SimpleConsultationPage';

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
  
  // 🏥 CLINICAL WORKFLOW - Dashboard Clínico Real (NUEVO)
  {
    path: '/clinical',
    element: (
      <AuthGuard>
        <ClinicalWorkflowPage />
      </AuthGuard>
    )
  },
  
  // 🎯 SMART DASHBOARD - Centro de Comando IA (Demo/Presentación)
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <SmartDashboard />
      </AuthGuard>
    )
  },
  
  // Redirección por defecto después del login al flujo clínico
  {
    path: '/main',
    element: <Navigate to="/clinical" replace />
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
  
  // 🏥 SIMPLE CONSULTATION - Consulta Práctica (NUEVO MVP)
  {
    path: '/patient/:patientId/simple-consultation',
    element: (
      <AuthGuard>
        <SimpleConsultationPage />
      </AuthGuard>
    )
  },
  
  // 🏥 INTEGRATED CONSULTATION - Vista Unificada (NUEVA ARQUITECTURA)
  {
    path: '/patient/:patientId/consultation',
    element: (
      <AuthGuard>
        <IntegratedConsultationPage />
      </AuthGuard>
    )
  },
  
  // 📋 PRE-CONSULTATION - Preparación IA (Legacy)
  {
    path: '/patient/:id/pre-consultation',
    element: (
      <AuthGuard>
        <PreConsultationPage />
      </AuthGuard>
    )
  },
  
  // 🎤 ACTIVE SESSION - Consulta en Vivo (Legacy)
  {
    path: '/patient/:id/session',
    element: (
      <AuthGuard>
        <PatientCompletePage />
      </AuthGuard>
    )
  },
  
  // ✅ POST-CONSULTATION - Revisión y Envío (Legacy)
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
  
  // 🎮 DEMO INTERACTIVO - Dashboard con datos demo
  {
    path: '/demo',
    element: (
      <AuthGuard>
        <SmartDashboard />
      </AuthGuard>
    )
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
    element: <Navigate to="/clinical" replace />
  },
  {
    path: '/patient-data',
    element: <Navigate to="/clinical" replace />
  },
  {
    path: '/patient-complete',
    element: <Navigate to="/clinical" replace />
  },
  {
    path: '/session',
    element: <Navigate to="/clinical" replace />
  }
]);