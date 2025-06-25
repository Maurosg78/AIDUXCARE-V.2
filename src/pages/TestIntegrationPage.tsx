import React, { useState } from 'react';
import DynamicSOAPEditor from '../components/clinical/DynamicSOAPEditor';
import SOAPIntegrationService from '../services/SOAPIntegrationService';
import RealWorldSOAPProcessor from '../services/RealWorldSOAPProcessor';

// Casos de prueba con transcripciones reales desordenadas
const REAL_WORLD_TEST_CASES = [
  {
    name: "Cervicalgia Post-Latigazo",
    rawTranscription: `Paciente refiere dolor cervical intenso desde hace 3 semanas tras accidente de tráfico. Me duele mucho al girar la cabeza hacia la derecha, sobre todo por las mañanas. No puedo dormir bien por el dolor. Al examinar, se evidencia contractura de musculatura cervical bilateral. Test de Spurling positivo a la derecha. Rango de movimiento cervical limitado 50% en rotación derecha. Compatible con síndrome post-latigazo cervical. Recomiendo terapia manual y ejercicios de movilización gradual.`,
    specialty: 'fisioterapia' as const,
    expectedEntities: ['cuello', 'dolor', 'contractura', 'spurling', 'terapia manual']
  },
  {
    name: "Lumbalgia Mecánica",
    rawTranscription: `Tengo dolor en la espalda baja desde hace 2 meses. Empezó después de levantar una caja pesada en el trabajo. El dolor es constante, me baja hasta la pierna izquierda. Por las mañanas me cuesta mucho levantarme. Al palpar hay contractura evidente de musculatura paravertebral L4-L5. Test de Lasègue negativo. Movilidad lumbar limitada en flexión. Cuadro compatible con lumbalgia mecánica con contractura muscular. Plan: terapia manual, ejercicios de fortalecimiento del core.`,
    specialty: 'fisioterapia' as const,
    expectedEntities: ['lumbar', 'dolor', 'contractura', 'lasègue', 'ejercicios']
  },
  {
    name: "Hombro Doloroso",
    rawTranscription: `Me duele el hombro derecho cuando levanto el brazo. Empezó hace 1 mes sin causa aparente. Por las noches es peor, no puedo dormir sobre ese lado. Al examinar, arco doloroso entre 60-120 grados de abducción. Test de Neer positivo. Limitación funcional evidente. Impresión diagnóstica: síndrome de impingement subacromial. Tratamiento: terapia manual y ejercicios de fortalecimiento del manguito rotador.`,
    specialty: 'fisioterapia' as const,
    expectedEntities: ['hombro', 'dolor', 'abducción', 'neer', 'manguito rotador']
  }
];

const TestIntegrationPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState(0);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRawTranscription, setShowRawTranscription] = useState(true);
  const [processingLog, setProcessingLog] = useState<any[]>([]);

  const handleCaseChange = (caseIndex: number) => {
    setSelectedCase(caseIndex);
    setProcessingResults(null);
    setProcessingLog([]);
  };

  const processRealWorldTranscription = async () => {
    setIsProcessing(true);
    setProcessingResults(null);
    setProcessingLog([]);
    
    try {
      const currentCase = REAL_WORLD_TEST_CASES[selectedCase];
      
      // Crear instancia del RealWorldSOAPProcessor
      const processor = new RealWorldSOAPProcessor({
        specialty: currentCase.specialty,
        confidenceThreshold: 0.7,
        enableAdvancedNER: true,
        generateAssessment: true
      });

      console.log('LAUNCH: Procesando transcripción:', currentCase.name);
      
      // Procesar transcripción
      const result = await processor.processTranscription(currentCase.rawTranscription);
      
      // Obtener log de procesamiento
      const log = processor.getProcessingLog();
      
      setProcessingResults(result);
      setProcessingLog(log);
      
      console.log('SUCCESS: Procesamiento completado:', result);
      
    } catch (error) {
      console.error('ERROR: Error en procesamiento:', error);
      setProcessingResults({ error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.8) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSpeakerIcon = (speaker: string) => {
    return speaker === 'PACIENTE' ? 'PERSON:‍🦽' : 'DOCTOR:';
  };

  const getSectionColor = (section: string) => {
    const colors = {
      'S': 'bg-blue-100 text-blue-800',
      'O': 'bg-green-100 text-green-800',
      'A': 'bg-yellow-100 text-yellow-800',
      'P': 'bg-purple-100 text-purple-800'
    };
    return colors[section as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const currentCase = REAL_WORLD_TEST_CASES[selectedCase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Test RealWorldSOAPProcessor - Pipeline Completo
          </h1>
          <p className="text-gray-600">
            Pruebas con transcripciones médicas reales desordenadas usando heurísticas semánticas inteligentes
          </p>
        </div>

        {/* Selector de Casos */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            NOTES: Casos de Prueba Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REAL_WORLD_TEST_CASES.map((testCase, index) => (
              <button
                key={index}
                onClick={() => handleCaseChange(index)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCase === index
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">{testCase.name}</div>
                <div className="text-sm opacity-75">
                  {testCase.rawTranscription.substring(0, 60)}...
                </div>
                <div className="text-xs mt-2 font-mono bg-gray-100 px-2 py-1 rounded">
                  {testCase.specialty}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Control de Procesamiento */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              RELOAD: Procesamiento en Tiempo Real
            </h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showRawTranscription}
                  onChange={(e) => setShowRawTranscription(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Mostrar transcripción original</span>
              </label>
              <button
                onClick={processRealWorldTranscription}
                disabled={isProcessing}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'RELOAD: Procesando...' : 'LAUNCH: Procesar Transcripción'}
              </button>
            </div>
          </div>

          {/* Transcripción Original */}
          {showRawTranscription && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                📝 Transcripción Original (Desordenada)
              </h3>
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">
                  {currentCase.rawTranscription}
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Especialidad:</strong> {currentCase.specialty} | 
                  <strong> Longitud:</strong> {currentCase.rawTranscription.length} caracteres |
                  <strong> Entidades esperadas:</strong> {currentCase.expectedEntities.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados del Procesamiento */}
        {processingResults && !processingResults.error && (
          <div className="space-y-6">
            {/* Métricas Generales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                STATS: Métricas de Procesamiento
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {processingResults.segments.length}
                  </div>
                  <div className="text-sm text-blue-800">Segmentos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(processingResults.speakerAccuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-800">Precisión Hablantes</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(processingResults.processingMetrics.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-yellow-800">Confianza Promedio</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {processingResults.processingMetrics.processingTimeMs}ms
                  </div>
                  <div className="text-sm text-purple-800">Tiempo Procesamiento</div>
                </div>
              </div>

              {/* Distribución SOAP */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  METRICS: Distribución SOAP
                </h3>
                <div className="flex gap-4">
                  {Object.entries(processingResults.processingMetrics.soapDistribution).map(([section, count]) => (
                    <div key={section} className={`px-3 py-1 rounded-full text-sm font-medium ${getSectionColor(section)}`}>
                      {section}: {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Segmentos Procesados */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🔍 Segmentos Procesados con Análisis Detallado
              </h2>
              <div className="space-y-4">
                {processingResults.segments.map((segment: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Header del Segmento */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSpeakerIcon(segment.speaker)}</span>
                        <span className="font-medium text-gray-700">{segment.speaker}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSectionColor(segment.section)}`}>
                          {segment.section}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(segment.confidence)}`}>
                          {(segment.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">Segmento #{index + 1}</span>
                    </div>

                    {/* Texto del Segmento */}
                    <div className="mb-3">
                      <p className="text-gray-800 italic">"{segment.text}"</p>
                    </div>

                    {/* Razonamiento */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">AI: Razonamiento:</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {segment.reasoning}
                      </p>
                    </div>

                    {/* Entidades Extraídas */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">TAG: Entidades Extraídas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(segment.entities).map(([category, entities]: [string, string[]]) => 
                          entities.length > 0 && (
                            <div key={category} className="bg-indigo-50 border border-indigo-200 rounded px-2 py-1">
                              <span className="text-xs font-medium text-indigo-800 capitalize">
                                {category}:
                              </span>
                              <span className="text-xs text-indigo-600 ml-1">
                                {entities.join(', ')}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Generado */}
            {processingResults.fullAssessment && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🏥 Assessment Clínico Generado
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 leading-relaxed">
                    {processingResults.fullAssessment}
                  </p>
                </div>
              </div>
            )}

            {/* Integración con DynamicSOAPEditor */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📝 Editor SOAP Dinámico - Resultado Final
              </h2>
              <DynamicSOAPEditor
                initialData={{
                  subjective: processingResults.segments.filter((s: any) => s.section === 'S').map((s: any) => s.text).join(' '),
                  objective: processingResults.segments.filter((s: any) => s.section === 'O').map((s: any) => s.text).join(' '),
                  assessment: processingResults.segments.filter((s: any) => s.section === 'A').map((s: any) => s.text).join(' ') || processingResults.fullAssessment,
                  plan: processingResults.segments.filter((s: any) => s.section === 'P').map((s: any) => s.text).join(' ')
                }}
                onSave={(data) => {
                  console.log('💾 Datos SOAP guardados:', data);
                  alert('SUCCESS: Datos SOAP guardados correctamente');
                }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {processingResults?.error && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">ERROR: Error en Procesamiento</h3>
              <p className="text-red-700">{processingResults.error}</p>
            </div>
          </div>
        )}

        {/* Log de Procesamiento */}
        {processingLog.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              NOTES: Log de Procesamiento (Auditoría)
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="font-mono text-sm space-y-1">
                {processingLog.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-gray-500 text-xs">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-blue-600 font-medium">{entry.step}:</span>
                    <span className="text-gray-700">
                      {JSON.stringify(entry.details, null, 0).substring(0, 100)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestIntegrationPage; 