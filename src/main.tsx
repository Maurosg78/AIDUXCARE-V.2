import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { UserProvider } from './core/auth/UserContext'
import './index.css'
import { webVitalsService } from './core/performance/WebVitalsService.ts'

// Test de conexión Supabase en desarrollo
import './utils/supabaseConnectionTest.ts'

// Inicializar Web Vitals monitoring
webVitalsService.initialize((metric) => {
  // En producción aquí podrías enviar a un servicio de analytics
  console.log('📊 Performance Metric:', metric);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 