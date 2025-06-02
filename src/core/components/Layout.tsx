import React from 'react';
import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, isLoading, logout } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !user) {
      // Si no está cargando y no hay usuario, redirigir al login
      navigate('/login');
    }
  }, [user, isLoading, navigate]);
  
  // Mostrar pantalla de carga mientras verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-boneWhite">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-softCoral"
          role="status"
          aria-label="Cargando"
        ></div>
      </div>
    );
  }
  
  // Si no hay usuario y no está cargando, no renderizar nada
  // (el useEffect se encargará de la redirección)
  if (!user) {
    return null;
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-boneWhite">
      {/* Sidebar */}
      <div 
        className={`bg-slateBlue text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-30`}
      >
        <div className="flex items-center space-x-2 px-4">
          <h2 className="text-2xl font-extrabold">AiDuxCare</h2>
        </div>
        
        <nav>
          <Link 
            to="/" 
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
          >
            Inicio
          </Link>
          
          {/* Menú para profesionales sanitarios */}
          {role === 'professional' && (
            <>
              <Link 
                to="/visits" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Mis visitas
              </Link>
              <Link 
                to="/demo" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Consulta de demostración
              </Link>
              <Link 
                to="/patients" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Pacientes
              </Link>
            </>
          )}
          
          {/* Menú para pacientes */}
          {role === 'patient' && (
            <>
              <Link 
                to="/patient-portal" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Mi portal
              </Link>
              <Link 
                to="/appointments" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Mis citas
              </Link>
              <Link 
                to="/medical-records" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Mis registros médicos
              </Link>
            </>
          )}
          
          {/* Menú para administradores */}
          {role === 'admin' && (
            <>
              <Link 
                to="/admin" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Panel de administración
              </Link>
              <Link 
                to="/users" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Gestión de usuarios
              </Link>
              <Link 
                to="/system-logs" 
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slateBlue-700 hover:text-white"
              >
                Logs del sistema
              </Link>
            </>
          )}
          
          <button 
            onClick={logout}
            className="block w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-softCoral hover:text-white mt-8"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Encabezado */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className="text-slateBlue focus:outline-none md:hidden"
              title="Abrir/cerrar menú"
              aria-label="Abrir/cerrar menú"
            >
              <svg 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-slateBlue ml-4">
              {role === 'professional' && 'Portal Profesional'}
              {role === 'patient' && 'Portal del Paciente'}
              {role === 'admin' && 'Portal de Administración'}
            </h1>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-slateBlue mr-4">
              {user?.email}
              {role && <span className="ml-2 text-xs bg-softCoral/10 text-softCoral px-2 py-1 rounded-full">{role}</span>}
            </span>
          </div>
        </header>

        {/* Area de contenido principal */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-boneWhite">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 