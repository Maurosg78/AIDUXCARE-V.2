import React, { useState, useEffect, useRef } from 'react';
import { IntegratedChunkingService, ChunkedTranscriptionResult, ChunkSOAPResult, INTEGRATED_CONFIGS, IntegratedConfig } from '../services/IntegratedChunkingService';
import { Chunk, Utterance } from '../services/TranscriptionChunkingService';

// === INTERFACES ===

interface DemoState {
  isRecording: boolean;
  currentText: string;
  chunks: Chunk[];
  processedChunks: ChunkSOAPResult[];
  fullResult: ChunkedTranscriptionResult | null;
  error: string | null;
  duration: number;
  stats: {
    accumulatedSegments: number;
    isProcessing: boolean;
    fullTranscriptLength: number;
  };
}

// === COMPONENTE PRINCIPAL ===

export const ChunkedTranscriptionDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    isRecording: false,
    currentText: '',
    chunks: [],
    processedChunks: [],
    fullResult: null,
    error: null,
    duration: 0,
    stats: {
      accumulatedSegments: 0,
      isProcessing: false,
      fullTranscriptLength: 0
    }
  });

  const [config, setConfig] = useState<IntegratedConfig>(INTEGRATED_CONFIGS.MAURICIO_SPEC);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);

  const chunkingService = useRef<IntegratedChunkingService | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  // === INICIALIZACIÓN ===

  useEffect(() => {
    initializeService();
    return cleanup;
  }, []);

  const initializeService = () => {
    console.log('TARGET: Inicializando Servicio de Chunking según especificación de Mauricio');
    
    const callbacks = {
      onChunkCreated: handleChunkCreated,
      onChunkProcessed: handleChunkProcessed,
      onBatchCompleted: handleBatchCompleted,
      onError: handleError
    };

    chunkingService.current = new IntegratedChunkingService(callbacks, config);
  };

  // === HANDLERS ===

  const handleChunkCreated = (chunk: Chunk) => {
    console.log(`📦 Chunk creado: ${chunk.id} con ${chunk.utterances.length} utterances`);
    setState(prev => ({
      ...prev,
      chunks: [...prev.chunks, chunk]
    }));
  };

  const handleChunkProcessed = (result: ChunkSOAPResult) => {
    console.log(`SUCCESS: Chunk procesado: ${result.chunkId} | Confianza: ${result.confidence.toFixed(2)}`);
    setState(prev => ({
      ...prev,
      processedChunks: [...prev.processedChunks, result]
    }));
  };

  const handleBatchCompleted = (result: ChunkedTranscriptionResult) => {
    console.log('TARGET: Batch completado con chunking:', result);
    setState(prev => ({
      ...prev,
      fullResult: result
    }));
  };

  const handleError = (error: Error) => {
    console.error('ERROR: Error en chunking:', error);
    setState(prev => ({ ...prev, error: error.message }));
  };

  // === CONTROLES ===

  const startRecording = async () => {
    if (!chunkingService.current) {
      handleError(new Error('Servicio de chunking no disponible'));
      return;
    }

    console.log('AUDIO: Iniciando grabación con chunking automático');
    console.log(`STATS: Configuración: min ${config.bufferConfig.minWordCount} palabras por segmento`);
    console.log(`📦 Chunking: ${config.chunkingConfig.chunkSize} utterances, ${config.chunkingConfig.overlap} overlap`);

    setState(prev => ({
      ...prev,
      isRecording: true,
      chunks: [],
      processedChunks: [],
      fullResult: null,
      error: null,
      duration: 0
    }));

    await chunkingService.current.startRecording();
    startTimer();
  };

  const stopRecording = async () => {
    if (!chunkingService.current) return;

    console.log('🛑 Deteniendo grabación...');
    await chunkingService.current.stopRecording();

    setState(prev => ({
      ...prev,
      isRecording: false
    }));

    stopTimer();
  };

  const clearAll = () => {
    setState(prev => ({
      ...prev,
      chunks: [],
      processedChunks: [],
      fullResult: null,
      error: null,
      duration: 0,
      currentText: ''
    }));
    setSelectedChunk(null);
  };

  const processOfflineText = async () => {
    if (!chunkingService.current) return;

    const exampleText = `
TERAPEUTA: Hola, cuéntame qué te pasa.
PACIENTE: Me duele la zona lumbar desde hace 2 semanas.
TERAPEUTA: ¿El dolor baja por la pierna?
PACIENTE: Sí, llega hasta el tobillo izquierdo.
TERAPEUTA: Vamos a hacer una evaluación de movilidad.
PACIENTE: Me duele más al inclinarme hacia delante.
TERAPEUTA: Esto indica un compromiso L4-L5.
TERAPEUTA: Recomiendo Tecarterapia y ejercicios de core.
PACIENTE: ¿Cuánto tiempo de tratamiento necesito?
TERAPEUTA: Aproximadamente 8-10 sesiones, evaluando progreso.
    `.trim();

    try {
      console.log('📄 Procesando texto ejemplo con chunking...');
      const result = await chunkingService.current.processFullTranscription(exampleText);
      
      setState(prev => ({
        ...prev,
        fullResult: result,
        chunks: result.chunks,
        processedChunks: result.soapResults
      }));

      console.log('SUCCESS: Procesamiento offline completado');
    } catch (error) {
      handleError(error as Error);
    }
  };

  const updateConfig = (newConfig: Partial<IntegratedConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    if (chunkingService.current) {
      chunkingService.current.updateConfig(updatedConfig);
    }

    console.log('STATS: Configuración actualizada:', updatedConfig);
  };

  // === TIMER Y STATS ===

  const startTimer = () => {
    startTime.current = Date.now();
    durationInterval.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: Date.now() - startTime.current
      }));
      
      // Actualizar stats
      if (chunkingService.current) {
        setState(prev => ({
          ...prev,
          stats: chunkingService.current!.getStats()
        }));
      }
    }, 100);
  };

  const stopTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const cleanup = () => {
    stopTimer();
  };

  // === UTILIDADES ===

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}:${(seconds % 60).toString().padStart(2, '0')}` : `${seconds}s`;
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return 'text-blue-600';
      case 'THERAPIST': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return 'PERSON:‍🦱';
      case 'THERAPIST': return 'DOCTOR:';
      default: return '❓';
    }
  };

  const getSOAPSectionColor = (section: string) => {
    switch (section) {
      case 'S': return 'bg-blue-50 border-blue-200';
      case 'O': return 'bg-green-50 border-green-200';
      case 'A': return 'bg-yellow-50 border-yellow-200';
      case 'P': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getChunkComplexityColor = (chunk: Chunk) => {
    const complexity = chunk.metadata?.hasSymptoms && chunk.metadata?.hasExamination ? 'complex' : 
                      chunk.metadata?.hasSymptoms || chunk.metadata?.hasExamination ? 'medium' : 'simple';
    
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TARGET: Chunking Semántico en Tiempo Real - Especificación Mauricio
          </h1>
          <p className="text-gray-600">
            Implementación exacta: captura → buffer (min {config.bufferConfig.minWordCount} palabras) → chunks ({config.chunkingConfig.chunkSize} utterances, {config.chunkingConfig.overlap} overlap) → análisis SOAP
          </p>
          <div className="mt-2 text-sm text-green-600">
            SUCCESS: NO más sílaba por sílaba • SUCCESS: Segmentos semánticamente completos • SUCCESS: Solapamiento inteligente
          </div>
        </div>

        {/* CONTROLES Y CONFIGURACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Configuración Buffer */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">⚙️ Config Buffer</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min palabras: {config.bufferConfig.minWordCount}
                </label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={config.bufferConfig.minWordCount}
                  onChange={(e) => updateConfig({
                    bufferConfig: { ...config.bufferConfig, minWordCount: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">VITAL: Evita procesamiento sílaba por sílaba</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pausa máx: {config.bufferConfig.pauseThreshold}ms
                </label>
                <input
                  type="range"
                  min="1000"
                  max="3000"
                  value={config.bufferConfig.pauseThreshold}
                  onChange={(e) => updateConfig({
                    bufferConfig: { ...config.bufferConfig, pauseThreshold: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Configuración Chunking */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">📦 Config Chunking</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño chunk: {config.chunkingConfig.chunkSize} utterances
                </label>
                <input
                  type="range"
                  min="5"
                  max="12"
                  value={config.chunkingConfig.chunkSize}
                  onChange={(e) => updateConfig({
                    chunkingConfig: { ...config.chunkingConfig, chunkSize: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">Especificación Mauricio: 8 utterances</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solapamiento: {config.chunkingConfig.overlap} utterances
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={config.chunkingConfig.overlap}
                  onChange={(e) => updateConfig({
                    chunkingConfig: { ...config.chunkingConfig, overlap: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">Preserva contexto entre chunks</div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">STATS: Estadísticas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Segmentos buffer:</span>
                <span className="font-mono">{state.stats.accumulatedSegments}</span>
              </div>
              <div className="flex justify-between">
                <span>Chunks creados:</span>
                <span className="font-mono">{state.chunks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Chunks procesados:</span>
                <span className="font-mono">{state.processedChunks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Transcripción:</span>
                <span className="font-mono">{state.stats.fullTranscriptLength} chars</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo:</span>
                <span className="font-mono">{formatDuration(state.duration)}</span>
              </div>
              {state.stats.isProcessing && (
                <div className="text-orange-600 text-center">RELOAD: Procesando...</div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">🎛️ Controles</h3>
            <div className="space-y-3">
              <button
                onClick={startRecording}
                disabled={state.isRecording}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 hover:bg-red-700 transition-colors"
              >
                {state.isRecording ? 'RED: Grabando...' : 'AUDIO: Iniciar Grabación'}
              </button>
              
              <button
                onClick={stopRecording}
                disabled={!state.isRecording}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 hover:bg-gray-700 transition-colors"
              >
                🛑 Detener
              </button>
              
              <button
                onClick={processOfflineText}
                disabled={state.isRecording}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
              >
                📄 Procesar Ejemplo
              </button>
              
              <button
                onClick={clearAll}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                CLEAN Limpiar Todo
              </button>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">ERROR:</span>
              <span className="text-red-800">{state.error}</span>
            </div>
          </div>
        )}

        {/* CHUNKS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lista de Chunks */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">📦 Chunks Semánticos</h3>
              <p className="text-sm text-gray-600">
                {state.chunks.length} chunks • {config.chunkingConfig.chunkSize} utterances • {config.chunkingConfig.overlap} overlap
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {state.chunks.length > 0 ? (
                <div className="space-y-3">
                  {state.chunks.map((chunk, index) => (
                    <div 
                      key={chunk.id}
                      onClick={() => setSelectedChunk(chunk)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedChunk?.id === chunk.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Chunk {index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getChunkComplexityColor(chunk)}`}>
                          {chunk.metadata?.hasSymptoms && chunk.metadata?.hasExamination ? 'Complex' : 
                           chunk.metadata?.hasSymptoms || chunk.metadata?.hasExamination ? 'Medium' : 'Simple'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>NOTES {chunk.utterances.length} utterances</div>
                        <div>👥 {new Set(chunk.utterances.map(u => u.speaker)).size} hablantes</div>
                        <div>STATS: {chunk.metadata?.totalWords || 0} palabras</div>
                        {chunk.metadata?.hasSymptoms && <div>MEDICAL: Síntomas</div>}
                        {chunk.metadata?.hasExamination && <div>SEARCH Examen</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">📦</div>
                  <p>Inicie grabación o procese ejemplo</p>
                </div>
              )}
            </div>
          </div>

          {/* Detalle del Chunk */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">SEARCH Detalle del Chunk</h3>
              <p className="text-sm text-gray-600">
                {selectedChunk ? `${selectedChunk.id} - ${selectedChunk.utterances.length} utterances` : 'Seleccione un chunk'}
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {selectedChunk ? (
                <div className="space-y-4">
                  
                  {/* Utterances del Chunk */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Utterances:</h4>
                    <div className="space-y-2">
                      {selectedChunk.utterances.map((utterance, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-lg">{getSpeakerIcon(utterance.speaker)}</span>
                          <div className="flex-1">
                            <div className={`text-xs font-medium ${getSpeakerColor(utterance.speaker)}`}>
                              {utterance.speaker}
                            </div>
                            <div className="text-sm text-gray-800">
                              {utterance.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Metadata:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Índices</div>
                        <div>{selectedChunk.startIndex} - {selectedChunk.endIndex}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Palabras</div>
                        <div>{selectedChunk.metadata?.totalWords || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Hablantes</div>
                        <div>{selectedChunk.metadata?.speakerTurns || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Contenido</div>
                        <div>
                          {selectedChunk.metadata?.hasSymptoms ? 'MEDICAL:' : ''}
                          {selectedChunk.metadata?.hasExamination ? 'SEARCH' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">SEARCH</div>
                  <p>Seleccione un chunk para ver detalles</p>
                </div>
              )}
            </div>
          </div>

          {/* Resultados SOAP */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">AI: Resultados SOAP</h3>
              <p className="text-sm text-gray-600">
                {state.processedChunks.length} chunks procesados
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {state.processedChunks.length > 0 ? (
                <div className="space-y-4">
                  {state.processedChunks.map((result, index) => (
                    <div key={result.chunkId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{result.chunkId}</span>
                        <span className="text-xs text-gray-500">
                          {Math.round(result.confidence * 100)}% confianza
                        </span>
                      </div>
                      
                      {result.soapResult.segments.length > 0 ? (
                        <div className="space-y-2">
                          {result.soapResult.segments.map((segment, segIndex) => (
                            <div key={segIndex} className={`p-2 rounded border ${getSOAPSectionColor(segment.section)}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm">{segment.section}</span>
                                <span className="text-xs">
                                  {Math.round(segment.confidence * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-700">
                                {segment.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-sm py-2">
                          Sin clasificaciones SOAP
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">AI:</div>
                  <p>Los chunks procesados aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESULTADO FINAL */}
        {state.fullResult && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">STATS: Resultado Final del Chunking</h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {state.fullResult.chunkingStats.totalChunks}
                  </div>
                  <div className="text-sm text-blue-700">Total Chunks</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {state.fullResult.chunkingStats.averageChunkSize.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-700">Tamaño Promedio</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {state.fullResult.chunkingStats.overlapUtterances}
                  </div>
                  <div className="text-sm text-yellow-700">Utterances Overlap</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {state.fullResult.chunkingStats.processingEfficiency.toFixed(1)}x
                  </div>
                  <div className="text-sm text-purple-700">Eficiencia</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>TIME: Tiempo total de procesamiento: {formatDuration(state.fullResult.totalProcessingTime)}</p>
                <p>📄 Utterances totales: {state.fullResult.utterances.length}</p>
                <p>AI: Resultados SOAP: {state.fullResult.soapResults.length}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChunkedTranscriptionDemo; 