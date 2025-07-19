import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessPage = () => {
  const navigate = useNavigate();

  const users = [
    {
      id: 'demo',
      email: 'demo@aiduxcare.com',
      password: 'password123',
      name: 'Dr. Demo Profesional',
      role: 'PHYSICIAN',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'paciente',
      email: 'paciente@aiduxcare.com',
      password: 'password123',
      name: 'Paciente Demo',
      role: 'PHYSICIAN',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'admin',
      email: 'admin@aiduxcare.com',
      password: 'password123',
      name: 'Admin Demo',
      role: 'ADMIN',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'mauro',
      email: 'maurosg.2023@gmail.com',
      password: 'Mauro7812#',
      name: 'Mauricio Sobarzo',
      role: 'OWNER',
      color: 'bg-red-500 hover:bg-red-600'
    }
  ];

  const handleQuickLogin = (user: typeof users[0]) => {
    console.log('🔍 [DEBUG] handleQuickLogin llamado con usuario:', user);
    
    try {
      // Aquí podrías implementar login automático
      // Por ahora, navegamos al login con las credenciales pre-llenadas
      console.log('🔍 [DEBUG] Navegando a /login con estado:', { 
        prefillEmail: user.email,
        prefillPassword: user.password 
      });
      
      // Usar setTimeout para evitar problemas de navegación
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            prefillEmail: user.email,
            prefillPassword: user.password 
          },
          replace: false // No reemplazar la entrada en el historial
        });
      }, 100);
      
      console.log('🔍 [DEBUG] Navegación programada');
    } catch (error) {
      console.error('❌ [DEBUG] Error en handleQuickLogin:', error);
    }
  };

  const handleButtonClick = (user: typeof users[0], event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🔍 [DEBUG] Botón clickeado para usuario:', user.name);
    handleQuickLogin(user);
  };

  const handleManualLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏥 AiDuxCare V.2
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Sistema de Monitoreo Médico Inteligente
          </p>
          <p className="text-sm text-gray-500">
            Selecciona un usuario para acceder rápidamente
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Servidor</h3>
                <p className="text-sm text-gray-600">Funcionando</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Firebase</h3>
                <p className="text-sm text-gray-600">Conectado</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Monitoreo</h3>
                <p className="text-sm text-gray-600">Activo</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Puerto</h3>
                <p className="text-sm text-gray-600">5175</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full mt-1">
                    {user.role}
                  </span>
                </div>
                <div className="text-right">
                  <button
                    onClick={(event) => handleButtonClick(user, event)}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${user.color}`}
                  >
                    Acceder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Manual Login */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Otro usuario?
            </h3>
            <button
              onClick={handleManualLogin}
              className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Login Manual
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4">
            <a
              href="http://localhost:3001/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              📊 Dashboard de Monitoreo
            </a>
            <span className="text-gray-400">|</span>
            <a
              href="http://localhost:5175/login"
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              🔐 Página de Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessPage; 