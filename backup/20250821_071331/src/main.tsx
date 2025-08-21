import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ProfessionalProfileProvider } from './context/ProfessionalProfileContext';

// SOLO registrar SW en producción y si está habilitado explícitamente
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_SW === 'true') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('SW registrado'))
      .catch((e) => console.error('SW error', e));
  }
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