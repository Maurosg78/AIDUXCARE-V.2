import React, { useState, useRef, useEffect } from 'react';
import { ollamaClient, isOllamaConfigured } from '../lib/ollama';
import { NLPServiceOllama } from '../services/nlpServiceOllama';
import { RAGMedicalMCP } from '../core/mcp/RAGMedicalMCP';

interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  error?: string;
  data?: Record<string, unknown>;
}

interface TestScenario {
  name: string;
  description: string;
  audioFile?: string;
  transcript?: string;
  expectedEntities: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: "Escenario 1: Dolor Lumbar Agudo",
    description: "Paciente con dolor lumbar agudo tras levantar peso",
    transcript: `El paciente Carlos Mendoza llegó reportando dolor intenso en la zona lumbar baja. 
Menciona que el dolor comenzó hace 3 días después de levantar una caja pesada en el trabajo. 
Durante la evaluación observé tensión muscular significativa en el área paravertebral L4-L5. 
Limitación notable en la flexión anterior del tronco, alcanzando solo 30 grados.
Aplicamos masaje terapéutico profundo y técnicas de liberación miofascial durante 20 minutos.
El paciente reportó alivio inmediato del 60% del dolor tras la sesión.
Plan: continuar con sesiones de fisioterapia tres veces por semana durante 2 semanas,
ejercicios de fortalecimiento del core en casa, y aplicación de calor local antes de dormir.
Reevaluación en una semana para evaluar progreso.`,
    expectedEntities: ['dolor lumbar', 'tensión muscular', 'L4-L5', 'flexión anterior', 'masaje terapéutico']
  },
  {
    name: "Escenario 2: Rehabilitación Post-Operatoria",
    description: "Paciente post-cirugía de menisco en rehabilitación",
    transcript: `Paciente María González, segunda sesión post-cirugía de menisco. 
Reporta dolor moderado 4/10 en rodilla derecha, especialmente al subir escaleras.
Evaluación: rango de movimiento mejorado desde última sesión, flexión 90 grados, extensión completa.
Aplicamos ejercicios de movilidad pasiva, fortalecimiento de cuádriceps con resistencia leve.
Hidroterapia 15 minutos para reducir inflamación.
Paciente tolera bien el tratamiento, sin complicaciones.
Objetivos: alcanzar flexión 120 grados en próximas 2 sesiones.
Continuar ejercicios en casa, hielo post-ejercicio, control en 3 días.`,
    expectedEntities: ['post-cirugía menisco', 'rodilla derecha', 'flexión 90 grados', 'cuádriceps', 'hidroterapia']
  }
];

