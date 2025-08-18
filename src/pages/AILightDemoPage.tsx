import React, { useState, useRef, useEffect } from 'react';
import { useAiModeStore, useOfflineMode, useAiLightLocalSTT, usePromoteToProOnReconnect } from '../stores/aiModeStore';
import { createLocalTranscription } from '../core/sttLocal';
import PromoteToProButton from '../components/PromoteToProButton';

const AILightDemoPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { setFlag, addLocalTranscription } = useAiModeStore();
  const offlineMode = useOfflineMode();
  const aiLightLocalSTT = useAiLightLocalSTT();
  const promoteToProOnReconnect = usePromoteToProOnReconnect();

  // Monitorear estado de red
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para iniciar grabación
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        if (aiLightLocalSTT) {
          await processLocalTranscription(audioBlob);
        }
        
        // Liberar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      setError('Error accediendo al micrófono: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // Función para detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Función para procesar transcripción local
  const processLocalTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const userId = 'demo-user';
      const sessionId = crypto.randomUUID();
      
      const localTranscription = await createLocalTranscription(audioBlob, userId, sessionId);
      
      addLocalTranscription(localTranscription);
      setTranscription(localTranscription.text);
      
      console.log('Transcripción local creada:', localTranscription);
      
    } catch (error) {
      setError('Error en transcripción local: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para simular desconexión de red
  const simulateOffline = () => {
    setFlag('offlineMode', true);
    // En un entorno real, aquí se desconectaría la red
    console.log('Modo offline simulado activado');
  };

  // Función para simular reconexión
  const simulateOnline = () => {
    setFlag('offlineMode', false);
    console.log('Modo online simulado activado');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI Light + Offline Mode Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Demostración del módulo híbrido local/servidor para captura y transcripción de audio.
          </p>

          {/* Estado de la red */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  networkStatus ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="font-medium">
                  Estado de red: {networkStatus ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={simulateOffline}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Simular Offline
                </button>
                <button
                  onClick={simulateOnline}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Simular Online
                </button>
              </div>
            </div>
          </div>

          {/* Controles de configuración */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="offlineMode"
                checked={offlineMode}
                onChange={(e) => setFlag('offlineMode', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="offlineMode" className="text-sm font-medium text-gray-700">
                Modo Offline
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="aiLightLocalSTT"
                checked={aiLightLocalSTT}
                onChange={(e) => setFlag('aiLightLocalSTT', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="aiLightLocalSTT" className="text-sm font-medium text-gray-700">
                STT Local
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="promoteToProOnReconnect"
                checked={promoteToProOnReconnect}
                onChange={(e) => setFlag('promoteToProOnReconnect', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="promoteToProOnReconnect" className="text-sm font-medium text-gray-700">
                Auto-Promote
              </label>
            </div>
          </div>

          {/* Controles de grabación */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
              </button>

              {isProcessing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Procesando...</span>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="mt-3 flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span className="animate-pulse">Grabando...</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {/* Transcripción */}
          {transcription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Transcripción Local</h3>
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-gray-700">{transcription}</p>
              </div>
            </div>
          )}

          {/* Audio grabado */}
          {audioBlob && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Audio Grabado</h3>
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                <track kind="captions" src="" label="Español" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
          )}

          {/* Promote to Pro Button */}
          {transcription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Promote to Pro</h3>
              <PromoteToProButton />
            </div>
          )}
        </div>

        {/* Información del módulo */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Módulo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Características</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Grabación de audio offline</li>
                <li>• Transcripción local con WASM</li>
                <li>• Almacenamiento cifrado en IndexedDB</li>
                <li>• Background sync automático</li>
                <li>• Promote to Pro automático/manual</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Estado Actual</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Modo Offline: {offlineMode ? 'Activado' : 'Desactivado'}</li>
                <li>• STT Local: {aiLightLocalSTT ? 'Activado' : 'Desactivado'}</li>
                <li>• Auto-Promote: {promoteToProOnReconnect ? 'Activado' : 'Desactivado'}</li>
                <li>• Service Worker: {navigator.serviceWorker ? 'Disponible' : 'No disponible'}</li>
                <li>• WebAssembly: {typeof WebAssembly !== 'undefined' ? 'Soportado' : 'No soportado'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILightDemoPage;
