/**
 * 🔧 PÁGINA DE DEBUG: Aislamiento del AudioPipelineService
 * Para diagnosticar el bug de chunks repetidos
 */

import React, { useState, useRef } from 'react';
import AudioPipelineService from '../services/AudioPipelineService';

const DebugAudioPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [chunkLogs, setChunkLogs] = useState<string[]>([]);
  const [transcriptionLogs, setTranscriptionLogs] = useState<string[]>([]);
  const audioServiceRef = useRef<AudioPipelineService | null>(null);

  // Inicializar servicio de audio
  if (!audioServiceRef.current) {
    audioServiceRef.current = new AudioPipelineService();
  }

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setChunkLogs([]);
      setTranscriptionLogs([]);
      
      // Callback para debug detallado
      const debugCallback = (text: string, isFinal: boolean) => {
        const timestamp = new Date().toLocaleTimeString();
        const preview = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        const logEntry = `[${timestamp}] ${isFinal ? 'FINAL' : 'PARTIAL'}: "${preview}"`;
        
        console.log('🔍 CHUNK DEBUG:', {
          timestamp,
          isFinal,
          textLength: text.length,
          preview,
          fullText: text
        });
        
        setTranscriptionLogs(prev => [...prev, logEntry]);
      };

      await audioServiceRef.current?.iniciarGrabacion(debugCallback);
      
    } catch (error) {
      console.error('❌ Error iniciando grabación:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    audioServiceRef.current?.detenerGrabacion();
  };

  const clearLogs = () => {
    setChunkLogs([]);
    setTranscriptionLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🔧 DEBUG: AudioPipelineService
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Página de debug para diagnosticar el problema de chunks repetidos.
              Observa los logs de la consola para ver los Blobs crudos.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={handleStartRecording}
                disabled={isRecording}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {isRecording ? '🎙️ Grabando...' : '▶️ Iniciar Grabación'}
              </button>
              
              <button
                onClick={handleStopRecording}
                disabled={!isRecording}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
              >
                ⏹️ Detener Grabación
              </button>
              
              <button
                onClick={clearLogs}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                🧹 Limpiar Logs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Logs de Transcripción */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                📝 Logs de Transcripción ({transcriptionLogs.length})
              </h3>
              
              <div className="bg-white rounded border h-64 overflow-y-auto p-3 text-sm font-mono">
                {transcriptionLogs.length === 0 ? (
                  <div className="text-gray-400 italic">
                    No hay logs de transcripción aún...
                  </div>
                ) : (
                  transcriptionLogs.map((log, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-gray-100">
                      <div className={`${log.includes('FINAL') ? 'text-green-600' : 'text-blue-600'}`}>
                        {log}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Instrucciones de Debug */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-3">
                🔍 Instrucciones de Debug
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white rounded p-3">
                  <strong>1. Abrir DevTools (F12)</strong>
                  <p className="text-gray-600">Ve a la pestaña Console para ver los logs detallados</p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <strong>2. Iniciar Grabación</strong>
                  <p className="text-gray-600">Habla por 10-15 segundos continuos</p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <strong>3. Observar Logs</strong>
                  <p className="text-gray-600">Busca patrones de repetición en los chunks</p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <strong>4. Analizar Texto</strong>
                  <p className="text-gray-600">¿Los primeros 50 caracteres son siempre iguales?</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">
              🎯 Qué Buscar en los Logs
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Tamaño de Blobs:</strong> ¿Aumentan progresivamente o se mantienen iguales?</li>
              <li>• <strong>Contenido de Transcripción:</strong> ¿Cambia el texto o se repite?</li>
              <li>• <strong>Timestamps:</strong> ¿Los chunks se procesan en intervalos correctos?</li>
              <li>• <strong>Chunks Acumulados:</strong> ¿Se están limpiando después de procesarse?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAudioPage; 