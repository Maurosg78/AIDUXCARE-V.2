import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';

// Páginas principales
import WelcomePage from '../pages/WelcomePage';
import AuthenticationPage from '../pages/AuthenticationPage';
import PatientListPage from '../pages/PatientListPage';
import PatientDetailPage from '../features/patient/PatientDetailPage';
import VisitDetailPage from '../features/visits/[id]/VisitDetailPage';
import { VisitNewPage } from '../features/visits/new/VisitNewPage';
import DemoVisitPage from '../features/demo/DemoVisitPage';
import DashboardPage from '../features/admin/DashboardPage';
import PatientPortalPage from '../features/patient/PatientPortalPage';
import AccessDeniedPage from '../features/auth/AccessDeniedPage';

// Demos de transcripción
import EnhancedTranscriptionDemo from '../pages/EnhancedTranscriptionDemo';
import RealWorldDemo from '../pages/RealWorldDemo';
import TestIntegrationPage from '../pages/TestIntegrationPage';
import BufferedTranscriptionDemo from '../pages/BufferedTranscriptionDemo';
import ChunkedTranscriptionDemo from '../pages/ChunkedTranscriptionDemo';
import SimpleChunkingDemo from '../pages/SimpleChunkingDemo';
import TestPage from '../pages/TestPage';
import WorkModeDemoPage from '../pages/WorkModeDemoPage';

// ROUTER SIMPLIFICADO - FUNCIONAL
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <WelcomePage />
      },
      {
        path: 'auth',
        element: <AuthenticationPage />
      },
      {
        path: 'patients',
        element: <PatientListPage />
      },
      {
        path: 'patient/:id',
        element: <PatientDetailPage />
      },
      {
        path: 'visit/:id',
        element: <VisitDetailPage />
      },
      {
        path: 'visit/new',
        element: <VisitNewPage />
      },
      {
        path: 'demo-visit',
        element: <DemoVisitPage />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'portal',
        element: <PatientPortalPage />
      },
      {
        path: 'access-denied',
        element: <AccessDeniedPage />
      },
      // === DEMOS DE TRANSCRIPCIÓN ===
      {
        path: 'enhanced-demo',
        element: <EnhancedTranscriptionDemo />
      },
      {
        path: 'real-world-demo',
        element: <RealWorldDemo />
      },
      {
        path: 'test-integration',
        element: <TestIntegrationPage />
      },
      {
        path: 'buffered-demo',
        element: <BufferedTranscriptionDemo />
      },
      {
        path: 'chunked-demo',
        element: <ChunkedTranscriptionDemo />
      },
      {
        path: 'simple-demo',
        element: <SimpleChunkingDemo />
      },
      {
        path: 'test',
        element: <TestPage />
      },
      {
        path: 'work-mode-demo',
        element: <WorkModeDemoPage />
      }
    ]
  }
]);