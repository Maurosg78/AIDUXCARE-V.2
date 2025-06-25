import React, { useState } from 'react';
import RealTimeAudioCapture from '../components/RealTimeAudioCapture';
import { TranscriptionSegment } from '../core/audio/AudioCaptureService';

const AudioTestPage: React.FC = () => {
  const [completedSegments, setCompletedSegments] = useState<TranscriptionSegment[]>([]);
  const [lastSegment, setLastSegment] = useState<TranscriptionSegment | null>(null);

  const handleCaptureComplete = (segments: TranscriptionSegment[]) => {
    setCompletedSegments(segments);
    console.log('🎉 Captura completada:', segments);
  };

  const handleTranscriptionUpdate = (segment: TranscriptionSegment) => {
    setLastSegment(segment);
    console.log('📝 Nuevo segmento:', segment);
  };

  const exportTranscription = () => {
    if (completedSegments.length === 0) {
      alert('No hay transcripción para exportar');
      return;
    }

    const transcriptionText = completedSegments
      .map(segment => `[${segment.actor.toUpperCase()}] ${segment.content}`)
      .join('\n');

    const blob = new Blob([transcriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripcion_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AUDIO: Prueba de STT en Tiempo Real
          </h1>
          <p className="text-lg text-gray-600">
            Speech-to-Text GRATUITO con Web Speech API - Costo: $0.00
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            SUCCESS: 100% Gratuito • Sin límites • Sin APIs de pago
          </div>
        </div>

        {/* Componente principal */}
        <div className="mb-8">
          <RealTimeAudioCapture
            onCaptureComplete={handleCaptureComplete}
            onTranscriptionUpdate={handleTranscriptionUpdate}
            language="es"
            className="w-full"
          />
        </div>

        {/* Panel de información en tiempo real */}
        {lastSegment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              RELOAD: Último Segmento Procesado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Actor:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {lastSegment.actor}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Confianza:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {lastSegment.confidence}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Hora:</span>
                <span className="ml-2 text-blue-600">
                  {new Date(lastSegment.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium text-blue-700">Contenido:</span>
              <p className="mt-1 text-blue-800 bg-white p-2 rounded border">
                {lastSegment.content}
              </p>
            </div>
          </div>
        )}

        {/* Resultados finales */}
        {completedSegments.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                NOTES: Transcripción Completada
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {completedSegments.length} segmentos
                </span>
                <button
                  onClick={exportTranscription}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  📥 Exportar
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completedSegments.map((segment, index) => (
                <div key={segment.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        segment.actor === 'profesional' ? 'bg-blue-100 text-blue-800' :
                        segment.actor === 'paciente' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {segment.actor}
                      </span>
                      <span className={`text-xs font-medium ${
                        segment.confidence === 'entendido' ? 'text-green-600' :
                        segment.confidence === 'poco_claro' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {segment.confidence}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(segment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{segment.content}</p>
                </div>
              ))}
            </div>

            {/* Estadísticas de la transcripción */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                STATS: Resumen de la Transcripción
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-lg text-blue-600">
                    {completedSegments.length}
                  </div>
                  <div className="text-gray-600">Segmentos</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-green-600">
                    {completedSegments.reduce((total, seg) => total + seg.content.split(' ').length, 0)}
                  </div>
                  <div className="text-gray-600">Palabras</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-purple-600">
                    {Math.round(completedSegments.filter(seg => seg.confidence === 'entendido').length / completedSegments.length * 100)}%
                  </div>
                  <div className="text-gray-600">Confianza</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-emerald-600">$0.00</div>
                  <div className="text-gray-600">Costo Total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel de información técnica */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🔧 Información Técnica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">SUCCESS: Características:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Web Speech API nativa del navegador</li>
                <li>• Transcripción en tiempo real</li>
                <li>• Detección automática de hablantes</li>
                <li>• Soporte para español e inglés</li>
                <li>• Evaluación de confianza</li>
                <li>• 100% gratuito, sin límites</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🌐 Compatibilidad:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• SUCCESS: Google Chrome (recomendado)</li>
                <li>• SUCCESS: Microsoft Edge</li>
                <li>• WARNING: Firefox (limitado)</li>
                <li>• ERROR: Safari</li>
                <li>• ERROR: Navegadores móviles antiguos</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              💡 <strong>Tip:</strong> Para mejores resultados, usa Chrome o Edge, habla claramente 
              y asegúrate de tener buena conexión a internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTestPage; 