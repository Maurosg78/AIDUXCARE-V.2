/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { GeolocationData } from '../../services/geolocationService';

interface GeolocationPermissionProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationDetected: (location: GeolocationData) => void;
  onManualSelection: () => void;
}

export const GeolocationPermission: React.FC<GeolocationPermissionProps> = ({
  isOpen,
  onClose,
  onLocationDetected,
  onManualSelection
}) => {
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'error'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Debug: Log cuando cambie isOpen
  useEffect(() => {
    console.log('GeolocationPermission - isOpen cambió a:', isOpen);
    if (isOpen) {
      console.log('GeolocationPermission - Activando geolocalización automáticamente');
      requestGeolocationPermission();
    }
  }, [isOpen]);

  const requestGeolocationPermission = async () => {
    try {
      setPermissionStatus('requesting');
      setErrorMessage('');

      // Verificar si el navegador soporta geolocalización
      if (!navigator.geolocation) {
        setPermissionStatus('error');
        setErrorMessage('Tu navegador no soporta geolocalización');
        return;
      }

      // Verificar permisos usando la API de Permisos si está disponible
      if ('permissions' in navigator) {
        try {
          const permission = await (navigator as Navigator & { permissions?: Permissions }).permissions?.query({ 
            name: 'geolocation' as PermissionName 
          });
          
          if (permission?.state === 'denied') {
            setPermissionStatus('denied');
            setErrorMessage('Permiso de geolocalización denegado. Por favor, habilítalo en la configuración de tu navegador.');
            return;
          }
        } catch (error) {
          console.log('No se pudo verificar el estado de permisos:', error);
        }
      }

      // Solicitar ubicación
      navigator.geolocation.getCurrentPosition(
        async () => {
          try {
            // Usar el servicio de geolocalización para obtener datos completos
            const geolocationService = (await import('../../services/geolocationService')).GeolocationService.getInstance();
            const locationData = await geolocationService.detectLocation();
            
            if (locationData) {
              setPermissionStatus('granted');
              onLocationDetected(locationData);
              onClose();
            } else {
              setPermissionStatus('error');
              setErrorMessage('No se pudo obtener la información de ubicación completa');
            }
          } catch (error) {
            console.error('Error al obtener datos de ubicación:', error);
            setPermissionStatus('error');
            setErrorMessage('Error al procesar la información de ubicación');
          }
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setPermissionStatus('denied');
              setErrorMessage('Permiso de geolocalización denegado. Por favor, habilítalo en la configuración de tu navegador.');
              break;
            case error.POSITION_UNAVAILABLE:
              setPermissionStatus('error');
              setErrorMessage('La información de ubicación no está disponible en este momento.');
              break;
            case error.TIMEOUT:
              setPermissionStatus('error');
              setErrorMessage('Se agotó el tiempo de espera para obtener la ubicación.');
              break;
            default:
              setPermissionStatus('error');
              setErrorMessage('Error desconocido al obtener la ubicación.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      setPermissionStatus('error');
      setErrorMessage('Error al solicitar permisos de geolocalización');
    }
  };

  const handleManualSelection = () => {
    onManualSelection();
    onClose();
  };

  const handleRetry = () => {
    requestGeolocationPermission();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Permiso de Ubicación</h2>
        
        {permissionStatus === 'requesting' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Solicitando permiso de ubicación...</p>
          </div>
        )}

        {permissionStatus === 'granted' && (
          <div className="text-center py-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <p className="text-gray-600">¡Ubicación detectada exitosamente!</p>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="py-4">
            <div className="text-red-600 text-6xl mb-4 text-center">⚠</div>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Para habilitar la geolocalización:</strong>
                <br />1. Haz clic en el candado 🔒 en la barra de direcciones
                <br />2. Cambia &quot;Ubicación&quot; a &quot;Permitir&quot;
                <br />3. Recarga la página
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reintentar
              </button>
              <button
                onClick={handleManualSelection}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Selección Manual
              </button>
            </div>
          </div>
        )}

        {permissionStatus === 'error' && (
          <div className="py-4">
            <div className="text-red-600 text-6xl mb-4 text-center">❌</div>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reintentar
              </button>
              <button
                onClick={handleManualSelection}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Selección Manual
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
