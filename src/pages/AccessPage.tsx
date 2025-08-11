import { useNavigate } from 'react-router-dom';

const AccessPage = () => {
  const navigate = useNavigate();

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

        {/* Login Button */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acceso al Sistema
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Inicia sesión con tus credenciales profesionales
            </p>
            <button
              onClick={handleManualLogin}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
            >
              Iniciar Sesión
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