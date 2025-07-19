import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importar servicio de monitoreo remoto
import './services/RemoteMonitoringService'

console.log('Entrando a main.tsx');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
) 