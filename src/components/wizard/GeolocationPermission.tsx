/**
 * GeolocationPermission - Componente de solicitud de geolocalización
 * Solicita permisos y ofrece fallback manual para compliance legal
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState } from 'react';
import { geolocationService, GeolocationData } from '../../services/geolocationService';

interface GeolocationPermissionProps {
  onLocationDetected: (location: GeolocationData) => void;
  onManualSelection: () => void;
}

export const GeolocationPermission: React.FC<GeolocationPermissionProps> = ({
  onLocationDetected,
  onManualSelection
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(true);

  const handleGeolocationConsent = async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      const location = await geolocationService.detectLocation();
      if (location) {
        onLocationDetected(location);
        setShowPermissionModal(false);
      }
    } catch (err) {
      setError('No se pudo detectar tu ubicación. Puedes seleccionarla manualmente.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualSelection = () => {
    setShowPermissionModal(false);
    onManualSelection();
  };

  if (!showPermissionModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ubicación para Compliance Legal
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Necesitamos conocer tu ubicación para aplicar las leyes de protección de datos correspondientes.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">¿Por qué necesitamos tu ubicación?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Aplicar leyes de protección de datos específicas de tu país</li>
            <li>• Mostrar advertencias legales relevantes</li>
            <li>• Cumplir con requisitos de compliance médico</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleGeolocationConsent}
            disabled={isDetecting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDetecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Detectando...
              </>
            ) : (
              'Permitir Acceso a Ubicación'
            )}
          </button>
          <button
            onClick={handleManualSelection}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Seleccionar Manualmente
          </button>
        </div>
      </div>
    </div>
  );
}; 