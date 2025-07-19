import React, { useState, useEffect } from 'react';
import { ollamaClient, isOllamaConfigured } from '../lib/ollama';
import { NLPServiceOllama } from '../services/nlpServiceOllama';
import { RAGMedicalMCP } from '../core/mcp/RAGMedicalMCP';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface TestCase {
  name: string;
  transcript: string;
  expectedEntities: string[];
  expectedSOAPSections: string[];
}

const TEST_CASES: TestCase[] = [
  {
    name: "Caso 1: Dolor Lumbar Agudo",
    transcript: `El paciente Carlos Mendoza llegó reportando dolor intenso en la zona lumbar baja. 
Menciona que el dolor comenzó hace 3 días después de levantar una caja pesada en el trabajo. 
Durante la evaluación observé tensión muscular significativa en el área paravertebral L4-L5. 
Limitación notable en la flexión anterior del tronco, alcanzando solo 30 grados.
Aplicamos masaje terapéutico profundo y técnicas de liberación miofascial durante 20 minutos.
El paciente reportó alivio inmediato del 60% del dolor tras la sesión.
Plan: continuar con sesiones de fisioterapia tres veces por semana durante 2 semanas,
ejercicios de fortalecimiento del core en casa, y aplicación de calor local antes de dormir.
Reevaluación en una semana para evaluar progreso.`,
    expectedEntities: ['dolor lumbar', 'tensión muscular', 'L4-L5', 'flexión anterior', 'masaje terapéutico'],
    expectedSOAPSections: ['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN']
  },
  {
    name: "Caso 2: Rehabilitación Post-Operatoria Rodilla",
    transcript: `Paciente María González, segunda sesión post-cirugía de menisco. 
Reporta dolor moderado 4/10 en rodilla derecha, especialmente al subir escaleras.
Evaluación: rango de movimiento mejorado desde última sesión, flexión 90 grados, extensión completa.
Aplicamos ejercicios de movilidad pasiva, fortalecimiento de cuádriceps con resistencia leve.
Hidroterapia 15 minutos para reducir inflamación.
Paciente tolera bien el tratamiento, sin complicaciones.
Objetivos: alcanzar flexión 120 grados en próximas 2 sesiones.
Continuar ejercicios en casa, hielo post-ejercicio, control en 3 días.`,
    expectedEntities: ['post-cirugía menisco', 'rodilla derecha', 'flexión 90 grados', 'cuádriceps', 'hidroterapia'],
    expectedSOAPSections: ['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN']
  },
  {
    name: "Caso 3: Cervicalgia Crónica",
    transcript: `Paciente Ana López, 45 años, consulta por dolor cervical crónico de 6 meses.
Refiere dolor 6/10 en región cervical posterior, irradiado a hombro derecho.
Exploración: limitación rotación derecha 30%, tensión trapecio superior bilateral.
Aplicamos técnicas de liberación miofascial y ejercicios de movilidad cervical.
Educación postural y ergonomía en el trabajo.
Plan: sesiones 2x semana, ejercicios domiciliarios diarios, control en 2 semanas.`,
    expectedEntities: ['dolor cervical crónico', 'trapecio superior', 'rotación cervical', 'liberación miofascial'],
    expectedSOAPSections: ['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN']
  }
];

