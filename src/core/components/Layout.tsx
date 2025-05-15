import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      // Si no está cargando y no hay usuario, redirigir al login
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  // Mostrar pantalla de carga mientras verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar móvil */}
      <div className={`
        fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75 transition-opacity duration-300
        ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `} onClick={toggleSidebar}></div>
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-gray-800">AiDuxCare</h1>
        </div>
        <nav className="mt-5 px-2">
          <ul className="space-y-2">
            <li>
              <Link to="/" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <span className="mx-4">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/pacientes" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <span className="mx-4">Pacientes</span>
              </Link>
            </li>
            <li>
              <Link to="/visitas" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <span className="mx-4">Visitas</span>
              </Link>
            </li>
            <li>
              <Link to="/configuracion" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <span className="mx-4">Configuración</span>
              </Link>
            </li>
            <li>
              <button 
                onClick={logout}
                className="w-full flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mx-4">Cerrar sesión</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center h-16 bg-white shadow-sm px-6">
          <button
            className="text-gray-500 focus:outline-none lg:hidden"
            onClick={toggleSidebar}
            title="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-4 lg:ml-0">
            <h1 className="text-lg font-medium">AiDuxCare V.2</h1>
          </div>
          {user && (
            <div className="ml-auto">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 