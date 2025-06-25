import React, { useState, useEffect } from 'react';
import { WebSpeechSTTService } from '../services/WebSpeechSTTService';

export const SpeechDiagnostic: React.FC = () => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    isSupported: boolean;
    browserName: string;
    isOnline: boolean;
    hasPermissions: boolean;
    lastError: string | null;
    testResult: string | null;
  }>({
    isSupported: false,
    browserName: 'Unknown',
    isOnline: true,
    hasPermissions: false,
    lastError: null,
    testResult: null
  });

  const [isTestingSTT, setIsTestingSTT] = useState(false);

  useEffect(() => {
    const runDiagnostic = async () => {
      // 1. Verificar soporte del navegador
      const isSupported = WebSpeechSTTService.isSupported();
      const browserInfo = WebSpeechSTTService.getBrowserCompatibility();
      
      // 2. Verificar conexión
      const isOnline = navigator.onLine;
      
      // 3. Verificar permisos de micrófono
      let hasPermissions = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        hasPermissions = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Permission denied:', error);
      }

      setDiagnosticInfo({
        isSupported,
        browserName: browserInfo.browserName,
        isOnline,
        hasPermissions,
        lastError: null,
        testResult: null
      });
    };

    runDiagnostic();

    // Listeners para cambios de estado
    const handleOnline = () => setDiagnosticInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setDiagnosticInfo(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const testSpeechRecognition = async () => {
    setIsTestingSTT(true);
    setDiagnosticInfo(prev => ({ ...prev, lastError: null, testResult: null }));

    try {
      const sttService = new WebSpeechSTTService();
      
      let hasReceived = false;
      
      await sttService.startRealtimeTranscription({
        onResult: (segment) => {
          hasReceived = true;
          setDiagnosticInfo(prev => ({ 
            ...prev, 
            testResult: `SUCCESS: Transcripción exitosa: "${segment.content}"`
          }));
          sttService.stopTranscription();
          setIsTestingSTT(false);
        },
        onError: (error) => {
          setDiagnosticInfo(prev => ({ 
            ...prev, 
            lastError: error,
            testResult: `ERROR: Error específico: ${error}`
          }));
          setIsTestingSTT(false);
        },
        onStart: () => {
          setDiagnosticInfo(prev => ({ 
            ...prev, 
            testResult: 'MIC: Micrófono iniciado - Di "Hola" para probar'
          }));
        },
        onEnd: () => {
          if (!hasReceived) {
            setDiagnosticInfo(prev => ({ 
              ...prev, 
              testResult: 'WARNING: Sesión terminó sin transcripción - Intenta hablar más alto'
            }));
          }
          setIsTestingSTT(false);
        }
      });

      // Auto-detener después de 10 segundos
      setTimeout(() => {
        if (isTestingSTT) {
          sttService.stopTranscription();
          setIsTestingSTT(false);
          if (!hasReceived) {
            setDiagnosticInfo(prev => ({ 
              ...prev, 
              testResult: 'TIME: Tiempo agotado - No se detectó habla'
            }));
          }
        }
      }, 10000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setDiagnosticInfo(prev => ({ 
        ...prev, 
        lastError: errorMsg,
        testResult: `💥 Error al iniciar: ${errorMsg}`
      }));
      setIsTestingSTT(false);
    }
  };

  const getStatusIcon = (status: boolean) => status ? 'SUCCESS:' : 'ERROR:';
  const getStatusColor = (status: boolean) => status ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Diagnóstico Web Speech API</h3>
      
      {/* Estado general */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Soporte del navegador:</span>
          <span className={`text-sm font-medium ${getStatusColor(diagnosticInfo.isSupported)}`}>
            {getStatusIcon(diagnosticInfo.isSupported)} {diagnosticInfo.browserName}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Conexión a internet:</span>
          <span className={`text-sm font-medium ${getStatusColor(diagnosticInfo.isOnline)}`}>
            {getStatusIcon(diagnosticInfo.isOnline)} {diagnosticInfo.isOnline ? 'Conectado' : 'Sin conexión'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Permisos de micrófono:</span>
          <span className={`text-sm font-medium ${getStatusColor(diagnosticInfo.hasPermissions)}`}>
            {getStatusIcon(diagnosticInfo.hasPermissions)} {diagnosticInfo.hasPermissions ? 'Concedidos' : 'Denegados'}
          </span>
        </div>
      </div>

      {/* Información técnica */}
      <details className="mb-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
          Información técnica
        </summary>
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <p>User Agent: {navigator.userAgent.slice(0, 80)}...</p>
          <p>Speech Recognition: {typeof window.SpeechRecognition !== 'undefined' ? 'SpeechRecognition' : typeof window.webkitSpeechRecognition !== 'undefined' ? 'webkitSpeechRecognition' : 'No disponible'}</p>
          <p>Navigator Online: {navigator.onLine.toString()}</p>
          <p>MediaDevices: {navigator.mediaDevices ? 'Disponible' : 'No disponible'}</p>
        </div>
      </details>

      {/* Test de transcripción */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Test de transcripción:</span>
          <button
            onClick={testSpeechRecognition}
            disabled={isTestingSTT || !diagnosticInfo.isSupported || !diagnosticInfo.isOnline || !diagnosticInfo.hasPermissions}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isTestingSTT 
                ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                : diagnosticInfo.isSupported && diagnosticInfo.isOnline && diagnosticInfo.hasPermissions
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isTestingSTT ? 'MIC: Probando...' : 'Probar Transcripción'}
          </button>
        </div>

        {/* Resultado del test */}
        {diagnosticInfo.testResult && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700">{diagnosticInfo.testResult}</p>
          </div>
        )}

        {/* Error específico */}
        {diagnosticInfo.lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-1">Error detectado:</h4>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{diagnosticInfo.lastError}</p>
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      {(!diagnosticInfo.isSupported || !diagnosticInfo.isOnline || !diagnosticInfo.hasPermissions) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">🛠️ Soluciones recomendadas:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {!diagnosticInfo.isSupported && (
              <li>• Usar Google Chrome o Microsoft Edge para mejor compatibilidad</li>
            )}
            {!diagnosticInfo.isOnline && (
              <li>• Verificar conexión a internet - Web Speech API requiere conectividad</li>
            )}
            {!diagnosticInfo.hasPermissions && (
              <li>• Permitir acceso al micrófono en configuración del navegador</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}; 