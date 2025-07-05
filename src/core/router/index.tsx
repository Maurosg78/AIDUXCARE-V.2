import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../../features/auth/ProtectedRoute';

// Componente de loading para las rutas lazy
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

// Lazy loading de páginas principales
const LoginPage = lazy(() => import('../../pages/LoginPage'));
const RegisterPage = lazy(() => import('../../pages/RegisterPage'));
const VisitDetailPage = lazy(() => import('../../features/visits/id/VisitDetailPage'));
const DemoVisitPage = lazy(() => import('../../features/demo/DemoVisitPage'));
const AccessDeniedPage = lazy(() => import('../../features/auth/AccessDeniedPage'));
const DashboardPage = lazy(() => import('../../features/admin/DashboardPage'));
const PatientPortalPage = lazy(() => import('../../features/patient/PatientPortalPage'));
const PatientDetailPage = lazy(() => import('../../features/patient/PatientDetailPage'));
const AdvancedAIDemoPage = lazy(() => import('@/pages/AdvancedAIDemoPage'));
const AudioTestPage = lazy(() => import('@/pages/AudioTestPage'));
const AudioProcessingPage = lazy(() => import('@/pages/AudioProcessingPage'));

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              {/* HomePage eliminado: aquí puedes poner ProfessionalWorkflowPage o similar si es necesario */}
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'visits/:id',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <Suspense fallback={<PageLoader />}>
              <VisitDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <Suspense fallback={<PageLoader />}>
              <PatientDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'demo',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <Suspense fallback={<PageLoader />}>
              <DemoVisitPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRoles="admin">
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'patient-portal',
        element: (
          <ProtectedRoute requiredRoles="patient">
            <Suspense fallback={<PageLoader />}>
              <PatientPortalPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'advanced-ai-demo',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdvancedAIDemoPage />
          </Suspense>
        )
      },
      {
        path: 'audio-test',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AudioTestPage />
          </Suspense>
        )
      },
      {
        path: 'audio-processing',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <Suspense fallback={<PageLoader />}>
              <AudioProcessingPage />
            </Suspense>
          </ProtectedRoute>
        )
      },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/access-denied',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    ),
  },
]; 