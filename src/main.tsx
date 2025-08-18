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
        console.log('✅ SW registrado:', registration);
      })
      .catch((error) => {
        console.log('❌ SW falló:', error);
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