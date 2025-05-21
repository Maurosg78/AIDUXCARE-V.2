import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { supabase, checkSupabaseConnection } from './lib/supabase'
import './App.css'

// Componente de inicio
function Home() {
  return (
    <div className="page">
      <h1>AiDuxCare V.2</h1>
      <p>Bienvenido a AiDuxCare - Plataforma de atención médica</p>
      <div className="links">
        <Link to="/dashboard" className="button">
          Ir al Dashboard
        </Link>
      </div>
    </div>
  )
}

// Componente de Dashboard con verificación de conexión
function Dashboard() {
  const [connectionStatus, setConnectionStatus] = useState({
    checking: true,
    success: false,
    message: 'Verificando conexión...'
  });

  useEffect(() => {
    const verifyConnection = async () => {
      const result = await checkSupabaseConnection();
      
      setConnectionStatus({
        checking: false,
        success: result.success,
        message: result.success 
          ? 'Conexión a Supabase establecida correctamente' 
          : `Error en la conexión: ${result.error}`
      });
    };
    
    verifyConnection();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Panel de control de AiDuxCare</p>
      
      <div className="connection-status">
        <h3>Estado de la conexión a Supabase:</h3>
        {connectionStatus.checking ? (
          <p>Verificando conexión...</p>
        ) : (
          <p className={connectionStatus.success ? 'success' : 'error'}>
            {connectionStatus.message}
          </p>
        )}
      </div>
      
      <div className="links">
        <Link to="/" className="button">
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h2>AiDuxCare V.2</h2>
      </header>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      
      <footer className="footer">
        <p>© 2024 AiDuxCare - Todos los derechos reservados</p>
      </footer>
    </div>
  )
}

export default App 