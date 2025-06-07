import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/router'
import './index.css'

// Configuración global para desarrollo
if (import.meta.env.DEV) {
  console.log('🚀 AiDuxCare V.2 - Modo Desarrollo')
  console.log('📍 Página Principal:', 'http://localhost:3000/')
  console.log('🏥 Ficha Pre-Sesión:', 'http://localhost:3000/patient-presession')
  console.log('💼 Workflow Profesional:', 'http://localhost:3000/professional-workflow')
  console.log('🎯 MVP Core:', 'http://localhost:3000/mvp-core')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
) 