import React, { useState, useEffect } from 'react';
import { WebSpeechSTTService } from '../services/WebSpeechSTTService';

interface VoiceRecognitionStatusProps {
  onStatusChange?: (status: 'supported' | 'unsupported' | 'permission-denied' | 'network-error') => void;
}

export const VoiceRecognitionStatus: React.FC<VoiceRecognitionStatusProps> = ({ onStatusChange }) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    compatible: boolean;
    recommendation: string;
  } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const checkCompatibility = () => {
      const supported = WebSpeechSTTService.isSupported();
      const compatibility = WebSpeechSTTService.getBrowserCompatibility();
      
      setIsSupported(supported);
      setBrowserInfo({
        name: compatibility.browserName,
        compatible: compatibility.isSupported,
        recommendation: compatibility.recommendedAction
      });

      onStatusChange?.(supported ? 'supported' : 'unsupported');
    };

    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionStatus('granted');
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        setPermissionStatus('denied');
        onStatusChange?.('permission-denied');
      }
    };

    const handleOnlineStatus = () => setNetworkStatus('online');
    const handleOfflineStatus = () => {
      setNetworkStatus('offline');
      onStatusChange?.('network-error');
    };

    checkCompatibility();
    checkPermissions();

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, [onStatusChange]);

  const getStatusIcon = () => {
    if (!isSupported) return '❌';
    if (permissionStatus === 'denied') return '🚫';
    if (networkStatus === 'offline') return '📡';
    return '✅';
  };

  const getStatusMessage = () => {
    if (!isSupported) {
      return `Tu navegador (${browserInfo?.name}) no soporta Web Speech API`;
    }
    if (permissionStatus === 'denied') {
      return 'Acceso al micrófono denegado';
    }
    if (networkStatus === 'offline') {
      return 'Sin conexión a internet - Requerida para transcripción';
    }
    return 'Listo para transcripción en tiempo real';
  };

  const getStatusDetails = () => {
    if (!isSupported && browserInfo) {
      return browserInfo.recommendation;
    }
    if (permissionStatus === 'denied') {
      return 'Ve a configuración del navegador y permite el acceso al micrófono para este sitio';
    }
    if (networkStatus === 'offline') {
      return 'Web Speech API requiere conexión a internet para funcionar correctamente';
    }
    return 'Todos los sistemas funcionando correctamente';
  };

  const showTroubleshooting = !isSupported || permissionStatus === 'denied' || networkStatus === 'offline';

  return (
    <div className={`p-4 rounded-lg border ${
      showTroubleshooting ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{getStatusIcon()}</span>
        <div className="flex-1">
          <h4 className={`font-medium ${
            showTroubleshooting ? 'text-red-800' : 'text-green-800'
          }`}>
            Estado del Reconocimiento de Voz
          </h4>
          <p className={`text-sm mt-1 ${
            showTroubleshooting ? 'text-red-700' : 'text-green-700'
          }`}>
            {getStatusMessage()}
          </p>
          <p className={`text-xs mt-2 ${
            showTroubleshooting ? 'text-red-600' : 'text-green-600'
          }`}>
            {getStatusDetails()}
          </p>

          {/* Información técnica para debug */}
          <details className="mt-3">
            <summary className={`text-xs cursor-pointer ${
              showTroubleshooting ? 'text-red-500' : 'text-green-500'
            }`}>
              Información técnica
            </summary>
            <div className={`text-xs mt-2 space-y-1 ${
              showTroubleshooting ? 'text-red-600' : 'text-green-600'
            }`}>
              <p>Navegador: {browserInfo?.name}</p>
              <p>Web Speech API: {isSupported ? 'Soportado' : 'No soportado'}</p>
              <p>Permisos micrófono: {permissionStatus}</p>
              <p>Estado de red: {networkStatus}</p>
              <p>User Agent: {navigator.userAgent.slice(0, 50)}...</p>
            </div>
          </details>
        </div>
      </div>

      {/* Botones de acción según el problema */}
      {showTroubleshooting && (
        <div className="mt-4 space-y-2">
          {permissionStatus === 'denied' && (
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Recargar y solicitar permisos nuevamente
            </button>
          )}
          
          {!isSupported && (
            <div className="space-y-2">
              <p className="text-xs text-red-700 font-medium">Navegadores recomendados:</p>
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href="https://www.google.com/chrome/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-600 text-white rounded text-xs text-center hover:bg-blue-700 transition-colors"
                >
                  Descargar Chrome
                </a>
                <a 
                  href="https://www.microsoft.com/edge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-green-600 text-white rounded text-xs text-center hover:bg-green-700 transition-colors"
                >
                  Descargar Edge
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 