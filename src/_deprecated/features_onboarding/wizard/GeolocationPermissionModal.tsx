import React from 'react';

interface GeolocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const GeolocationPermissionModal: React.FC<GeolocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          {/* Icono de ubicación */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Permisos de Ubicación Bloqueados
          </h3>
          
          <p className="text-gray-600 mb-4">
            Tu navegador ha bloqueado el acceso a la ubicación para este sitio. 
            Para usar la geolocalización automática, necesitas resetear los permisos.
          </p>

          {/* Instrucciones paso a paso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">Cómo resetear permisos:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Haz clic en el ícono de ubicación en la barra de direcciones</li>
              <li>2. Selecciona &quot;Permitir&quot; o &quot;Preguntar&quot;</li>
              <li>3. Recarga la página</li>
            </ol>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={onRetry}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Información adicional */}
          <p className="text-xs text-gray-500 mt-3">
            También puedes ir a Configuración del navegador → Privacidad y seguridad → Permisos del sitio → Ubicación
          </p>
        </div>
      </div>
    </div>
  );
};
