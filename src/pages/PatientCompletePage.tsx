/**
 * 🏥 Patient Complete Page - AiDuxCare V.2
 * NUEVO DISEÑO UX - "CLARIDAD CLÍNICA"
 * Layout: Header Profesional + Header Paciente + Área de Trabajo Principal
 * Estados: REVIEW → ACTIVE → COMPLETED
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebSpeechSTTService } from '../services/WebSpeechSTTService';

// ========= TIPOS E INTERFACES =========

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
  allergies: string[];
  medications: CurrentMedication[];
  clinicalHistory: string;
}

interface CurrentMedication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  status: 'activo' | 'suspendido' | 'temporal';
  interactions: string[];
}

interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
  confidence: number;
  timestamp: string;
  isSelected: boolean;
}

type SessionState = 'review' | 'active' | 'manual_notes' | 'completed';

// Tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// ========= COMPONENTE PRINCIPAL =========

const PatientCompletePage: React.FC = () => {
  const navigate = useNavigate();

  // Estado principal de la sesión
  const [sessionState, setSessionState] = useState<SessionState>('review');

  // ========= DATOS DEL PACIENTE =========  
  const [patientData, setPatientData] = useState<PatientData>({
    id: "",
    name: "Seleccionar paciente",
    age: 0,
    gender: "",
    condition: "",
    lastVisit: "",
    riskLevel: "bajo",
    allergies: [],
    medications: [],
    clinicalHistory: ""
  });

  // ========= DETECCIÓN AUTOMÁTICA STT =========
  const [sttAvailable, setSTTAvailable] = useState<boolean | null>(null);
  const [sttTestCompleted, setSTTTestCompleted] = useState(false);

  // ========= ESTADO DE SESIÓN =========
  const [isListening, setIsListening] = useState(false);
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [soapContent, setSOAPContent] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [recognition, setRecognition] = useState<WebSpeechSTTService | null>(null);
  
  // ========= NUEVO: ESTADO PARA NOTAS LIBRES =========
  const [freeFormNotes, setFreeFormNotes] = useState<string>('');
  const [isProcessingWithAI, setIsProcessingWithAI] = useState(false);
  const [aiProcessingError, setAIProcessingError] = useState<string | null>(null);
  
  // ========= RETRY LOGIC STATE =========
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'failed'>('excellent');

  // Cargar datos del paciente al montar
  useEffect(() => {
    const loadPatientData = () => {
      try {
        const currentPatientData = localStorage.getItem('aiduxcare_current_patient');
        if (currentPatientData) {
          const patient = JSON.parse(currentPatientData);
          setPatientData({
            id: patient.id || "",
            name: patient.name || "Paciente sin nombre",
            age: patient.age || 0,
            gender: patient.gender || "",
            condition: patient.condition || "",
            lastVisit: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "",
            riskLevel: patient.riskLevel || "bajo",
            allergies: patient.allergies || [],
            medications: patient.medications || [],
            clinicalHistory: patient.clinicalHistory || ""
          });
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del paciente:', error);
      }
    };

    loadPatientData();
    performSTTConnectivityTest();
  }, []);

  // ========= TEST DE CONECTIVIDAD STT SILENCIOSO =========
  const performSTTConnectivityTest = useCallback(async () => {
    console.log('🔍 Iniciando test de conectividad STT silencioso...');
    
    try {
      if (!WebSpeechSTTService.isSupported()) {
        console.log('❌ Navegador no soporta Web Speech API');
        setSTTAvailable(false);
        setSTTTestCompleted(true);
        return;
      }

      if (!navigator.onLine) {
        console.log('❌ Sin conexión a internet');
        setSTTAvailable(false);
        setSTTTestCompleted(true);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://speech.googleapis.com', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Servicios de Google Speech accesibles');
      setSTTAvailable(true);
      
    } catch (error) {
      console.log('❌ Servicios de Google Speech no accesibles:', error);
      setSTTAvailable(false);
    } finally {
      setSTTTestCompleted(true);
      console.log('🏁 Test de conectividad STT completado');
    }
  }, []);

  // ========= FUNCIONES DE NAVEGACIÓN DE ESTADOS =========
  const handleStartRecording = async () => {
    console.log('🚀 Iniciando grabación con retry logic...');
    setSessionState('active');
    setSessionStartTime(new Date());
    setTranscription(''); 
    setHighlights([]);
    setRetryAttempts(0);
    setConnectionQuality('excellent');
    
    await attemptTranscriptionWithRetry();
  };

  // ========= RETRY LOGIC ROBUSTO =========
  const attemptTranscriptionWithRetry = async (attempt: number = 1): Promise<void> => {
    const maxRetries = 3;
    const retryDelays = [1000, 2000, 3000]; // Backoff progresivo
    
    console.log(`🎯 Intento ${attempt}/${maxRetries} de transcripción`);
    setRetryAttempts(attempt);
    
    if (attempt > 1) {
      setIsRetrying(true);
      setConnectionQuality(attempt === 2 ? 'good' : 'poor');
    }
    
    try {
      // Crear instancia del servicio con timeouts más agresivos
      const sttService = new WebSpeechSTTService({
        language: 'es',
        continuous: true,
        interimResults: true
      });

      console.log(`🎙️ Configurando transcripción (intento ${attempt})...`);

      // Promise con timeout personalizado
      const transcriptionPromise = sttService.startRealtimeTranscription({
        onResult: (segment) => {
          console.log('📝 Segmento recibido exitosamente:', segment);
          setConnectionQuality('excellent');
          setIsRetrying(false);
          
          // Actualizar transcripción
          setTranscription(prev => {
            const newText = prev + ' ' + segment.content.text;
            console.log('📝 Transcripción actualizada:', newText);
            return newText;
          });
          
          // Generar highlights
          if (segment.content.text.trim().length > 5) {
            const newHighlight: ClinicalHighlight = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: segment.content.text.trim(),
              category: 'síntoma',
              confidence: Math.round(segment.confidence.score * 100),
              timestamp: new Date().toISOString(),
              isSelected: false
            };
            
            console.log('✨ Nuevo highlight generado:', newHighlight);
            setHighlights(prev => [...prev, newHighlight]);
          }
        },
        onError: async (error) => {
          console.error(`❌ Error en intento ${attempt}:`, error);
          
          // Si no es el último intento, hacer retry
          if (attempt < maxRetries) {
            console.log(`⏳ Reintentando en ${retryDelays[attempt - 1]}ms...`);
            setTimeout(() => {
              attemptTranscriptionWithRetry(attempt + 1);
            }, retryDelays[attempt - 1]);
          } else {
            // Último intento fallido - mostrar fallback elegante
            console.log('💔 Todos los intentos fallaron, activando modo manual');
            setConnectionQuality('failed');
            setIsRetrying(false);
            showGracefulFallback();
          }
        },
        onStart: () => {
          console.log(`✅ Transcripción iniciada exitosamente (intento ${attempt})`);
          setIsListening(true);
          setIsRetrying(false);
          setConnectionQuality('excellent');
        },
        onEnd: () => {
          console.log('🔴 Transcripción finalizada');
          setIsListening(false);
          setIsRetrying(false);
        }
      });

      // Timeout wrapper - 10 segundos para establecer conexión
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: No se pudo establecer conexión en 10 segundos'));
        }, 10000);
      });

      await Promise.race([transcriptionPromise, timeoutPromise]);
      
      // Guardar referencia al servicio
      setRecognition(sttService);
      console.log(`🎯 Servicio configurado exitosamente en intento ${attempt}`);
      
    } catch (error) {
      console.error(`💥 Error en intento ${attempt}:`, error);
      
      // Si no es el último intento, hacer retry
      if (attempt < maxRetries) {
        console.log(`⏳ Reintentando en ${retryDelays[attempt - 1]}ms...`);
        setTimeout(() => {
          attemptTranscriptionWithRetry(attempt + 1);
        }, retryDelays[attempt - 1]);
      } else {
        // Último intento fallido
        console.log('💔 Todos los intentos fallaron, activando modo manual');
        setConnectionQuality('failed');
        setIsRetrying(false);
        showGracefulFallback();
      }
    }
  };

  // ========= FALLBACK ELEGANTE =========
  const showGracefulFallback = () => {
    setSessionState('completed');
    setSOAPContent(`MODO MANUAL ACTIVADO

SUBJETIVO:
[Completar manualmente - La transcripción automática no está disponible]

OBJETIVO:
[Completar manualmente - Realizar evaluación física]

EVALUACIÓN:
[Completar manualmente - Análisis clínico]

PLAN:
[Completar manualmente - Plan de tratamiento]

---
Nota: La transcripción automática presentó problemas de conectividad.
Sesión iniciada en modo manual para garantizar la continuidad del servicio.
Tiempo de sesión: ${sessionStartTime ? new Date().getTime() - sessionStartTime.getTime() : 0}ms
`);
    
    // Mostrar notificación user-friendly
    setTimeout(() => {
      alert('💡 Transcripción automática no disponible.\n\nSe ha activado el modo manual para que puedas continuar documentando la consulta.\n\nTus datos están seguros y el flujo continúa normalmente.');
    }, 1000);
  };

  // ========= NUEVA FUNCIÓN: MODO MANUAL CON NOTAS LIBRES =========
  const handleManualDocumentation = () => {
    setSessionState('manual_notes'); // Nuevo estado intermedio
    setSessionStartTime(new Date());
    setFreeFormNotes('');
    setAIProcessingError(null);
  };

  // ========= PIPELINE DE IA PARA PROCESAMIENTO DE TEXTO =========
  const processNotesWithAI = async () => {
    if (!freeFormNotes.trim()) {
      setAIProcessingError('Por favor, ingresa algunas notas antes de procesar.');
      return;
    }

    setIsProcessingWithAI(true);
    setAIProcessingError(null);
    
    try {
      console.log('🤖 Iniciando procesamiento de IA con Llama 3.2...');
      
      // Importar dinámicamente el servicio de procesamiento
      const { textProcessingService } = await import('../services/TextProcessingService');
      
      // Verificar salud de Ollama antes de procesar
      const isOllamaHealthy = await textProcessingService.checkOllamaHealth();
      if (!isOllamaHealthy) {
        throw new Error('Ollama no está disponible. Verifica que esté ejecutándose en localhost:11434');
      }
      
      // Procesar texto con IA real
      const result = await textProcessingService.processTextToSOAP(freeFormNotes);
      
      // Formatear SOAP para el editor
      const formattedSOAP = `SUBJETIVO:
${result.soapStructure.subjetivo}

OBJETIVO:
${result.soapStructure.objetivo}

EVALUACIÓN:
${result.soapStructure.evaluacion}

PLAN:
${result.soapStructure.plan}

---
Notas originales:
${freeFormNotes}

✨ Procesado por IA en ${result.processingTime}ms - ${new Date().toLocaleString()}`;

      // Actualizar estado con resultados reales
      setSOAPContent(formattedSOAP);
      setHighlights(result.highlights);
      setSessionState('completed');
      
      // Mostrar advertencias si las hay
      if (result.warnings.length > 0) {
        console.warn('⚠️ Advertencias clínicas detectadas:', result.warnings);
      }
      
      console.log(`✅ Procesamiento de IA completado en ${result.processingTime}ms`);
      
    } catch (error) {
      console.error('❌ Error en procesamiento de IA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Fallback a simulación si falla la IA real
      console.log('🔄 Fallback a simulación de IA...');
      try {
        const aiResponse = await simulateAIProcessing(freeFormNotes);
        setHighlights(aiResponse.highlights);
        setSOAPContent(aiResponse.soapContent);
        setSessionState('completed');
        setAIProcessingError(`IA no disponible. Usando análisis local: ${errorMessage}`);
      } catch (fallbackError) {
        setAIProcessingError(`Error crítico: ${errorMessage}`);
      }
    } finally {
      setIsProcessingWithAI(false);
    }
  };

  // ========= SIMULACIÓN DE SERVICIO DE IA (TEMPORAL) =========
  const simulateAIProcessing = async (notes: string): Promise<{
    highlights: ClinicalHighlight[];
    soapContent: string;
  }> => {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Análisis básico del texto para generar highlights
    const highlights: ClinicalHighlight[] = [];
    const words = notes.toLowerCase();
    
    // Detección de síntomas
    const symptoms = ['dolor', 'molestia', 'hinchazón', 'rigidez', 'fatiga', 'mareo'];
    symptoms.forEach(symptom => {
      if (words.includes(symptom)) {
        highlights.push({
          id: `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: `Paciente reporta ${symptom}`,
          category: 'síntoma',
          confidence: 85,
          timestamp: new Date().toISOString(),
          isSelected: false
        });
      }
    });
    
    // Detección de hallazgos
    const findings = ['inflamación', 'edema', 'contractura', 'limitación', 'debilidad'];
    findings.forEach(finding => {
      if (words.includes(finding)) {
        highlights.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: `Se observa ${finding}`,
          category: 'hallazgo',
          confidence: 80,
          timestamp: new Date().toISOString(),
          isSelected: false
        });
      }
    });
    
    // Generar SOAP estructurado
    const soapContent = `SUBJETIVO:
${extractSubjective(notes)}

OBJETIVO:
${extractObjective(notes)}

EVALUACIÓN:
${extractAssessment(notes)}

PLAN:
${extractPlan(notes)}

---
Notas originales procesadas por IA:
${notes}

✨ Procesado automáticamente el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
`;
    
    return { highlights, soapContent };
  };

  // ========= FUNCIONES AUXILIARES PARA EXTRACCIÓN SOAP =========
  const extractSubjective = (notes: string): string => {
    const subjectiveKeywords = ['dice', 'reporta', 'siente', 'refiere', 'comenta'];
    const sentences = notes.split(/[.!?]+/);
    const subjectiveSentences = sentences.filter(sentence => 
      subjectiveKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    return subjectiveSentences.length > 0 
      ? subjectiveSentences.join('.\n') + '.'
      : 'Información subjetiva extraída de las notas libres.';
  };

  const extractObjective = (notes: string): string => {
    const objectiveKeywords = ['observo', 'se ve', 'presenta', 'muestra', 'tiene'];
    const sentences = notes.split(/[.!?]+/);
    const objectiveSentences = sentences.filter(sentence => 
      objectiveKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    return objectiveSentences.length > 0 
      ? objectiveSentences.join('.\n') + '.'
      : 'Hallazgos objetivos basados en la evaluación.';
  };

  const extractAssessment = (notes: string): string => {
    return 'Evaluación clínica basada en la información recopilada.';
  };

  const extractPlan = (notes: string): string => {
    const planKeywords = ['plan', 'tratamiento', 'ejercicio', 'terapia', 'recomendación'];
    const sentences = notes.split(/[.!?]+/);
    const planSentences = sentences.filter(sentence => 
      planKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    return planSentences.length > 0 
      ? planSentences.join('.\n') + '.'
      : 'Plan de tratamiento a definir según evolución.';
  };

  const handleFinishSession = async () => {
    // Detener transcripción si está activa
    if (recognition) {
      try {
        await recognition.stopTranscription();
        console.log('🔴 Transcripción detenida');
      } catch (error) {
        console.error('Error deteniendo transcripción:', error);
      }
    }
    
    setSessionState('completed');
    setIsListening(false);
    
    // Generar SOAP automático desde highlights
    const soapFromHighlights = generateSOAPFromHighlights();
    setSOAPContent(soapFromHighlights);
  };

  // Función para generar SOAP desde highlights
  const generateSOAPFromHighlights = (): string => {
    const symptoms = highlights.filter(h => h.category === 'síntoma');
    const findings = highlights.filter(h => h.category === 'hallazgo');
    const plans = highlights.filter(h => h.category === 'plan');
    const warnings = highlights.filter(h => h.category === 'advertencia');

    return `SUBJETIVO:
${symptoms.map(s => `• ${s.text}`).join('\n') || 'Sin síntomas destacados registrados'}

OBJETIVO:
${findings.map(f => `• ${f.text}`).join('\n') || 'Sin hallazgos físicos destacados'}

EVALUACIÓN:
${warnings.map(w => `• ${w.text}`).join('\n') || 'Evaluación pendiente de completar'}

PLAN:
${plans.map(p => `• ${p.text}`).join('\n') || 'Plan de tratamiento pendiente de definir'}

---
Transcripción completa:
${transcription}
`;
  };

  const handleNewConsultation = () => {
    setSessionState('review');
    setHighlights([]);
    setTranscription('');
    setSOAPContent('');
    setSessionStartTime(null);
    
    // Limpiar estado de notas libres
    setFreeFormNotes('');
    setIsProcessingWithAI(false);
    setAIProcessingError(null);
  };

  // ========= LOADING STATE =========
  if (!patientData || !sttTestCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========= HEADER PROFESIONAL UNIFICADO ========= */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo + Título */}
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" 
                style={{ background: 'linear-gradient(135deg, #2C3E50, #5DA5A3)' }}
              >
                <span className="text-white font-bold text-xl">A</span>
              </div>
              
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Consulta Completa</h1>
                <p className="text-sm text-gray-600">AiDuxCare V.2</p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-3">
              {!sttTestCompleted && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Verificando STT...</span>
                </div>
              )}
              
              {sttTestCompleted && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${sttAvailable ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {sttAvailable ? 'Transcripción Automática' : 'Modo Manual'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========= HEADER PACIENTE DESTACADO ========= */}
      <div 
        className="border-b-2 border-opacity-30"
        style={{ 
          background: 'linear-gradient(135deg, #F9FAFB, #FFFFFF)',
          borderBottomColor: '#A8E6CF'
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>
                  {patientData.name}
                </h1>
                <div className="flex items-center space-x-4 text-xl text-gray-600 mb-1">
                  <span>{patientData.age} años</span>
                  {patientData.condition && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{patientData.condition}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-base text-gray-500">
                  {patientData.lastVisit && (
                    <span>Última visita: {patientData.lastVisit}</span>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patientData.riskLevel === 'alto' ? 'bg-red-100 text-red-800' :
                    patientData.riskLevel === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Riesgo: {patientData.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========= ÁREA DE TRABAJO PRINCIPAL ========= */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        
        {/* ESTADO: REVIEW */}
        {sessionState === 'review' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 transition-all duration-300">
            
            {/* Historia Clínica Previa */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-6" style={{ color: '#2C3E50' }}>
                📋 Historia Clínica
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Medicaciones */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-900">Medicaciones Actuales</h3>
                  {patientData.medications && patientData.medications.length > 0 ? (
                    <ul className="space-y-2">
                      {patientData.medications.map((med, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          <span className="font-medium">{med.name}</span> - {med.dosage}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No hay medicaciones registradas</p>
                  )}
                </div>

                {/* Alergias */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-900">Alergias Conocidas</h3>
                  {patientData.allergies && patientData.allergies.length > 0 ? (
                    <ul className="space-y-2">
                      {patientData.allergies.map((allergy, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {allergy}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No hay alergias registradas</p>
                  )}
                </div>
              </div>

              {/* Historia Clínica */}
              {patientData.clinicalHistory && (
                <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                  <h3 className="text-lg font-medium mb-3 text-blue-900">Notas de Sesiones Anteriores</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{patientData.clinicalHistory}</p>
                </div>
              )}
            </div>

            {/* Botones de Acción - MODO MANUAL PRIORITARIO */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
              {/* MODO MANUAL - BOTÓN PRINCIPAL */}
              <button
                onClick={handleManualDocumentation}
                className="flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border-2"
                style={{ 
                  backgroundColor: '#5DA5A3', 
                  color: 'white',
                  borderColor: '#2C3E50'
                }}
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                ✍️ INICIAR DOCUMENTACIÓN
              </button>

              {/* IA GRABACIÓN - SOLO SI STT DISPONIBLE */}
              {sttAvailable && (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                  🧪 PROBAR IA (BETA)
                </button>
              )}
            </div>

            {/* MENSAJE INFORMATIVO */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm text-blue-700 font-medium">
                  💡 Modo Manual: Máxima privacidad y control profesional. Costo operativo $0.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============ NUEVO ESTADO: MANUAL_NOTES ============ */}
        {sessionState === 'manual_notes' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#2C3E50' }}>
              ✍️ Notas Libres de la Sesión
            </h2>
            
            {/* Textarea Principal para Notas Libres */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escribe libremente tus observaciones, conversación con el paciente, hallazgos y plan:
                </label>
                <textarea
                  value={freeFormNotes}
                  onChange={(e) => setFreeFormNotes(e.target.value)}
                  placeholder="Ej: La paciente refiere dolor lumbar que inició hace 3 días tras levantar una caja pesada. Se observa contractura muscular en paravertebrales. Limitación para flexión de tronco. Plan: ejercicios de estiramiento y aplicación de calor local..."
                  className="w-full h-80 p-4 border border-gray-300 rounded-xl text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                  style={{ 
                    outlineColor: '#5DA5A3',
                    borderColor: freeFormNotes.length > 0 ? '#5DA5A3' : '#D1D5DB'
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {freeFormNotes.length} caracteres
                  </span>
                  <span className="text-xs text-gray-400">
                    💡 Tip: Escribe de forma natural, nuestra IA se encargará de organizarlo
                  </span>
                </div>
              </div>

              {/* Error de IA */}
              {aiProcessingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-sm text-red-700 font-medium">{aiProcessingError}</span>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                
                {/* Botón Principal: Procesar con IA */}
                <button
                  onClick={processNotesWithAI}
                  disabled={isProcessingWithAI || !freeFormNotes.trim()}
                  className="flex items-center justify-center px-8 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ backgroundColor: '#FF6F61' }}
                >
                  {isProcessingWithAI ? (
                    <>
                      <div className="w-6 h-6 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      PROCESANDO CON IA...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                      ✨ ORGANIZAR Y ANALIZAR CON IA
                    </>
                  )}
                </button>

                {/* Botón Secundario: Continuar Manualmente */}
                <button
                  onClick={() => {
                    setSessionState('completed');
                    setSOAPContent(`SUBJETIVO:\n${freeFormNotes}\n\nOBJETIVO:\n\n\nEVALUACIÓN:\n\n\nPLAN:\n\n`);
                  }}
                  className="flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                  📝 CONTINUAR MANUALMENTE
                </button>
              </div>

              {/* Información Educativa */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">SOAP Asistido por IA</h3>
                    <p className="text-sm text-blue-800 leading-relaxed mb-3">
                      Escribe de forma natural y nuestra IA inteligente se encargará de:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 🔍 <strong>Identificar</strong> síntomas y hallazgos automáticamente</li>
                      <li>• 📋 <strong>Estructurar</strong> la información en formato SOAP profesional</li>
                      <li>• ⚠️ <strong>Generar</strong> alertas y recomendaciones clínicas</li>
                      <li>• 💰 <strong>Mantener</strong> costo operativo $0 procesando localmente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ESTADO: ACTIVE */}
        {sessionState === 'active' && (
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Transcripción en Vivo */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: '#2C3E50' }}>
                  🎙️ Transcripción en Vivo
                </h2>
                <div className="flex items-center space-x-2">
                  {/* Indicador de estado de conexión inteligente */}
                  {isRetrying ? (
                    <>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-yellow-600">
                        Reintentando ({retryAttempts}/3)...
                      </span>
                    </>
                  ) : connectionQuality === 'failed' ? (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-600">Sin conexión</span>
                    </>
                  ) : connectionQuality === 'poor' ? (
                    <>
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-orange-600">Conexión débil</span>
                    </>
                  ) : connectionQuality === 'good' ? (
                    <>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-600">Reconectando...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">Transcribiendo</span>
                    </>
                  )}
                </div>
              </div>
              
              <div 
                className="bg-gray-50 rounded-xl p-4 min-h-64 border-l-4 font-mono text-sm leading-relaxed"
                style={{ borderLeftColor: '#5DA5A3' }}
              >
                {transcription || "Esperando transcripción de audio..."}
              </div>

              <button
                onClick={handleFinishSession}
                className="mt-4 w-full px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#FF6F61' }}
              >
                🔴 FINALIZAR SESIÓN
              </button>
            </div>

            {/* Highlights Automáticos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#2C3E50' }}>
                ✨ Highlights
              </h2>
              
              <div className="space-y-3">
                {highlights.length > 0 ? (
                  highlights.map((highlight) => (
                    <div 
                      key={highlight.id}
                      className={`p-3 rounded-lg border-l-4 text-sm transition-all duration-200 ${
                        highlight.category === 'síntoma' ? 'bg-red-50 border-red-500' :
                        highlight.category === 'hallazgo' ? 'bg-blue-50 border-blue-500' :
                        highlight.category === 'plan' ? 'bg-green-50 border-green-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{highlight.category}</span>
                        <span className="text-xs text-gray-500">{highlight.confidence}%</span>
                      </div>
                      <p className="text-gray-700">{highlight.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Los highlights aparecerán aquí automáticamente
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ESTADO: COMPLETED */}
        {sessionState === 'completed' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#2C3E50' }}>
              📋 Documentación SOAP
            </h2>
            
            <div className="space-y-6">
              <textarea
                value={soapContent}
                onChange={(e) => setSOAPContent(e.target.value)}
                placeholder="Documentación clínica completa..."
                className="w-full h-96 p-4 border border-gray-300 rounded-xl font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                 style={{ outlineColor: '#5DA5A3' }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                className="px-6 py-3 font-semibold text-white rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#5DA5A3' }}
              >
                💾 GUARDAR
              </button>
              
              <button
                className="px-6 py-3 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg border-2"
                style={{ 
                  backgroundColor: '#A8E6CF', 
                  color: '#2C3E50',
                  borderColor: '#5DA5A3'
                }}
              >
                📄 EXPORTAR PDF
              </button>
              
              <button
                onClick={handleNewConsultation}
                className="px-6 py-3 font-semibold text-gray-700 border border-gray-300 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-gray-50"
              >
                🏠 NUEVA CONSULTA
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PatientCompletePage; 