import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// SOLUCIÓN AGRESIVA: INTERCEPTAR PÁGINA SMS Y REDIRIGIR
function interceptSMSPage() {
  // Detectar si la página contiene elementos problemáticos
  const hasSMSElements = () => {
    return document.body?.textContent?.includes('Método de verificación') ||
           document.body?.textContent?.includes('SMS') ||
           document.querySelector('input[type="radio"]') ||
           window.location.pathname.includes('/register');
  };

  // Si detecta la página problemática, redirigir inmediatamente
  if (hasSMSElements()) {
    console.warn('🚨 Página SMS detectada, redirigiendo...');
    // Limpiar la página actual
    document.body.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border:2px solid #5DA5A3;border-radius:8px;font-size:18px;">🔄 Redirigiendo al formulario correcto...</div>';
    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = '/professional-onboarding';
    }, 1000);
    return;
  }

  // Observar cambios en el DOM para detectar carga dinámica de SMS
  const observer = new MutationObserver(() => {
    if (hasSMSElements()) {
      console.warn('🚨 Contenido SMS detectado dinámicamente, redirigiendo...');
      window.location.href = '/professional-onboarding';
    }
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true 
  });
}

// Ejecutar inmediatamente
interceptSMSPage();

// Ejecutar también cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', interceptSMSPage);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 