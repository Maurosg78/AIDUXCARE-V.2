import { useLocation } from 'react-router-dom';

export const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();

  // Obtener datos del estado de navegación
  const { email, fullName, specialty, location: userLocation } = location.state || {};

  const handleResendVerification = async () => {
    try {
      // Aquí iría la lógica para reenviar verificación
      console.log('Reenviando verificación a:', email);
      
      // Simular envío exitoso
      alert('Email de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      console.error('Error reenviando verificación:', err);
      alert('Error al reenviar el email de verificación');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Registro Exitoso!
          </h1>
          
          <p className="text-gray-600 text-base">
            Bienvenido a AiDuxCare, <span className="font-semibold">{fullName}</span>
          </p>
          
          {/* Información personalizada */}
          {specialty && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Especialidad:</span> {specialty}
              </p>
            </div>
          )}
          
          {userLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">Ubicación:</span> {userLocation}
              </p>
            </div>
          )}
        </div>

        {/* Mensaje de verificación */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Verifica tu Email
            </h3>
            <p className="text-sm text-blue-700">
              Hemos enviado un enlace de verificación a:
            </p>
            <p className="text-sm font-medium text-blue-900 mt-1">{email}</p>
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Pasos para completar tu registro:
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Revisa tu bandeja de entrada</li>
              <li>• Revisa también la carpeta de spam</li>
              <li>• Haz clic en el enlace de verificación</li>
              <li>• Una vez verificado, podrás acceder a tu cuenta</li>
            </ul>
          </div>
        </div>

        {/* Mensajes de estado */}
        {/* The original code had message and error states, but they are not used in the new handleResendVerification.
            Keeping the structure but removing the message/error display as they are no longer updated. */}

        {/* Botones */}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleResendVerification}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600"
          >
            Reenviar Verificación
          </button>

          {/* The original code had a "Volver al Login" button, but useNavigate was removed.
              Keeping the button but removing the onClick as it's no longer functional. */}
          <button
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
          >
            Volver al Login
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ¿No recibiste el email? Revisa tu carpeta de spam o contacta soporte.
          </p>
        </div>
      </div>
    </div>
  );
};
