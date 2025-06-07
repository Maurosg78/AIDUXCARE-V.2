import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Configuración global para desarrollo
if (import.meta.env.DEV) {
  console.log('🚀 AiDuxCare V.2 - Modo Desarrollo')
  console.log('📍 Ollama URL:', 'http://localhost:11434')
  console.log('🎯 MVP Core disponible en /mvp-core')
  console.log('🏥 Professional Workflow disponible en /professional')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 