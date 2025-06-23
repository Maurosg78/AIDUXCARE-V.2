import React, { useState, useEffect, useRef } from 'react';
import { BufferedTranscriptionService, BufferedSegment, BufferConfig, TranscriptionCallbacks } from '../services/BufferedTranscriptionService';
import RealWorldSOAPProcessor, { ProcessingResult } from '../services/RealWorldSOAPProcessor';

// === INTERFACES ===

interface DemoState {
  isRecording: boolean;
  currentText: string;
  currentSpeaker: string;
  bufferedSegments: BufferedSegment[];
  soapResults: ProcessingResult[];
  error: string | null;
  duration: number;
  bufferStats: {
    bufferedSegments: number;
    currentBufferWords: number;
    currentSpeaker: string;
    isRecording: boolean;
    lastConfidence: number;
  };
}

// === COMPONENTE PRINCIPAL ===

export const BufferedTranscriptionDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    isRecording: false,
    currentText: '',
    currentSpeaker: '',
    bufferedSegments: [],
    soapResults: [],
    error: null,
    duration: 0,
    bufferStats: {
      bufferedSegments: 0,
      currentBufferWords: 0,
      currentSpeaker: '',
      isRecording: false,
      lastConfidence: 0
    }
  });

  const [config, setConfig] = useState<BufferConfig>({
    minWordCount: 8,
    maxWaitTime: 4000,
    pauseThreshold: 1500,
    confidenceThreshold: 0.6,
    enableRealTimeDisplay: true
  });

  const transcriptionService = useRef<BufferedTranscriptionService | null>(null);
  const soapProcessor = useRef<RealWorldSOAPProcessor | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  // === INICIALIZACIÓN ===

  useEffect(() => {
    initializeServices();
    return cleanup;
  }, []);

  const initializeServices = () => {
    // Configurar callbacks
    const callbacks: TranscriptionCallbacks = {
      onRealTimeUpdate: handleRealTimeUpdate,
      onBufferedSegment: handleBufferedSegment,
      onSOAPProcessing: handleSOAPProcessing,
      onError: handleError
    };

    // Inicializar servicios
    transcriptionService.current = new BufferedTranscriptionService(callbacks, config);
    soapProcessor.current = new RealWorldSOAPProcessor();
  };

  // === HANDLERS ===

  const handleRealTimeUpdate = (text: string, speaker: string) => {
    setState(prev => ({
      ...prev,
      currentText: text,
      currentSpeaker: speaker
    }));
  };

  const handleBufferedSegment = (segment: BufferedSegment) => {
    setState(prev => ({
      ...prev,
      bufferedSegments: [...prev.bufferedSegments, segment]
    }));

    console.log(`✅ Segmento buffered: ${segment.wordCount} palabras | ${segment.speaker}`);
  };

  const handleSOAPProcessing = async (segments: BufferedSegment[]) => {
    if (!soapProcessor.current) return;

    try {
      console.log(`🧠 Procesando ${segments.length} segmentos con SOAP...`);

      // Convertir segmentos a texto para procesamiento
      const fullTranscription = segments.map(s => s.text).join(' ');

      // Procesar con SOAP
      const soapResult = await soapProcessor.current.processTranscription(fullTranscription);

      setState(prev => ({
        ...prev,
        soapResults: [...prev.soapResults, soapResult]
      }));

      console.log(`✅ SOAP completado: ${soapResult.segments.length} segmentos clasificados`);

    } catch (error) {
      console.error('Error procesando SOAP:', error);
      handleError('Error en procesamiento SOAP');
    }
  };

  const handleError = (error: string) => {
    setState(prev => ({ ...prev, error }));
    console.error('Error en transcripción:', error);
  };

  // === CONTROLES ===

  const startRecording = async () => {
    if (!transcriptionService.current) {
      handleError('Servicio de transcripción no disponible');
      return;
    }

    setState(prev => ({
      ...prev,
      isRecording: true,
      currentText: '',
      bufferedSegments: [],
      soapResults: [],
      error: null,
      duration: 0
    }));

    await transcriptionService.current.startRecording();
    startTimer();
  };

  const stopRecording = async () => {
    if (!transcriptionService.current) return;

    const finalSegments = await transcriptionService.current.stopRecording();

    setState(prev => ({
      ...prev,
      isRecording: false
    }));

    stopTimer();

    console.log(`🔚 Grabación finalizada: ${finalSegments.length} segmentos totales`);
  };

  const clearAll = () => {
    setState(prev => ({
      ...prev,
      currentText: '',
      bufferedSegments: [],
      soapResults: [],
      error: null,
      duration: 0
    }));
  };

  const updateConfig = (newConfig: Partial<BufferConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    if (transcriptionService.current) {
      transcriptionService.current.updateConfig(updatedConfig);
    }
  };

  // === TIMER ===

  const startTimer = () => {
    startTime.current = Date.now();
    durationInterval.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: Date.now() - startTime.current
      }));
      
      // Actualizar stats del buffer
      if (transcriptionService.current) {
        setState(prev => ({
          ...prev,
          bufferStats: transcriptionService.current!.getStats()
        }));
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const cleanup = () => {
    if (transcriptionService.current) {
      transcriptionService.current.stopRecording();
    }
    stopTimer();
  };

  // === UTILIDADES ===

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return 'bg-blue-100 text-blue-800';
      case 'THERAPIST': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return '🧑‍🦽';
      case 'THERAPIST': return '👩‍⚕️';
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

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎤 Transcripción con Buffer Inteligente
          </h1>
          <p className="text-gray-600">
            Acumula transcripción hasta formar párrafos completos, luego procesa con SOAP para evitar análisis sílaba por sílaba
          </p>
        </div>

        {/* CONTROLES Y CONFIGURACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Panel de Control */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">🎛️ Control de Grabación</h3>
            
            <div className="space-y-4">
              <div className="flex space-x-3">
                <button
                  onClick={startRecording}
                  disabled={state.isRecording}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-medium disabled:bg-gray-400 hover:bg-red-700 transition-colors"
                >
                  {state.isRecording ? '🔴 Grabando...' : '🎤 Iniciar Grabación'}
                </button>
                
                <button
                  onClick={stopRecording}
                  disabled={!state.isRecording}
                  className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium disabled:bg-gray-400 hover:bg-gray-700 transition-colors"
                >
                  ⏹️ Detener
                </button>
              </div>
              
              <button
                onClick={clearAll}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                🧹 Limpiar Todo
              </button>
            </div>

            {/* Estado de la grabación */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-1">
                <div>⏱️ Duración: <span className="font-mono">{formatDuration(state.duration)}</span></div>
                <div>🎯 Segmentos: <span className="font-mono">{state.bufferedSegments.length}</span></div>
                <div>🧠 Análisis SOAP: <span className="font-mono">{state.soapResults.length}</span></div>
              </div>
            </div>
          </div>

          {/* Configuración del Buffer */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">⚙️ Configuración Buffer</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mínimo palabras: {config.minWordCount}
                </label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={config.minWordCount}
                  onChange={(e) => updateConfig({ minWordCount: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pausa máxima: {config.pauseThreshold}ms
                </label>
                <input
                  type="range"
                  min="1000"
                  max="3000"
                  step="100"
                  value={config.pauseThreshold}
                  onChange={(e) => updateConfig({ pauseThreshold: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confianza mínima: {Math.round(config.confidenceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="0.9"
                  step="0.1"
                  value={config.confidenceThreshold}
                  onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Estado del Buffer */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Estado del Buffer</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Buffer actual:</span>
                <span className="font-mono text-sm">{state.bufferStats.currentBufferWords} palabras</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hablante actual:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSpeakerColor(state.bufferStats.currentSpeaker)}`}>
                  {getSpeakerIcon(state.bufferStats.currentSpeaker)} {state.bufferStats.currentSpeaker || 'NINGUNO'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confianza:</span>
                <span className="font-mono text-sm">{Math.round(state.bufferStats.lastConfidence * 100)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Segmentos listos:</span>
                <span className="font-mono text-sm">{state.bufferStats.bufferedSegments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-800">{state.error}</span>
            </div>
          </div>
        )}

        {/* TRANSCRIPCIÓN EN TIEMPO REAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Transcripción Actual */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">📝 Transcripción en Tiempo Real</h3>
              <p className="text-sm text-gray-600">Buffer acumulándose hasta formar párrafos completos</p>
            </div>
            
            <div className="p-4 min-h-[200px]">
              {state.currentText ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSpeakerColor(state.currentSpeaker)}`}>
                      {getSpeakerIcon(state.currentSpeaker)} {state.currentSpeaker}
                    </span>
                    <span className="text-xs text-gray-500">
                      {state.currentText.split(' ').length} palabras
                    </span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">
                      {state.currentText}
                      <span className="ml-1 animate-pulse">|</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎤</div>
                    <p>Esperando transcripción...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Segmentos Buffered */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">📦 Segmentos Buffered</h3>
              <p className="text-sm text-gray-600">Párrafos completos listos para SOAP</p>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {state.bufferedSegments.length > 0 ? (
                <div className="space-y-3">
                  {state.bufferedSegments.slice(-5).map((segment, index) => (
                    <div key={segment.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSpeakerColor(segment.speaker)}`}>
                          {getSpeakerIcon(segment.speaker)} {segment.speaker}
                        </span>
                        <div className="text-xs text-gray-500 space-x-2">
                          <span>{segment.wordCount} palabras</span>
                          <span>{Math.round(segment.confidence * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📦</div>
                    <p>Sin segmentos buffered</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESULTADOS SOAP */}
        {state.soapResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">🧠 Análisis SOAP</h3>
              <p className="text-sm text-gray-600">Procesamiento inteligente de párrafos completos</p>
            </div>
            
            <div className="p-4">
              {state.soapResults.map((result, resultIndex) => (
                <div key={resultIndex} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Análisis #{resultIndex + 1}</h4>
                    <div className="text-sm text-gray-500">
                      {result.segments.length} segmentos | {Math.round(result.processingMetrics.averageConfidence * 100)}% confianza
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {result.segments.map((segment, segIndex) => (
                      <div key={segIndex} className={`p-3 rounded-lg border ${getSOAPSectionColor(segment.section)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg">{segment.section}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSpeakerColor(segment.speaker)}`}>
                            {segment.speaker}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">
                          {segment.text}
                        </p>
                        <div className="text-xs text-gray-500">
                          Confianza: {Math.round(segment.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BufferedTranscriptionDemo; 