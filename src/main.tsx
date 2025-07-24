/**
 * 🚀 **Enterprise Application Entry Point**
 * 
 * Punto de entrada enterprise con:
 * - Configuración inicial validada
 * - Error handling desde el inicio
 * - Logging de arranque
 * - React 18 features
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

import { config, isDebugEnabled } from './core/config/environment';
import { firebaseClient } from './infrastructure/firebase/FirebaseClient';

// =====================================================
// APPLICATION INITIALIZATION
// =====================================================

async function initializeApp() {
  try {
    if (isDebugEnabled()) {
      console.log('🚀 AiDuxCare Enterprise iniciando...');
      console.log('⚙️ Configuración:', {
        environment: config.app.environment,
        version: config.app.version,
        firebaseProject: config.firebase.projectId,
        debugMode: config.features.enableDebugMode
      });
    }

    // Validate Firebase connection
    const connectionInfo = firebaseClient.getConnectionInfo();
    if (isDebugEnabled()) {
      console.log('🔥 Firebase:', connectionInfo);
    }

    // Health check
    const isHealthy = await firebaseClient.healthCheck();
    if (isDebugEnabled()) {
      console.log(`💚 Health check: ${isHealthy ? 'OK' : 'FAILED'}`);
    }

    if (isDebugEnabled()) {
      console.log('✅ AiDuxCare Enterprise inicializado correctamente');
    }

  } catch (error) {
    console.error('❌ Error inicializando AiDuxCare Enterprise:', error);
    
    // Still start the app even if initialization has issues
    // The error boundary will handle any runtime errors
  }
}

// =====================================================
// REACT APPLICATION MOUNT
// =====================================================

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found! Make sure you have a div with id="root" in your HTML.');
}

const root = ReactDOM.createRoot(rootElement);

// Initialize and render
initializeApp().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('❌ Failed to initialize app:', error);
  
  // Fallback rendering even if initialization fails
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});