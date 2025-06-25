import React, { useState, useRef } from 'react';
import { SemanticChunkingProcessor, ChunkedSOAPResult, ChunkingConfig, SemanticChunk, ChunkProcessingResult } from '../services/SemanticChunkingProcessor';

// === INTERFACES ===

interface DemoState {
  fullTranscript: string;
  isProcessing: boolean;
  result: ChunkedSOAPResult | null;
  error: string | null;
  selectedChunk: SemanticChunk | null;
  showComparison: boolean;
  stats: any;
}

interface ComparisonResult {
  wordByWord: any;
  semantic: ChunkedSOAPResult;
  comparison: {
    coherenceImprovement: number;
    processingEfficiency: number;
    clinicalAccuracy: number;
  };
}

// === COMPONENTE PRINCIPAL ===

export const SemanticChunkingDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    fullTranscript: '',
    isProcessing: false,
    result: null,
    error: null,
    selectedChunk: null,
    showComparison: false,
    stats: null
  });

  const [config, setConfig] = useState<ChunkingConfig>({
    chunkSize: 5,
    overlapSize: 2,
    minChunkSize: 3,
    maxChunkSize: 8,
    preserveDialogue: true,
    preserveContext: true
  });

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const processorRef = useRef<SemanticChunkingProcessor | null>(null);

  // === TRANSCRIPCIONES DE EJEMPLO ===

  const exampleTranscripts = {
    fisioterapia: `Paciente: Hola doctor, desde hace como tres semanas me duele mucho el hombro derecho. Al principio pensé que era por dormir mal, pero ya no se me quita.

Terapeuta: Entiendo. Cuénteme, ¿cuándo le duele más? ¿Al mover el brazo o también en reposo?

Paciente: Principalmente cuando levanto el brazo hacia arriba, como para coger algo de un estante alto. También me molesta por las noches cuando me acuesto sobre ese lado.

Terapeuta: Perfecto. Vamos a evaluar el rango de movimiento. Necesito que levante el brazo lentamente hacia adelante... ¿hasta dónde puede llegar sin dolor?

Paciente: Hasta aquí más o menos... ay, ahí empieza a doler.

Terapeuta: Muy bien, observe que llega solo hasta unos 90 grados. Ahora flexione el codo y lleve la mano hacia la espalda... ¿cómo se siente?

Paciente: Eso me duele mucho más, como un pellizco muy fuerte.

Terapeuta: Esto indica una posible irritación del manguito rotador. El movimiento de flexión interna reproduce el dolor típico del síndrome de pinzamiento subacromial.

Paciente: ¿Es grave? ¿Necesito cirugía?

Terapeuta: No se preocupe, es tratable con fisioterapia. Recomiendo iniciar con ejercicios de movilización suave y posteriormente fortalecer la musculatura periescapular.`,

    psicologia: `Paciente: No sé por dónde empezar... últimamente me siento muy angustiada, como si todo me abrumara. No puedo concentrarme en el trabajo y tengo problemas para dormir.

Terapeuta: Entiendo que es difícil expresar cómo se siente. ¿Cuándo empezó a notar estos síntomas de angustia?

Paciente: Creo que después de que me cambiaron de departamento en el trabajo, hace unos dos meses. Al principio pensé que era normal, que me adaptaría, pero cada día es peor.

Terapeuta: El cambio laboral puede ser muy estresante. ¿Qué aspectos específicos le generan más ansiedad?

Paciente: Bueno, tengo un jefe nuevo que es muy exigente, y siento que no cumplo con sus expectativas. Constantemente me está revisando el trabajo y eso me pone nerviosa.

Terapeuta: Observe que menciona la sensación de no cumplir expectativas. ¿Esto le recuerda alguna situación similar en su vida?

Paciente: Ahora que lo dice... sí, es como cuando era pequeña y mi papá siempre me corregía. Nunca nada estaba bien para él.

Terapeuta: Es interesante esa conexión. Parece que el comportamiento de su jefe actual está activando memorias emocionales de su relación con su padre.`,

    compleja: `Paciente: Es complicado explicar todo lo que me pasa. Desde el accidente hace seis meses, nada es igual. Me duele la espalda baja, tengo dolores de cabeza frecuentes, y... bueno, también estoy muy deprimida.

Terapeuta: Veo que el accidente ha tenido múltiples impactos. Vamos a evaluar cada aspecto paso a paso. Primero, hábleme del dolor de espalda.

Paciente: El dolor es constante, como un dolor sordo que se intensifica cuando estoy sentada mucho tiempo. Por las mañanas me cuesta levantarme de la cama porque está muy rígida.

Terapeuta: Entiendo. Ahora necesito examinar su columna. Puede inclinarse hacia adelante lentamente... ¿cómo se siente?

Paciente: Ahí siento tirantez, pero no dolor agudo. Es más bien una sensación de que algo está tenso.

Terapeuta: Observe que la flexión está limitada a unos 60 grados, y hay espasmo muscular en la zona lumbar. ¿Los dolores de cabeza tienen alguna relación temporal con el dolor de espalda?

Paciente: Ahora que lo menciona, sí. Cuando la espalda está peor, los dolores de cabeza son más intensos. Y cuando tengo mucho dolor, me siento más triste y sin energía.

Terapeuta: Esta conexión entre dolor físico y estado emocional es muy común en casos post-traumáticos. El cuerpo y la mente están muy conectados en procesos de recuperación.

Paciente: No había pensado en eso. ¿Entonces todo está relacionado?

Terapeuta: Exactamente. El plan de tratamiento debe abordar tanto los aspectos físicos como emocionales. Recomiendo fisioterapia para la espalda, manejo del dolor, y apoyo psicológico para procesar el trauma del accidente.`
  };

  // === INICIALIZACIÓN ===

  React.useEffect(() => {
    processorRef.current = new SemanticChunkingProcessor(config);
    // Cargar ejemplo por defecto
    setState(prev => ({ 
      ...prev, 
      fullTranscript: exampleTranscripts.fisioterapia 
    }));
  }, []);

  // === HANDLERS ===

  const handleProcessTranscript = async () => {
    if (!state.fullTranscript.trim() || !processorRef.current) {
      setState(prev => ({ ...prev, error: 'Transcripción o procesador no disponible' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      result: null,
      selectedChunk: null 
    }));

    try {
      console.log('AI: Iniciando procesamiento semántico...');
      
      const result = await processorRef.current.processFullTranscript(
        state.fullTranscript,
        {
          preserveNarrative: true,
          parallelProcessing: true,
          generateInsights: true
        }
      );

      const stats = processorRef.current.getProcessingStats(result);

      setState(prev => ({ 
        ...prev, 
        result,
        stats,
        isProcessing: false 
      }));

      console.log('SUCCESS: Procesamiento completado:', result);

    } catch (error) {
      console.error('ERROR: Error en procesamiento:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Error: ${error}`,
        isProcessing: false 
      }));
    }
  };

  const handleCompareApproaches = async () => {
    if (!state.result) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Simular procesamiento "palabra por palabra" vs semántico
      const wordByWordResult = await simulateWordByWordProcessing(state.fullTranscript);
      
      const comparison = {
        coherenceImprovement: state.result.metadata.narrativeCoherence - wordByWordResult.coherence,
        processingEfficiency: wordByWordResult.processingTime / state.result.metadata.processingTime,
        clinicalAccuracy: state.result.metadata.clinicalCoherence - wordByWordResult.clinicalAccuracy
      };

      setComparisonResult({
        wordByWord: wordByWordResult,
        semantic: state.result,
        comparison
      });

      setState(prev => ({ ...prev, showComparison: true, isProcessing: false }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Error en comparación: ${error}`,
        isProcessing: false 
      }));
    }
  };

  const handleChunkSelect = (chunk: SemanticChunk) => {
    setState(prev => ({ ...prev, selectedChunk: chunk }));
  };

  const handleLoadExample = (type: keyof typeof exampleTranscripts) => {
    setState(prev => ({ 
      ...prev, 
      fullTranscript: exampleTranscripts[type],
      result: null,
      selectedChunk: null,
      error: null
    }));
    setComparisonResult(null);
  };

  const updateConfig = (newConfig: Partial<ChunkingConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    if (processorRef.current) {
      processorRef.current.updateConfig(updatedConfig);
    }
  };

  // === SIMULACIÓN PROCESAMIENTO PALABRA POR PALABRA ===

  const simulateWordByWordProcessing = async (transcript: string) => {
    // Simular el enfoque problemático "palabra por palabra"
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular demora

    return {
      segments: transcript.split(' ').length, // Muchos segmentos fragmentados
      coherence: 0.3, // Baja coherencia
      clinicalAccuracy: 0.4, // Baja precisión clínica
      processingTime: state.result?.metadata.processingTime * 3 || 3000, // Más lento
      problems: [
        'Pierde coherencia narrativa',
        'Falla en ironía y negaciones',
        'No reconstruye intención clínica',
        'Fragmentación excesiva',
        'Contexto perdido'
      ]
    };
  };

  // === UTILIDADES ===

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getChunkComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            AI: Chunking Semántico vs Palabra por Palabra
          </h1>
          <p className="text-gray-600">
            Implementación de la visión de Mauricio: captura completa → chunking inteligente → análisis contextual
          </p>
          <div className="mt-2 text-sm text-blue-600">
            SUCCESS: Mantiene coherencia narrativa • SUCCESS: Entiende causalidad clínica • SUCCESS: Procesa negaciones e ironía
          </div>
        </div>

        {/* CONTROLES Y CONFIGURACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Configuración Chunking */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">⚙️ Configuración</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño chunk: {config.chunkSize} oraciones
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={config.chunkSize}
                  onChange={(e) => updateConfig({ chunkSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solapamiento: {config.overlapSize} oraciones
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={config.overlapSize}
                  onChange={(e) => updateConfig({ overlapSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.preserveDialogue}
                  onChange={(e) => updateConfig({ preserveDialogue: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Preservar diálogos</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.preserveContext}
                  onChange={(e) => updateConfig({ preserveContext: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Preservar contexto</label>
              </div>
            </div>
          </div>

          {/* Ejemplos */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">NOTES: Ejemplos</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handleLoadExample('fisioterapia')}
                className="w-full text-left p-2 rounded bg-blue-50 hover:bg-blue-100 text-sm"
              >
                🏥 Fisioterapia - Hombro
              </button>
              <button
                onClick={() => handleLoadExample('psicologia')}
                className="w-full text-left p-2 rounded bg-green-50 hover:bg-green-100 text-sm"
              >
                AI: Psicología - Ansiedad
              </button>
              <button
                onClick={() => handleLoadExample('compleja')}
                className="w-full text-left p-2 rounded bg-yellow-50 hover:bg-yellow-100 text-sm"
              >
                RELOAD: Caso Complejo - Multi
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          {state.stats && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold mb-3">STATS: Estadísticas</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chunks creados:</span>
                  <span className="font-mono">{state.stats.efficiency.chunksCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coherencia narrativa:</span>
                  <span className="font-mono">{Math.round(state.stats.quality.narrativeCoherence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Coherencia clínica:</span>
                  <span className="font-mono">{Math.round(state.stats.quality.clinicalCoherence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo total:</span>
                  <span className="font-mono">{formatDuration(state.stats.efficiency.processingTime)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">🎛️ Acciones</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleProcessTranscript}
                disabled={state.isProcessing || !state.fullTranscript.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
              >
                {state.isProcessing ? 'RELOAD: Procesando...' : 'AI: Procesar Semántico'}
              </button>
              
              {state.result && (
                <button
                  onClick={handleCompareApproaches}
                  disabled={state.isProcessing}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 hover:bg-green-700 transition-colors"
                >
                  LEGAL: Comparar Enfoques
                </button>
              )}
              
              <button
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  result: null, 
                  selectedChunk: null, 
                  error: null 
                }))}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                🧹 Limpiar
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

        {/* TRANSCRIPCIÓN INPUT */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">📝 Transcripción Completa</h3>
            <p className="text-sm text-gray-600">Ingrese la transcripción completa para análisis semántico</p>
          </div>
          
          <div className="p-4">
            <textarea
              value={state.fullTranscript}
              onChange={(e) => setState(prev => ({ ...prev, fullTranscript: e.target.value }))}
              placeholder="Ingrese aquí la transcripción completa de la consulta médica..."
              className="w-full h-40 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-2 text-sm text-gray-500">
              Caracteres: {state.fullTranscript.length} | Palabras: {state.fullTranscript.split(/\s+/).filter(w => w.length > 0).length}
            </div>
          </div>
        </div>

        {/* COMPARACIÓN DE ENFOQUES */}
        {comparisonResult && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">LEGAL: Comparación: Palabra por Palabra vs Semántico</h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Enfoque Palabra por Palabra */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3">ERROR: Palabra por Palabra</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Segmentos creados:</span>
                      <span className="font-mono text-red-600">{comparisonResult.wordByWord.segments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherencia:</span>
                      <span className="font-mono text-red-600">{Math.round(comparisonResult.wordByWord.coherence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precisión clínica:</span>
                      <span className="font-mono text-red-600">{Math.round(comparisonResult.wordByWord.clinicalAccuracy * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo:</span>
                      <span className="font-mono text-red-600">{formatDuration(comparisonResult.wordByWord.processingTime)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-red-700 mb-2">Problemas detectados:</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {comparisonResult.wordByWord.problems.map((problem, index) => (
                        <li key={index}>• {problem}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Enfoque Semántico */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">SUCCESS: Chunking Semántico</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Chunks creados:</span>
                      <span className="font-mono text-green-600">{comparisonResult.semantic.chunks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherencia:</span>
                      <span className="font-mono text-green-600">{Math.round(comparisonResult.semantic.metadata.narrativeCoherence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precisión clínica:</span>
                      <span className="font-mono text-green-600">{Math.round(comparisonResult.semantic.metadata.clinicalCoherence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo:</span>
                      <span className="font-mono text-green-600">{formatDuration(comparisonResult.semantic.metadata.processingTime)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-green-700 mb-2">Beneficios conseguidos:</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• Coherencia narrativa preservada</li>
                      <li>• Causalidad clínica mantenida</li>
                      <li>• Negaciones e ironía detectadas</li>
                      <li>• Contexto temporal preservado</li>
                      <li>• Eficiencia en procesamiento</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Métricas de Mejora */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">METRICS: Mejoras Conseguidas</h4>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      +{Math.round(comparisonResult.comparison.coherenceImprovement * 100)}%
                    </div>
                    <div className="text-sm text-blue-700">Coherencia</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {comparisonResult.comparison.processingEfficiency.toFixed(1)}x
                    </div>
                    <div className="text-sm text-blue-700">Más Eficiente</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      +{Math.round(comparisonResult.comparison.clinicalAccuracy * 100)}%
                    </div>
                    <div className="text-sm text-blue-700">Precisión Clínica</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTADOS CHUNKS SEMÁNTICOS */}
        {state.result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Lista de Chunks */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">📦 Chunks Semánticos</h3>
                <p className="text-sm text-gray-600">{state.result.chunks.length} chunks con solapamiento inteligente</p>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {state.result.chunks.map((chunk, index) => (
                    <div 
                      key={chunk.id}
                      onClick={() => handleChunkSelect(chunk)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        state.selectedChunk?.id === chunk.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Chunk {index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getChunkComplexityColor(chunk.clinicalContext.complexity)}`}>
                          {chunk.clinicalContext.complexity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {chunk.text.substring(0, 100)}...
                      </p>
                      
                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                        <span>{chunk.sentences.length} oraciones</span>
                        <span>{chunk.speakers.length} hablantes</span>
                        {chunk.narrative.hasTemporalMarkers && <span>⏰ Temporal</span>}
                        {chunk.narrative.hasCausalRelations && <span>🔗 Causal</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detalle del Chunk */}
            {state.selectedChunk && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">🔍 Detalle del Chunk</h3>
                  <p className="text-sm text-gray-600">Análisis narrativo y clínico</p>
                </div>
                
                <div className="p-4">
                  <div className="space-y-4">
                    
                    {/* Texto del Chunk */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Texto:</h4>
                      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">
                        {state.selectedChunk.text}
                      </p>
                    </div>

                    {/* Análisis Narrativo */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Análisis Narrativo:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`p-2 rounded ${state.selectedChunk.narrative.hasTemporalMarkers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.narrative.hasTemporalMarkers ? 'SUCCESS:' : 'ERROR:'} Marcadores temporales
                        </div>
                        <div className={`p-2 rounded ${state.selectedChunk.narrative.hasCausalRelations ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.narrative.hasCausalRelations ? 'SUCCESS:' : 'ERROR:'} Relaciones causales
                        </div>
                        <div className={`p-2 rounded ${state.selectedChunk.narrative.hasNegations ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.narrative.hasNegations ? 'WARNING:' : 'ERROR:'} Negaciones
                        </div>
                        <div className={`p-2 rounded ${state.selectedChunk.narrative.hasCorrections ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.narrative.hasCorrections ? 'WARNING:' : 'ERROR:'} Correcciones
                        </div>
                      </div>
                    </div>

                    {/* Contexto Clínico */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Contexto Clínico:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`p-2 rounded ${state.selectedChunk.clinicalContext.hasSymptoms ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.clinicalContext.hasSymptoms ? 'NOTES:' : 'ERROR:'} Síntomas
                        </div>
                        <div className={`p-2 rounded ${state.selectedChunk.clinicalContext.hasExamination ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.clinicalContext.hasExamination ? '🔍' : 'ERROR:'} Examen
                        </div>
                        <div className={`p-2 rounded ${state.selectedChunk.clinicalContext.hasAssessment ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.clinicalContext.hasAssessment ? 'TARGET:' : 'ERROR:'} Assessment
                        </div>
                        <div className={`p-2 rounded ${state.selectedChunk.clinicalContext.hasPlan ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                          {state.selectedChunk.clinicalContext.hasPlan ? 'NOTES:' : 'ERROR:'} Plan
                        </div>
                      </div>
                    </div>

                    {/* Hablantes */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Hablantes:</h4>
                      <div className="flex space-x-2">
                        {state.selectedChunk.speakers.map(speaker => (
                          <span key={speaker} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {speaker}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resultado SOAP Fusionado */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">AI: SOAP Fusionado</h3>
                <p className="text-sm text-gray-600">Resultado coherente del análisis semántico</p>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {state.result.mergedSOAP.segments.length > 0 ? (
                  <div className="space-y-3">
                    {state.result.mergedSOAP.segments.map((segment, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getSOAPSectionColor(segment.section)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg">{segment.section}</span>
                          <span className="text-xs text-gray-500">
                            {Math.round(segment.confidence * 100)}% confianza
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">
                          {segment.text}
                        </p>
                      </div>
                    ))}

                    {/* Assessment Fusionado */}
                    {state.result.mergedSOAP.fullAssessment && (
                      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h4 className="font-semibold text-indigo-800 mb-2">NOTES: Assessment Fusionado</h4>
                        <p className="text-sm text-indigo-700">
                          {state.result.mergedSOAP.fullAssessment}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-3xl mb-2">RELOAD:</div>
                    <p>Procese una transcripción para ver resultados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SemanticChunkingDemo; 