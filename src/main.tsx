// @ts-nocheck
import { Analytics } from "./services/analytics-service";

Analytics.enable();import logger from '@/shared/utils/logger';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ProfessionalProfileProvider } from './context/ProfessionalProfileContext';

// Service Worker solo en PRODUCCIÓN
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.info('✅ SW registrado:', registration);
      })
      .catch((error) => {
        logger.info('❌ SW falló:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProfessionalProfileProvider>
        <App />
      </ProfessionalProfileProvider>
    </AuthProvider>
  </StrictMode>,
);