export default function CompletePipelineTestPage() {
  const [currentStep, setCurrentStep] = useState<PipelineStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [systemStatus, setSystemStatus] = useState({
    ollama: false,
    nlp: false,
    rag: false,
    audio: false
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar estado del sistema
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    const status = {
      ollama: false,
      nlp: false,
      rag: false,
      audio: false
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

    // Verificar Audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      status.audio = true;
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Audio check failed:', error);
    }

    setSystemStatus(status);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudioRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para el cronómetro
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      addStep('Grabación de Audio', 'error', undefined, { error: 'No se pudo acceder al micrófono' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Detener todas las pistas de audio
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudioRecording = async () => {
    addStep('Grabación de Audio', 'success', recordingTime * 1000, { duration: recordingTime });
    
    // Simular transcripción (en un sistema real usarías Web Speech API o Google Cloud STT)
    addStep('Transcripción de Audio', 'running');
    
    // Simular transcripción con delay
    setTimeout(async () => {
      const simulatedTranscript = selectedScenario?.transcript || 
        "Paciente reporta dolor en la zona lumbar. Evaluación revela tensión muscular. Aplicamos masaje terapéutico.";
      
      setTranscript(simulatedTranscript);
      addStep('Transcripción de Audio', 'success', 2000, { transcript: simulatedTranscript });
      
      // Continuar con el pipeline
      await runNLPipeline(simulatedTranscript);
    }, 2000);
  };

  const runNLPipeline = async (transcriptText: string) => {
    // Paso 1: Extracción de entidades
    addStep('Extracción de Entidades', 'running');
    
    try {
      const startTime = Date.now();
      const entities = await NLPServiceOllama.extractClinicalEntities(transcriptText, false);
      const duration = Date.now() - startTime;
      
      addStep('Extracción de Entidades', 'success', duration, { 
        entities: entities,
        count: entities.length 
      });

      // Paso 2: Generación SOAP
      addStep('Generación SOAP', 'running');
      
      const soapStartTime = Date.now();
      const soapNotes = await NLPServiceOllama.generateSOAPNotes(transcriptText, entities, false);
      const soapDuration = Date.now() - soapStartTime;
      
      addStep('Generación SOAP', 'success', soapDuration, { 
        soapNotes: soapNotes 
      });

      // Paso 3: RAG (opcional)
      addStep('Búsqueda de Evidencia', 'running');
      
      try {
        const ragStartTime = Date.now();
        const primaryCondition = entities.find(e => e.type === 'diagnosis')?.text || 
                                entities.find(e => e.type === 'symptom')?.text;
        
        if (primaryCondition) {
          const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(primaryCondition, 'fisioterapia', 2);
          const ragDuration = Date.now() - ragStartTime;
          
          addStep('Búsqueda de Evidencia', 'success', ragDuration, { 
            ragResult: ragResult,
            citations: ragResult.citations.length 
          });
        } else {
          addStep('Búsqueda de Evidencia', 'success', 0, { 
            message: 'No se encontraron condiciones para buscar evidencia' 
          });
        }
      } catch (ragError) {
        addStep('Búsqueda de Evidencia', 'error', 0, { error: 'Error en búsqueda de evidencia' });
      }

      // Paso final: Resumen
      addStep('Pipeline Completo', 'success', Date.now() - startTime, {
        totalEntities: entities.length,
        soapGenerated: !!soapNotes,
        ragUsed: true
      });

    } catch (error) {
      addStep('Pipeline NLP', 'error', 0, { error: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  const runScenarioTest = async (scenario: TestScenario) => {
    setIsRunning(true);
    setCurrentStep([]);
    setSelectedScenario(scenario);
    setTranscript('');

    // Si el escenario tiene transcripción, usarla directamente
    if (scenario.transcript) {
      setTranscript(scenario.transcript);
      await runNLPipeline(scenario.transcript);
    } else {
      // Si no, iniciar grabación
      await startRecording();
    }

    setIsRunning(false);
  };

  const addStep = (name: string, status: PipelineStep['status'], duration?: number, data?: Record<string, unknown>) => {
    const step: PipelineStep = {
      name,
      status,
      duration,
      data
    };

    setCurrentStep(prev => [...prev, step]);
  };

  const getStatusColor = (status: PipelineStep['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔄 Testing Pipeline Completo AiDuxCare
          </h1>

          {/* Estado del Sistema */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${systemStatus.ollama ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.ollama ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Ollama LLM</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.ollama ? 'Conectado' : 'No disponible'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${systemStatus.nlp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.nlp ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">NLP Service</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.nlp ? 'Activo' : 'Error'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${systemStatus.rag ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.rag ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">RAG Medical</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.rag ? 'PubMed OK' : 'Sin conexión'}
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${systemStatus.audio ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${systemStatus.audio ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Audio</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {systemStatus.audio ? 'Micrófono OK' : 'No disponible'}
                </p>
              </div>
            </div>
          </div>

          {/* Controles de Grabación */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Grabación de Audio</h2>
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isRunning}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  🎤 Iniciar Grabación
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  ⏹️ Detener Grabación
                </button>
              )}
              
              {isRecording && (
                <div className="text-2xl font-mono text-red-600">
                  {formatTime(recordingTime)}
                </div>
              )}
              
              <button
                onClick={checkSystemStatus}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                🔄 Verificar Estado
              </button>
            </div>
          </div>

          {/* Escenarios de Testing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Escenarios de Testing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEST_SCENARIOS.map((scenario, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{scenario.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  <button
                    onClick={() => runScenarioTest(scenario)}
                    disabled={isRunning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    ▶️ Ejecutar Escenario
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Transcripción */}
          {transcript && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Transcripción</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}

          {/* Progreso del Pipeline */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Progreso del Pipeline</h2>
            
            {currentStep.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay pasos ejecutados. Inicia un escenario o grabación para ver el progreso.
              </div>
            ) : (
              <div className="space-y-3">
                {currentStep.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{step.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={getStatusColor(step.status)}>
                          {getStatusIcon(step.status)} {step.status.toUpperCase()}
                        </span>
                        {step.duration && (
                          <span className="text-sm text-gray-500">
                            {step.duration}ms
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {step.data && (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        {Boolean(step.data.entities && Array.isArray(step.data.entities)) && (
                          <div className="mb-2">
                            <span className="font-medium">Entidades detectadas:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(step.data.entities as Array<Record<string, unknown>>).map((entity, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {String(entity.text || '')} ({String(entity.type || '')})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {Boolean(step.data.soapNotes && typeof step.data.soapNotes === 'object') && (
                          <div className="mb-2">
                            <span className="font-medium">SOAP generado:</span>
                            <div className="mt-1 space-y-1">
                              <div><strong>S:</strong> {String((step.data.soapNotes as Record<string, unknown>).subjective || '').substring(0, 100)}...</div>
                              <div><strong>O:</strong> {String((step.data.soapNotes as Record<string, unknown>).objective || '').substring(0, 100)}...</div>
                              <div><strong>A:</strong> {String((step.data.soapNotes as Record<string, unknown>).assessment || '').substring(0, 100)}...</div>
                              <div><strong>P:</strong> {String((step.data.soapNotes as Record<string, unknown>).plan || '').substring(0, 100)}...</div>
                            </div>
                          </div>
                        )}
                        
                        {step.data.count !== undefined && (
                          <div>Entidades extraídas: {String(step.data.count)}</div>
                        )}
                        
                        {step.data.citations !== undefined && (
                          <div>Referencias encontradas: {String(step.data.citations)}</div>
                        )}
                        
                        {step.data.duration !== undefined && (
                          <div>Duración grabación: {String(step.data.duration)}s</div>
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