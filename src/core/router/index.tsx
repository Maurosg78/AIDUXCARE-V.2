import { vi } from "vitest";
import { RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from '../../pages/HomePage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import VisitDetailPage from '../../features/visits/id/VisitDetailPage';
import DemoVisitPage from '../../features/demo/DemoVisitPage';
import AccessDeniedPage from '../../features/auth/AccessDeniedPage';
import ProtectedRoute from '../../features/auth/ProtectedRoute';
import AdminDashboardPage from '../../features/admin/DashboardPage';
import PatientPortalPage from '../../features/patient/PatientPortalPage';
import PatientDetailPage from '../../features/patient/PatientDetailPage';
import DashboardPage from '../../features/dashboard/DashboardPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'visits/:id',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <VisitDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <PatientDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'demo',
        element: (
          <ProtectedRoute requiredRoles={['professional', 'admin']}>
            <DemoVisitPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRoles="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patient-portal',
        element: (
          <ProtectedRoute requiredRoles="patient">
            <PatientPortalPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/access-denied',
    element: <AccessDeniedPage />,
  },
]; 