export default function BackendTestingPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    ollama: false,
    nlp: false,
    rag: false
  });

  // Verificar estado del sistema
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    const status = {
      ollama: false,
      nlp: false,
      rag: false
    };

    // Verificar Ollama
    try {
      if (isOllamaConfigured()) {
        const health = await ollamaClient.healthCheck();
        status.ollama = health.status === 'healthy';
      }
    } catch (error) {
      console.error('Ollama health check failed:', error);
    }

    // Verificar NLP Service
    try {
      const testResponse = await NLPServiceOllama.extractClinicalEntities('test', false);
      status.nlp = testResponse.length >= 0;
    } catch (error) {
      console.error('NLP service check failed:', error);
    }

    // Verificar RAG
    try {
      const ragTest = await RAGMedicalMCP.retrieveRelevantKnowledge('test', 'fisioterapia', 1);
      status.rag = ragTest.citations.length >= 0;
    } catch (error) {
      console.error('RAG check failed:', error);
    }

    setSystemStatus(status);
  };

  const runSingleTest = async (testCase: TestCase): Promise<TestResult> => {
    const result: TestResult = {
      name: testCase.name,
      status: 'running'
    };

    const startTime = Date.now();

    try {
      // Test 1: Extracción de entidades
      const entities = await NLPServiceOllama.extractClinicalEntities(testCase.transcript, false);
      
      // Test 2: Generación SOAP
      const soapNotes = await NLPServiceOllama.generateSOAPNotes(testCase.transcript, entities, false);
      
      // Test 3: RAG (opcional)
      let ragResult = null;
      try {
        const primaryCondition = entities.find(e => e.type === 'diagnosis')?.text || 
                                entities.find(e => e.type === 'symptom')?.text;
        if (primaryCondition) {
          ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(primaryCondition, 'fisioterapia', 2);
        }
      } catch (ragError) {
        console.warn('RAG test failed, continuing without it');
      }

      const duration = Date.now() - startTime;

      // Validar resultados
      const entityValidation = entities.length > 0;
      const soapValidation = soapNotes && 
                            testCase.expectedSOAPSections.every(section => 
                              soapNotes[section.toLowerCase() as keyof typeof soapNotes]
                            );

      result.status = entityValidation && soapValidation ? 'success' : 'error';
      result.duration = duration;
      result.details = {
        entities: entities,
        soapNotes: soapNotes,
        ragResult: ragResult,
        entityCount: entities.length,
        soapComplete: soapValidation,
        ragUsed: !!ragResult
      };

      if (!entityValidation) {
        result.error = 'No se extrajeron entidades clínicas';
      } else if (!soapValidation) {
        result.error = 'SOAP incompleto o mal formateado';
      }

    } catch (error) {
      result.status = 'error';
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Error desconocido';
    }

    return result;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: TestResult[] = [];

    for (const testCase of TEST_CASES) {
      const result = await runSingleTest(testCase);
      results.push(result);
      setTestResults([...results]);
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  const runSelectedTest = async () => {
    if (!selectedTestCase) return;

    setIsRunning(true);
    const result = await runSingleTest(selectedTestCase);
    setTestResults([result]);
    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Testing Backend AiDuxCare
          </h1>

          {/* Estado del Sistema */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${systemStatus.ollama ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.ollama ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Ollama LLM</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.ollama ? 'Conectado y funcionando' : 'No disponible'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${systemStatus.nlp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.nlp ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">NLP Service</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.nlp ? 'Procesamiento activo' : 'Error de conexión'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${systemStatus.rag ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.rag ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">RAG Medical</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.rag ? 'PubMed conectado' : 'Sin conexión'}
                </p>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Controles de Testing</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunning ? '🔄 Ejecutando...' : '🚀 Ejecutar Todos los Tests'}
              </button>
              
              <button
                onClick={checkSystemStatus}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                🔄 Verificar Estado
              </button>
            </div>
          </div>

          {/* Selección de Test Individual */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Individual</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              {TEST_CASES.map((testCase, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTestCase(testCase)}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedTestCase?.name === testCase.name
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {testCase.name}
                </button>
              ))}
            </div>
            
            {selectedTestCase && (
              <div className="mb-4">
                <button
                  onClick={runSelectedTest}
                  disabled={isRunning}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isRunning ? '🔄 Ejecutando...' : '▶️ Ejecutar Test Seleccionado'}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Resultados de Testing</h2>
            
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay resultados de testing. Ejecuta algún test para ver los resultados.
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{result.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={getStatusColor(result.status)}>
                          {getStatusIcon(result.status)} {result.status.toUpperCase()}
                        </span>
                        {result.duration && (
                          <span className="text-sm text-gray-500">
                            {result.duration}ms
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="text-red-600 text-sm mb-2">
                        Error: {result.error}
                      </div>
                    )}
                    
                    {result.details && (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="font-medium">Entidades:</span> {String(result.details.entityCount || 0)}
                          </div>
                          <div>
                            <span className="font-medium">SOAP:</span> {result.details.soapComplete ? '✅' : '❌'}
                          </div>
                          <div>
                            <span className="font-medium">RAG:</span> {result.details.ragUsed ? '✅' : '❌'}
                          </div>
                          <div>
                            <span className="font-medium">Tiempo:</span> {result.duration}ms
                          </div>
                        </div>
                        
                        {Boolean(result.details.entities && Array.isArray(result.details.entities) && result.details.entities.length > 0) && (
                          <div className="mt-3">
                            <span className="font-medium">Entidades detectadas:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(result.details.entities as Array<Record<string, unknown>>).map((entity, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {String(entity.text || '')} ({String(entity.type || '')})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 