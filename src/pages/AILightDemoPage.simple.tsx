import React, { useState, useRef } from 'react';
import { aiModeStore, LocalTranscription } from '../stores/aiModeStore.simple';

const AILightDemoPageSimple: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Simular transcripción local
        const mockTranscription: LocalTranscription = {
          id: Date.now().toString(),
          audioBlob,
          text: 'Transcripción simulada del audio grabado',
          confidence: 0.85,
          timestamp: new Date(),
          userId: 'demo-user',
          sessionId: 'demo-session',
          metadata: {
            duration: 5000,
            sampleRate: 44100,
            channels: 1
          }
        };

        aiModeStore.addLocalTranscription(mockTranscription);
        setTranscription(mockTranscription.text);
        setError(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Error al acceder al micrófono: ' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Detener todas las pistas de audio
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleFlag = (flag: 'offlineMode' | 'aiLightLocalSTT' | 'promoteToProOnReconnect') => {
    const currentState = aiModeStore.getState();
    const newValue = !currentState[flag];
    aiModeStore.setFlag(flag, newValue);
    // Forzar re-render
    window.location.reload();
  };

  const currentState = aiModeStore.getState();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 AI Light + Offline Mode Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Página de demostración del módulo AI Light con funcionalidades offline y transcripción local.
          </p>

          {/* Estado del módulo */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">Estado del Módulo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="offlineMode"
                  checked={currentState.offlineMode}
                  onChange={() => toggleFlag('offlineMode')}
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
                  checked={currentState.aiLightLocalSTT}
                  onChange={() => toggleFlag('aiLightLocalSTT')}
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
                  checked={currentState.promoteToProOnReconnect}
                  onChange={() => toggleFlag('promoteToProOnReconnect')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="promoteToProOnReconnect" className="text-sm font-medium text-gray-700">
                  Auto-Promote
                </label>
              </div>
            </div>
          </div>

          {/* Grabación de audio */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? (
                  <div className="flex items-center space-x-2 text-white">
                    <div className="animate-pulse bg-white rounded-full w-3 h-3"></div>
                    <span>Detener</span>
                  </div>
                ) : (
                  <span>Iniciar Grabación</span>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span>{error}</span>
              </div>
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
                  <li>• Modo Offline: {currentState.offlineMode ? 'Activado' : 'Desactivado'}</li>
                  <li>• STT Local: {currentState.aiLightLocalSTT ? 'Activado' : 'Desactivado'}</li>
                  <li>• Auto-Promote: {currentState.promoteToProOnReconnect ? 'Activado' : 'Desactivado'}</li>
                  <li>• Service Worker: {navigator.serviceWorker ? 'Disponible' : 'No disponible'}</li>
                  <li>• WebAssembly: {typeof WebAssembly !== 'undefined' ? 'Soportado' : 'No soportado'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILightDemoPageSimple;
