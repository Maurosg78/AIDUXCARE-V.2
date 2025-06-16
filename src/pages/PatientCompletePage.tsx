/**
 * 🏥 PATIENT COMPLETE PAGE - IDENTIDAD VISUAL OFICIAL AIDUXCARE
 * Página principal del workflow con identidad oficial y asistente bajo demanda
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

// === IMPORTACIONES DEL ASISTENTE CLÍNICO ===
import ClinicalAssistantPanel from '../components/clinical/ClinicalAssistantPanel';
import DynamicSOAPEditor from '../components/clinical/DynamicSOAPEditor';
import { 
  clinicalAssistantService,
  ClinicalAnalysisResult,
  ClinicalSuggestion,
  Patient as ClinicalPatient,
  ClinicalEntity as ClinicalEntityType
} from '../services/ClinicalAssistantService';

// === NUEVAS INTERFACES PARA PREGUNTAS INTELIGENTES ===
interface SmartQuestion {
  id: string;
  text: string;
  category: 'followup' | 'clarification' | 'assessment' | 'treatment';
  priority: 'high' | 'medium' | 'low';
  triggeredBy: string; // Qué parte de la transcripción la activó
  confidence: number;
  isFromPreparation?: boolean;
  timestamp: Date;
}

interface QuestionSuggestionEngine {
  isActive: boolean;
  currentSuggestions: SmartQuestion[];
  usedQuestions: string[];
  preparationQuestions: string[];
  contextAnalysis: {
    lastAnalyzedSegment: string;
    detectedTopics: string[];
    missingInformation: string[];
  };
}

// Tipos simplificados para evitar dependencias problemáticas
interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  allergies: string[];
  medications: string[];
  clinicalHistory: string;
  derivadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

// === INTERFACES ACTUALIZADAS ===
interface SpeakerInfo {
  speakerTag: number;
  role: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  confidence: number;
  timeOffset: number;
}

interface EnhancedTranscriptionSegment {
  id: string;
  content: string;
  confidence: number;
  startTime: number;
  endTime: number;
  speaker: SpeakerInfo;
  timestamp: string;
  words?: WordInfo[];
}

interface WordInfo {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

interface ClinicalEntity {
  id: string;
  text: string;
  type: string;
  confidence: number;
}

interface SOAPStructure {
  subjetivo: string;
  objetivo: string;
  evaluacion: string;
  plan: string;
}

// === TIPOS PARA WORKPLACE UNIFICADO ===
type WorkplaceStatus = 'READY' | 'ACTIVE' | 'PROCESSING' | 'COMPLETED';

interface UnifiedSession {
  status: WorkplaceStatus;
  startTime?: Date;
  duration: number;
  transcription: EnhancedTranscriptionSegment[];
  entities: ClinicalEntity[];
  soapNote?: SOAPStructure;
  speakerAnalysis?: {
    totalSpeakers: number;
    speakerDistribution: Record<string, number>;
    diarizationConfidence: number;
  };
  // === NUEVOS CAMPOS PARA ASISTENTE CLÍNICO ===
  clinicalAnalysis?: ClinicalAnalysisResult;
  acceptedSuggestions: ClinicalSuggestion[];
  completedTests: { [templateId: string]: { [testId: string]: { result: string; notes?: string } } };
}

interface WorkplaceState {
  session: UnifiedSession;
  activeListening: {
    isListening: boolean;
    isProcessing: boolean;
    currentTranscript: string;
    error: string | null;
    audioLevel?: number;
    currentSpeaker?: SpeakerInfo;
  };
  clinicalAnalysis: {
    isAnalyzing: boolean;
    error: string | null;
  };
  soapGeneration: {
    isGenerating: boolean;
    result: SOAPStructure | null;
    error: string | null;
    confidence: number;
  };
  // === NUEVO ESTADO PARA ASISTENTE CLÍNICO ===
  clinicalAssistant: {
    isAnalyzing: boolean;
    analysisResult: ClinicalAnalysisResult | null;
    error: string | null;
  };
  // === NUEVO ESTADO PARA PREGUNTAS INTELIGENTES ===
  smartQuestions: QuestionSuggestionEngine;
}

// === UTILIDADES ===
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getStatusColor(status: WorkplaceStatus): string {
  switch (status) {
    case 'READY': return '#5DA5A3';
    case 'ACTIVE': return '#FF6F61';
    case 'PROCESSING': return '#A8E6CF';
    case 'COMPLETED': return '#2C3E50';
    default: return '#BDC3C7';
  }
}

// Servicio local simplificado
const localStorageService = {
  getAllPatients: (): Patient[] => {
    try {
      const patients = localStorage.getItem('aiduxcare_patients');
      return patients ? JSON.parse(patients) : [];
    } catch {
      return [];
    }
  }
};

const PatientCompletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados principales
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Estado unificado del workplace
  const [workplace, setWorkplace] = useState<WorkplaceState>({
    session: {
      status: 'READY',
      duration: 0,
      transcription: [],
      entities: [],
      acceptedSuggestions: [],
      completedTests: {}
    },
    activeListening: {
      isListening: false,
      isProcessing: false,
      currentTranscript: '',
      error: null
    },
    clinicalAnalysis: {
      isAnalyzing: false,
      error: null
    },
    soapGeneration: {
      isGenerating: false,
      result: null,
      error: null,
      confidence: 0
    },
    clinicalAssistant: {
      isAnalyzing: false,
      analysisResult: null,
      error: null
    },
    smartQuestions: {
      isActive: false,
      currentSuggestions: [],
      usedQuestions: [],
      preparationQuestions: [],
      contextAnalysis: {
        lastAnalyzedSegment: '',
        detectedTopics: [],
        missingInformation: []
      }
    }
  });

  // === INICIALIZACIÓN ===
  useEffect(() => {
    if (!id) {
      navigate('/patients', { replace: true });
      return;
    }
    
    const loadPatientData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Cargando datos del paciente:', id);
        
        // Intentar cargar desde localStorage
        const localPatients = localStorageService.getAllPatients();
        let patientData = localPatients.find(p => p.id === id);
        
        // Si no existe, crear un paciente de ejemplo
        if (!patientData) {
          patientData = {
            id: id || 'demo-patient',
            name: 'Andreina Saade',
            age: 42,
            phone: '+56 9 1234 5678',
            email: 'andreina@email.com',
            condition: 'Dolor lumbar crónico',
            allergies: [],
            medications: [],
            clinicalHistory: 'Paciente con historial de dolor lumbar crónico',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        console.log('✅ Datos del paciente cargados:', patientData);
        setPatient(patientData);
        
      } catch (error) {
        console.error('❌ Error al cargar datos del paciente:', error);
        setError('No se pudo cargar la información del paciente');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatientData();
  }, [id, navigate]);

  // Timer para duración de sesión
  useEffect(() => {
    if (workplace.session.status === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setWorkplace(prev => ({
          ...prev,
          session: { ...prev.session, duration: prev.session.duration + 1 }
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [workplace.session.status]);

  // === HANDLERS PRINCIPALES ===
  const handleUnifiedSessionControl = async () => {
    try {
      if (workplace.session.status === 'READY') {
        // Iniciar sesión
        console.log('🎙️ Iniciando sesión de grabación...');
        
        setWorkplace(prev => ({
          ...prev,
          session: {
            ...prev.session,
            status: 'ACTIVE',
            startTime: new Date(),
            duration: 0
          },
          activeListening: {
            ...prev.activeListening,
            isListening: true,
            error: null,
            currentTranscript: ''
          }
        }));

        // Iniciar captura real de audio
        await startRealtimeTranscription();
        
      } else if (workplace.session.status === 'ACTIVE') {
        // Detener sesión y procesar
        console.log('⏹️ Deteniendo sesión...');
        
        // Detener la captura real de audio
        stopRealtimeTranscription();
        
        setWorkplace(prev => ({
          ...prev,
          session: { ...prev.session, status: 'PROCESSING' },
          activeListening: {
            ...prev.activeListening,
            isListening: false,
            isProcessing: true
          }
        }));

        // Procesar datos de la sesión
        await processSessionData();
      }
    } catch (error) {
      console.error('❌ Error en control de sesión:', error);
      setWorkplace(prev => ({
        ...prev,
        activeListening: {
          ...prev.activeListening,
          error: 'Error al controlar la sesión'
        }
      }));
    }
  };

  const processSessionData = async () => {
    try {
      console.log('🔄 Procesando datos de sesión...');
      
      // Obtener la transcripción real
      const realTranscript = workplace.activeListening.currentTranscript.trim();
      
      if (!realTranscript) {
        throw new Error('No hay transcripción disponible para procesar');
      }
      
      console.log('📝 Transcripción a procesar:', realTranscript);
      
      // Simular análisis clínico de la transcripción real
      setWorkplace(prev => ({
        ...prev,
        clinicalAnalysis: { ...prev.clinicalAnalysis, isAnalyzing: true }
      }));

      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar SOAP basado en la transcripción real
      setWorkplace(prev => ({
        ...prev,
        clinicalAnalysis: { ...prev.clinicalAnalysis, isAnalyzing: false },
        soapGeneration: { ...prev.soapGeneration, isGenerating: true }
      }));

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generar SOAP inteligente basado en la transcripción
      const soapResult = generateSOAPFromTranscript(realTranscript);

      // Completar sesión con datos reales
      setWorkplace(prev => ({
        ...prev,
        session: { 
          ...prev.session, 
          status: 'COMPLETED',
          transcription: [{
            id: `segment_${Date.now()}`,
            content: realTranscript,
            confidence: calculateConfidence(realTranscript),
            startTime: 0,
            endTime: prev.session.duration,
            speaker: {
              speakerTag: 0,
              role: 'UNKNOWN',
              confidence: 0.5,
              timeOffset: 0
            },
            timestamp: new Date().toLocaleTimeString('es-ES')
          }],
          entities: extractClinicalEntities(realTranscript)
        },
        activeListening: { ...prev.activeListening, isProcessing: false },
        soapGeneration: { 
          ...prev.soapGeneration, 
          isGenerating: false,
          result: soapResult,
          confidence: calculateConfidence(realTranscript)
        }
      }));

      console.log('✅ Procesamiento completado con transcripción real');
      
    } catch (error) {
      console.error('❌ Error en procesamiento:', error);
      setWorkplace(prev => ({
        ...prev,
        session: { ...prev.session, status: 'READY' },
        activeListening: { ...prev.activeListening, isProcessing: false },
        clinicalAnalysis: { 
          ...prev.clinicalAnalysis, 
          isAnalyzing: false,
          error: error instanceof Error ? error.message : 'Error en el análisis'
        },
        soapGeneration: { 
          ...prev.soapGeneration, 
          isGenerating: false,
          error: 'Error en generación SOAP'
        }
      }));
    }
  };

  // Función para generar SOAP basado en transcripción real
  const generateSOAPFromTranscript = (transcript: string): SOAPStructure => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Extraer información subjetiva (síntomas reportados por el paciente)
    let subjetivo = 'Paciente refiere: ';
    if (lowerTranscript.includes('dolor')) {
      const dolorMatch = transcript.match(/dolor\s+[^.]*[.]/gi);
      if (dolorMatch) {
        subjetivo += dolorMatch.join(' ');
      } else {
        subjetivo += 'dolor según lo mencionado en la consulta.';
      }
    } else {
      subjetivo += 'síntomas según lo expresado durante la consulta.';
    }
    
    // Extraer información objetiva (examen físico mencionado)
    let objetivo = 'Examen físico: ';
    if (lowerTranscript.includes('examen') || lowerTranscript.includes('palpar') || lowerTranscript.includes('evaluar')) {
      const examenMatch = transcript.match(/(examen|palpar|evaluar)[^.]*[.]/gi);
      if (examenMatch) {
        objetivo += examenMatch.join(' ');
      } else {
        objetivo += 'hallazgos según evaluación realizada.';
      }
    } else {
      objetivo += 'evaluación clínica documentada durante la sesión.';
    }
    
    // Generar evaluación basada en contenido
    let evaluacion = '';
    if (lowerTranscript.includes('lumbar') || lowerTranscript.includes('espalda')) {
      evaluacion = 'Dolor lumbar con componente muscular según evaluación clínica.';
    } else if (lowerTranscript.includes('dolor')) {
      evaluacion = 'Proceso doloroso según sintomatología referida por el paciente.';
    } else {
      evaluacion = 'Evaluación clínica basada en hallazgos de la consulta.';
    }
    
    // Generar plan basado en tratamientos mencionados
    let plan = 'Plan de tratamiento: ';
    if (lowerTranscript.includes('fisioterapia')) {
      plan += 'Continuar con fisioterapia. ';
    }
    if (lowerTranscript.includes('medicamento') || lowerTranscript.includes('analgésico')) {
      plan += 'Manejo farmacológico según indicación. ';
    }
    if (lowerTranscript.includes('semana') || lowerTranscript.includes('control')) {
      plan += 'Control en una semana para evaluación de evolución.';
    } else {
      plan += 'Seguimiento según evolución clínica.';
    }
    
    return {
      subjetivo: subjetivo.trim(),
      objetivo: objetivo.trim(),
      evaluacion: evaluacion.trim(),
      plan: plan.trim()
    };
  };

  // Función para extraer entidades clínicas de la transcripción
  const extractClinicalEntities = (transcript: string): ClinicalEntity[] => {
    const entities: ClinicalEntity[] = [];
    const lowerTranscript = transcript.toLowerCase();
    
    // Buscar síntomas
    const symptoms = ['dolor', 'molestia', 'inflamación', 'rigidez', 'debilidad'];
    symptoms.forEach(symptom => {
      if (lowerTranscript.includes(symptom)) {
        entities.push({
          id: `symptom_${symptom}`,
          text: symptom,
          type: 'SYMPTOM',
          confidence: 0.8 + Math.random() * 0.2
        });
      }
    });
    
    // Buscar anatomía
    const anatomy = ['lumbar', 'espalda', 'columna', 'músculo', 'articulación'];
    anatomy.forEach(part => {
      if (lowerTranscript.includes(part)) {
        entities.push({
          id: `anatomy_${part}`,
          text: part,
          type: 'ANATOMY',
          confidence: 0.7 + Math.random() * 0.3
        });
      }
    });
    
    // Buscar tratamientos
    const treatments = ['fisioterapia', 'medicamento', 'analgésico', 'ejercicio'];
    treatments.forEach(treatment => {
      if (lowerTranscript.includes(treatment)) {
        entities.push({
          id: `treatment_${treatment}`,
          text: treatment,
          type: 'TREATMENT',
          confidence: 0.75 + Math.random() * 0.25
        });
      }
    });
    
    return entities;
  };

  // Función para calcular confianza basada en la calidad de la transcripción
  const calculateConfidence = (transcript: string): number => {
    if (!transcript || transcript.trim().length < 10) return 0.3;
    
    const wordCount = transcript.split(' ').length;
    const hasKeywords = /dolor|síntoma|examen|tratamiento|fisioterapia/i.test(transcript);
    
    let confidence = 0.5; // Base
    
    if (wordCount > 20) confidence += 0.2;
    if (wordCount > 50) confidence += 0.1;
    if (hasKeywords) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  };

  // === CAPTURA REAL DE AUDIO ===
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Inicializar reconocimiento de voz
  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configuración mejorada para mejor reconocimiento
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.maxAlternatives = 1;
      
      // Configuraciones adicionales para mejor calidad
      if (recognitionRef.current.serviceURI) {
        recognitionRef.current.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
      }
      
      let finalTranscriptAccumulated = '';
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscriptAccumulated += transcript + ' ';
            console.log('🎯 Transcripción final:', transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Actualizar transcripción en tiempo real
        setWorkplace(prev => ({
          ...prev,
          activeListening: {
            ...prev.activeListening,
            currentTranscript: finalTranscriptAccumulated + interimTranscript
          }
        }));
      };
      
      recognitionRef.current.onstart = () => {
        console.log('🎙️ Reconocimiento de voz iniciado');
        setWorkplace(prev => ({
          ...prev,
          activeListening: {
            ...prev.activeListening,
            error: null
          }
        }));
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento de voz:', event.error);
        let errorMessage = 'Error de reconocimiento de voz';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó habla. Hable más cerca del micrófono.';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono. Verifique los permisos.';
            break;
          case 'not-allowed':
            errorMessage = 'Acceso al micrófono denegado. Permita el acceso en la configuración del navegador.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifique su conexión a internet.';
            break;
          case 'language-not-supported':
            errorMessage = 'Idioma no soportado. Cambie la configuración de idioma.';
            break;
          default:
            errorMessage = `Error de reconocimiento: ${event.error}`;
        }
        
        setWorkplace(prev => ({
          ...prev,
          activeListening: {
            ...prev.activeListening,
            error: errorMessage
          }
        }));
      };
      
      recognitionRef.current.onend = () => {
        console.log('🔄 Reconocimiento terminado, reiniciando...');
        if (workplace.session.status === 'ACTIVE') {
          // Reiniciar reconocimiento si la sesión sigue activa
          setTimeout(() => {
            if (recognitionRef.current && workplace.session.status === 'ACTIVE') {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.error('Error reiniciando reconocimiento:', error);
              }
            }
          }, 500);
        }
      };
      
      console.log('✅ Reconocimiento de voz configurado');
    } else {
      console.error('❌ Reconocimiento de voz no soportado en este navegador');
      setWorkplace(prev => ({
        ...prev,
        activeListening: {
          ...prev.activeListening,
          error: 'Reconocimiento de voz no soportado en este navegador. Use Chrome o Edge.'
        }
      }));
    }
  };

  // Inicializar análisis de audio para visualización
  const initializeAudioAnalysis = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.error('Error inicializando análisis de audio:', error);
    }
  };

  // Captura real de audio del ambiente
  const startRealtimeTranscription = async () => {
    try {
      console.log('🎙️ Solicitando acceso al micrófono...');
      
      // Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      audioStreamRef.current = stream;
      
      // Configurar MediaRecorder para grabación
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      // Configurar análisis de audio para visualización
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        startAudioVisualization();
      }
      
      // Iniciar reconocimiento de voz
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Iniciar grabación
      mediaRecorderRef.current.start();
      
      console.log('✅ Captura de audio iniciada correctamente');
      
      setWorkplace(prev => ({
        ...prev,
        activeListening: {
          ...prev.activeListening,
          error: null,
          currentTranscript: ''
        }
      }));
      
    } catch (error) {
      console.error('❌ Error accediendo al micrófono:', error);
      setWorkplace(prev => ({
        ...prev,
        activeListening: {
          ...prev.activeListening,
          error: 'No se pudo acceder al micrófono. Verifique los permisos.'
        }
      }));
    }
  };

  // Visualización de audio en tiempo real
  const startAudioVisualization = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const animate = () => {
      if (!analyserRef.current || workplace.session.status !== 'ACTIVE') return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calcular nivel de audio promedio
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedLevel = Math.min(average / 128, 1);
      
      // Actualizar visualización (esto se puede usar para animar las barras)
      setWorkplace(prev => ({
        ...prev,
        activeListening: {
          ...prev.activeListening,
          audioLevel: normalizedLevel
        }
      }));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const stopRealtimeTranscription = () => {
    // Detener reconocimiento de voz
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Detener grabación
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Detener stream de audio
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Detener visualización de audio
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Cerrar contexto de audio
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    console.log('🔇 Captura de audio detenida');
  };

  // Inicializar servicios de audio al montar el componente
  useEffect(() => {
    initializeSpeechRecognition();
    initializeAudioAnalysis();
    
    return () => {
      stopRealtimeTranscription();
    };
  }, []);

  const handleBackToPatients = () => {
    navigate('/patients');
  };

  const handleLogout = () => {
    navigate('/auth');
  };

  const handleResetSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setWorkplace({
      session: {
        status: 'READY',
        duration: 0,
        transcription: [],
        entities: [],
        acceptedSuggestions: [],
        completedTests: {}
      },
      activeListening: {
        isListening: false,
        isProcessing: false,
        currentTranscript: '',
        error: null
      },
      clinicalAnalysis: {
        isAnalyzing: false,
        error: null
      },
      soapGeneration: {
        isGenerating: false,
        result: null,
        error: null,
        confidence: 0
      },
      clinicalAssistant: {
        isAnalyzing: false,
        analysisResult: null,
        error: null
      },
      smartQuestions: {
        isActive: false,
        currentSuggestions: [],
        usedQuestions: [],
        preparationQuestions: [],
        contextAnalysis: {
          lastAnalyzedSegment: '',
          detectedTopics: [],
          missingInformation: []
        }
      }
    });
  };

  // === FUNCIONES DEL ASISTENTE CLÍNICO ===

  const performClinicalAnalysis = async () => {
    if (!patient || workplace.session.entities.length === 0) {
      console.log('⚠️ No hay entidades clínicas para analizar');
      return;
    }

    try {
      console.log('🔍 Iniciando análisis clínico inteligente...');
      
      setWorkplace(prev => ({
        ...prev,
        clinicalAssistant: {
          ...prev.clinicalAssistant,
          isAnalyzing: true,
          error: null
        }
      }));

      // Convertir entidades al formato del asistente clínico
      const clinicalEntities: ClinicalEntityType[] = workplace.session.entities.map(entity => ({
        id: entity.id,
        text: entity.text,
        type: entity.type,
        confidence: entity.confidence
      }));

      // Convertir paciente al formato del asistente clínico
      const clinicalPatient: ClinicalPatient = {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        email: patient.email,
        condition: patient.condition,
        allergies: patient.allergies,
        medications: patient.medications,
        clinicalHistory: patient.clinicalHistory,
        derivadoPor: patient.derivadoPor,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      };

      // Realizar análisis clínico completo
      const analysisResult = await clinicalAssistantService.performClinicalAnalysis(
        clinicalEntities,
        clinicalPatient
      );

      console.log('✅ Análisis clínico completado:', analysisResult);

      setWorkplace(prev => ({
        ...prev,
        session: {
          ...prev.session,
          clinicalAnalysis: analysisResult
        },
        clinicalAssistant: {
          ...prev.clinicalAssistant,
          isAnalyzing: false,
          analysisResult: analysisResult
        }
      }));

    } catch (error) {
      console.error('❌ Error en análisis clínico:', error);
      setWorkplace(prev => ({
        ...prev,
        clinicalAssistant: {
          ...prev.clinicalAssistant,
          isAnalyzing: false,
          error: 'Error al realizar el análisis clínico'
        }
      }));
    }
  };

  const handleSuggestionAccepted = (suggestion: ClinicalSuggestion) => {
    console.log('✅ Sugerencia aceptada:', suggestion.title);
    
    setWorkplace(prev => ({
      ...prev,
      session: {
        ...prev.session,
        acceptedSuggestions: [...prev.session.acceptedSuggestions, suggestion]
      }
    }));
  };

  const handleSuggestionDismissed = (suggestion: ClinicalSuggestion) => {
    console.log('❌ Sugerencia descartada:', suggestion.title);
    // Las sugerencias descartadas se manejan en el componente ClinicalAssistantPanel
  };

  const handleTestCompleted = (templateId: string, testId: string, result: string, notes?: string) => {
    console.log('📝 Test completado:', { templateId, testId, result, notes });
    
    setWorkplace(prev => ({
      ...prev,
      session: {
        ...prev.session,
        completedTests: {
          ...prev.session.completedTests,
          [templateId]: {
            ...prev.session.completedTests[templateId],
            [testId]: { result, notes }
          }
        }
      }
    }));
  };

  const handleSOAPEnhancement = (enhancement: any) => {
    console.log('📋 Mejora SOAP aplicada:', enhancement);
    // Manejar mejoras automáticas del SOAP
  };

  const handleSOAPChange = (soap: { subjective: string; objective: string; assessment: string; plan: string }) => {
    console.log('📝 SOAP actualizado:', soap);
    
    // Convertir al formato interno
    const soapStructure: SOAPStructure = {
      subjetivo: soap.subjective,
      objetivo: soap.objective,
      evaluacion: soap.assessment,
      plan: soap.plan
    };

    setWorkplace(prev => ({
      ...prev,
      session: {
        ...prev.session,
        soapNote: soapStructure
      }
    }));
  };

  const handleSuggestionApplied = (suggestionId: string, section: 'S' | 'O' | 'A' | 'P') => {
    console.log('✅ Sugerencia aplicada al SOAP:', { suggestionId, section });
  };

  // Ejecutar análisis clínico automáticamente cuando se completa el procesamiento
  useEffect(() => {
    if (workplace.session.status === 'COMPLETED' && workplace.session.entities.length > 0) {
      performClinicalAnalysis();
    }
  }, [workplace.session.status, workplace.session.entities.length]);

  // === FUNCIONES PARA PREGUNTAS INTELIGENTES ===
  
  // Cargar preguntas de preparación
  useEffect(() => {
    const loadPreparationQuestions = () => {
      try {
        const preparationData = localStorage.getItem(`preparation-${id}`);
        if (preparationData) {
          const { selectedQuestions } = JSON.parse(preparationData);
          setWorkplace(prev => ({
            ...prev,
            smartQuestions: {
              ...prev.smartQuestions,
              preparationQuestions: selectedQuestions || [],
              isActive: true
            }
          }));
        }
      } catch (error) {
        console.error('Error cargando preguntas de preparación:', error);
      }
    };

    if (id) {
      loadPreparationQuestions();
    }
  }, [id]);

  // Analizar transcripción en tiempo real para generar preguntas
  useEffect(() => {
    if (workplace.session.status === 'ACTIVE' && workplace.activeListening.currentTranscript) {
      const analyzeTranscriptForQuestions = () => {
        const transcript = workplace.activeListening.currentTranscript;
        const newSuggestions = generateSmartQuestions(transcript);
        
        if (newSuggestions.length > 0) {
          setWorkplace(prev => ({
            ...prev,
            smartQuestions: {
              ...prev.smartQuestions,
              currentSuggestions: [
                ...prev.smartQuestions.currentSuggestions,
                ...newSuggestions
              ].slice(-5) // Mantener solo las 5 más recientes
            }
          }));
        }
      };

      // Analizar cada 3 segundos durante la sesión activa
      const interval = setInterval(analyzeTranscriptForQuestions, 3000);
      return () => clearInterval(interval);
    }
  }, [workplace.session.status, workplace.activeListening.currentTranscript]);

  const generateSmartQuestions = (transcript: string): SmartQuestion[] => {
    const questions: SmartQuestion[] = [];
    const lowerTranscript = transcript.toLowerCase();
    
    // Si hay muy poca transcripción, generar preguntas de ejemplo
    if (transcript.length < 50) {
      questions.push({
        id: `demo_${Date.now()}_1`,
        text: '¿Puede describir la intensidad del dolor del 1 al 10?',
        category: 'assessment',
        priority: 'high',
        triggeredBy: 'inicio de sesión',
        confidence: 0.9,
        timestamp: new Date()
      });
      return questions;
    }
    
    // Detectar patrones y generar preguntas contextuales
    const patterns = [
      {
        keywords: ['dolor', 'duele', 'molesta'],
        question: '¿Puede describir mejor la intensidad del dolor del 1 al 10?',
        category: 'assessment' as const,
        priority: 'high' as const
      },
      {
        keywords: ['mejor', 'peor', 'cambio'],
        question: '¿Desde cuándo nota este cambio?',
        category: 'followup' as const,
        priority: 'medium' as const
      },
      {
        keywords: ['medicamento', 'pastilla', 'tratamiento'],
        question: '¿Ha tomado algún medicamento para esto?',
        category: 'treatment' as const,
        priority: 'high' as const
      },
      {
        keywords: ['noche', 'dormir', 'sueño'],
        question: '¿El problema afecta su calidad de sueño?',
        category: 'assessment' as const,
        priority: 'medium' as const
      },
      {
        keywords: ['trabajo', 'actividad', 'ejercicio'],
        question: '¿Qué actividades específicas le resultan más difíciles?',
        category: 'assessment' as const,
        priority: 'medium' as const
      }
    ];

    patterns.forEach(pattern => {
      const hasKeywords = pattern.keywords.some(keyword => 
        lowerTranscript.includes(keyword)
      );
      
      if (hasKeywords && !workplace.smartQuestions.usedQuestions.includes(pattern.question)) {
        questions.push({
          id: `smart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: pattern.question,
          category: pattern.category,
          priority: pattern.priority,
          triggeredBy: pattern.keywords.find(k => lowerTranscript.includes(k)) || '',
          confidence: 0.8,
          timestamp: new Date()
        });
      }
    });

    return questions;
  };

  const handleQuestionUsed = (questionId: string) => {
    const question = workplace.smartQuestions.currentSuggestions.find(q => q.id === questionId);
    if (question) {
      setWorkplace(prev => ({
        ...prev,
        smartQuestions: {
          ...prev.smartQuestions,
          usedQuestions: [...prev.smartQuestions.usedQuestions, question.text],
          currentSuggestions: prev.smartQuestions.currentSuggestions.filter(q => q.id !== questionId)
        }
      }));
    }
  };

  const handleQuestionDismissed = (questionId: string) => {
    setWorkplace(prev => ({
      ...prev,
      smartQuestions: {
        ...prev.smartQuestions,
        currentSuggestions: prev.smartQuestions.currentSuggestions.filter(q => q.id !== questionId)
      }
    }));
  };

  // === RENDERS CONDICIONALES ===
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#2C3E50]">Cargando workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] to-[#FF6F61]/10 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-[#FF6F61]/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#FF6F61]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#2C3E50]">Error en Workspace</h2>
          <p className="text-[#2C3E50]/70">{error || 'Paciente no encontrado'}</p>
          <button
            onClick={handleBackToPatients}
            className="btn-primary"
          >
            Volver a Pacientes
          </button>
        </div>
      </div>
    );
  }

  // === RENDER PRINCIPAL ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header con identidad oficial */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">AiDuxCare</h1>
                <p className="text-sm text-[#2C3E50]/70">EMR Inteligente</p>
              </div>
            </div>

            {/* Info del terapeuta y acciones */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-[#2C3E50]">Mauricio Sobarzo</p>
                <p className="text-xs text-[#2C3E50]/60">Profesional de la salud</p>
              </div>
              <button
                onClick={() => navigate('/patients')}
                className="text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
                title="Volver a lista de pacientes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Header de Paciente */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {patient.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#2C3E50]">{patient.name}</h2>
                <p className="text-sm text-[#2C3E50]/70">
                  {patient.age} años • {patient.condition}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(workplace.session.status) }}
                ></div>
                <span className="text-sm font-medium text-[#2C3E50]">
                  {workplace.session.status}
                </span>
                <span className="text-sm text-[#2C3E50]/60">
                  {formatDuration(workplace.session.duration)}
                </span>
              </div>
              {workplace.activeListening.isListening && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-[#FF6F61]/10 rounded-full">
                  <div className="w-2 h-2 bg-[#FF6F61] rounded-full animate-pulse"></div>
                  <span className="text-[#FF6F61] font-medium text-xs">REC</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Asistente AiDux - Solo visible al hacer clic */}
      {showAssistant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#BDC3C7]/20">
              <h3 className="text-lg font-bold text-[#2C3E50]">AiDux Asistente</h3>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-[#BDC3C7] hover:text-[#2C3E50] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-[#2C3E50]">AiDux Asistente</h4>
                <p className="text-sm text-[#2C3E50]/70">
                  {workplace.session.status === 'READY' && 'Listo para ayudarte con la sesión'}
                  {workplace.session.status === 'ACTIVE' && 'Monitoreando la grabación en tiempo real'}
                  {workplace.session.status === 'PROCESSING' && 'Analizando la información clínica'}
                  {workplace.session.status === 'COMPLETED' && 'Sesión completada exitosamente'}
                </p>
                <div className="space-y-2">
                  <button className="w-full bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-[#4A8280] hover:to-[#3A6B69] transition-all">
                    💡 Generar Plan de Ejercicios
                  </button>
                  <button className="w-full bg-gradient-to-r from-[#A8E6CF] to-[#8BDBB7] text-[#2C3E50] py-2 px-4 rounded-lg text-sm font-medium hover:from-[#8BDBB7] hover:to-[#6ED09F] transition-all">
                    📋 Sugerencias SOAP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para mostrar asistente */}
      <button
        onClick={() => setShowAssistant(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white rounded-full shadow-2xl hover:shadow-[#5DA5A3]/25 hover:scale-110 transition-all duration-300 flex items-center justify-center group z-40"
        title="Abrir AiDux Asistente"
      >
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Layout Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Layout dinámico: 3 columnas normalmente, 4 cuando hay SOAP */}
        <div className={`grid gap-6 ${workplace.session.status === 'COMPLETED' && workplace.session.soapNote ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
          
          {/* Panel Izquierdo: Control */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Control de Sesión */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#2C3E50]">Control</h2>
                <button
                  onClick={handleResetSession}
                  className="p-2 text-[#BDC3C7] hover:text-[#2C3E50] transition-colors rounded-lg hover:bg-[#F7F7F7]"
                  title="Reiniciar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Botón Principal */}
              <div className="text-center mb-6">
                <button
                  onClick={handleUnifiedSessionControl}
                  disabled={workplace.activeListening.isProcessing || workplace.clinicalAnalysis.isAnalyzing || workplace.soapGeneration.isGenerating}
                  className={`
                    w-24 h-24 mx-auto rounded-2xl text-white font-medium text-xs
                    transform transition-all duration-200 shadow-lg
                    hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-3
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${workplace.session.status === 'READY' ? 'bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] hover:from-[#4A8280] hover:to-[#3A6B69] focus:ring-[#5DA5A3]/30' :
                      workplace.session.status === 'ACTIVE' ? 'bg-gradient-to-br from-[#FF6F61] to-[#E5574A] hover:from-[#E5574A] hover:to-[#CC4A3D] focus:ring-[#FF6F61]/30' :
                      workplace.session.status === 'PROCESSING' ? 'bg-gradient-to-br from-[#A8E6CF] to-[#8BDBB7] hover:from-[#8BDBB7] hover:to-[#6ED09F] focus:ring-[#A8E6CF]/30' :
                      'bg-gradient-to-br from-[#2C3E50] to-[#1B2631] hover:from-[#1B2631] hover:to-[#0F1419] focus:ring-[#2C3E50]/30'
                    }
                  `}
                >
                  <div className="space-y-1">
                    {workplace.session.status === 'READY' && (
                      <>
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs leading-tight">INICIAR</div>
                      </>
                    )}
                    {workplace.session.status === 'ACTIVE' && (
                      <>
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs leading-tight">DETENER</div>
                      </>
                    )}
                    {workplace.session.status === 'PROCESSING' && (
                      <>
                        <div className="w-6 h-6 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs leading-tight">
                          {workplace.soapGeneration.isGenerating ? 'GENERANDO SOAP' : 'PROCESANDO'}
                        </div>
                      </>
                    )}
                    {workplace.session.status === 'COMPLETED' && (
                      <>
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs leading-tight">COMPLETADO</div>
                      </>
                    )}
                  </div>
                </button>

                <p className="text-[#2C3E50]/60 mt-3 text-xs">
                  {workplace.session.status === 'READY' && 'Clic para iniciar'}
                  {workplace.session.status === 'ACTIVE' && 'Grabando...'}
                  {workplace.session.status === 'PROCESSING' && (workplace.soapGeneration.isGenerating ? 'Generando SOAP...' : 'Analizando...')}
                  {workplace.session.status === 'COMPLETED' && 'Sesión completada'}
                </p>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#2C3E50]">
                    {workplace.session.transcription.length}
                  </div>
                  <div className="text-xs text-[#2C3E50]/60">Notas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2C3E50]">
                    {workplace.session.entities.length}
                  </div>
                  <div className="text-xs text-[#2C3E50]/60">Entidades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#FF6F61]">
                    {formatDuration(workplace.session.duration)}
                  </div>
                  <div className="text-xs text-[#2C3E50]/60">Tiempo</div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 space-y-3">
                <button
                  disabled
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-[#BDC3C7]/20 text-[#BDC3C7] rounded-lg cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">Exportar PDF</span>
                </button>
                
                <button
                  onClick={handleBackToPatients}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-[#5DA5A3] hover:bg-[#5DA5A3]/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm">Volver</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel Central: Transcripción */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Transcripción en Tiempo Real */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-[#2C3E50]">Transcripción</h3>
                </div>
                {workplace.activeListening.isListening && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#FF6F61] rounded-full animate-pulse"></div>
                    <span className="text-xs text-[#FF6F61] font-medium">En vivo</span>
                  </div>
                )}
              </div>

              <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                {workplace.session.status === 'READY' && (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-[#A8E6CF]/20 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-[#2C3E50] mb-2">Transcripción Automática</h4>
                    <p className="text-sm text-[#2C3E50]/60 max-w-xs">
                      Inicia la sesión para comenzar a transcribir automáticamente la conversación
                    </p>
                  </div>
                )}

                {workplace.session.status === 'ACTIVE' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 bg-[#A8E6CF]/10 rounded-lg">
                      <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-pulse"></div>
                      <span className="text-sm text-[#2C3E50]">Escuchando y transcribiendo...</span>
                      <div className="flex space-x-1 ml-auto">
                        {[1, 2, 3, 4, 5].map((bar, index) => {
                          const audioLevel = workplace.activeListening.audioLevel || 0;
                          const barHeight = Math.max(12, audioLevel * 24 + Math.random() * 8);
                          const isActive = audioLevel > 0.1 && index < (audioLevel * 5);
                          
                          return (
                            <div 
                              key={bar}
                              className={`w-1 rounded transition-all duration-150 ${
                                isActive ? 'bg-[#5DA5A3]' : 'bg-[#BDC3C7]/40'
                              }`}
                              style={{
                                height: `${barHeight}px`,
                                animationDelay: `${index * 100}ms`
                              }}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Transcripción en tiempo real */}
                    <div className="p-4 bg-[#F7F7F7] rounded-lg border-l-4 border-[#5DA5A3] min-h-[200px]">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-[#2C3E50] text-sm">Transcripción en vivo</h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#FF6F61] rounded-full animate-pulse"></div>
                          <span className="text-xs text-[#FF6F61] font-medium">EN VIVO</span>
                        </div>
                      </div>
                      
                      {workplace.activeListening.currentTranscript ? (
                        <div className="space-y-2">
                          <p className="text-sm text-[#2C3E50] leading-relaxed">
                            {workplace.activeListening.currentTranscript}
                            <span className="inline-block w-2 h-4 bg-[#5DA5A3] ml-1 animate-pulse"></span>
                          </p>
                          
                          {/* Indicador de palabras por minuto */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#BDC3C7]/20">
                            <span className="text-xs text-[#2C3E50]/60">
                              {workplace.activeListening.currentTranscript.split(' ').length} palabras
                            </span>
                            <span className="text-xs text-[#5DA5A3] font-medium">
                              ~{Math.floor(workplace.activeListening.currentTranscript.split(' ').length / (workplace.session.duration / 60) || 1)} ppm
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-center">
                          <div className="space-y-2">
                            <div className="flex justify-center space-x-1">
                              <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                            <p className="text-sm text-[#2C3E50]/60">Esperando audio...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === PREGUNTAS INTELIGENTES DURANTE SESIÓN ACTIVA === */}
                {workplace.session.status === 'ACTIVE' && (
                  <div className="mt-4 space-y-3">
                    {/* DEBUG: Mostrar estado actual */}
                    <div className="p-2 bg-yellow-100 rounded text-xs">
                      <strong>DEBUG:</strong> isActive: {workplace.smartQuestions.isActive ? 'true' : 'false'}, 
                      Preparadas: {workplace.smartQuestions.preparationQuestions.length}, 
                      Sugerencias: {workplace.smartQuestions.currentSuggestions.length}
                    </div>

                    {/* Preguntas de Preparación */}
                    {workplace.smartQuestions.preparationQuestions.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-[#5DA5A3]/10 to-[#A8E6CF]/10 rounded-lg border border-[#5DA5A3]/20">
                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="w-4 h-4 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h4 className="font-medium text-[#2C3E50] text-sm">Preguntas Preparadas</h4>
                          <span className="text-xs bg-[#5DA5A3]/20 text-[#5DA5A3] px-2 py-1 rounded-full">
                            {workplace.smartQuestions.preparationQuestions.length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {workplace.smartQuestions.preparationQuestions.slice(0, 3).map((question, index) => (
                            <div key={index} className="flex items-start space-x-2 p-2 bg-white/50 rounded text-sm">
                              <span className="text-[#5DA5A3] font-medium">•</span>
                              <span className="text-[#2C3E50] flex-1">{question}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preguntas Sugeridas por IA en Tiempo Real */}
                    {workplace.smartQuestions.currentSuggestions.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-[#FF6F61]/10 to-[#E5574A]/10 rounded-lg border border-[#FF6F61]/20">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-2 h-2 bg-[#FF6F61] rounded-full animate-pulse"></div>
                          <svg className="w-4 h-4 text-[#FF6F61]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <h4 className="font-medium text-[#2C3E50] text-sm">IA Sugiere Preguntar</h4>
                          <span className="text-xs bg-[#FF6F61]/20 text-[#FF6F61] px-2 py-1 rounded-full">
                            TIEMPO REAL
                          </span>
                        </div>
                        <div className="space-y-2">
                          {workplace.smartQuestions.currentSuggestions.slice(0, 2).map((suggestion) => (
                            <div key={suggestion.id} className="flex items-start justify-between p-3 bg-white/70 rounded-lg border border-[#FF6F61]/10">
                              <div className="flex-1 space-y-1">
                                <p className="text-sm text-[#2C3E50] font-medium">{suggestion.text}</p>
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className={`px-2 py-1 rounded-full ${
                                    suggestion.priority === 'high' ? 'bg-[#FF6F61]/20 text-[#FF6F61]' :
                                    suggestion.priority === 'medium' ? 'bg-[#A8E6CF]/20 text-[#5DA5A3]' :
                                    'bg-[#BDC3C7]/20 text-[#2C3E50]'
                                  }`}>
                                    {suggestion.priority === 'high' ? 'Alta' : 
                                     suggestion.priority === 'medium' ? 'Media' : 'Baja'} prioridad
                                  </span>
                                  <span className="text-[#2C3E50]/60">
                                    Activada por: "{suggestion.triggeredBy}"
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-3">
                                <button
                                  onClick={() => handleQuestionUsed(suggestion.id)}
                                  className="p-1.5 text-[#5DA5A3] hover:bg-[#5DA5A3]/10 rounded transition-colors"
                                  title="Marcar como usada"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleQuestionDismissed(suggestion.id)}
                                  className="p-1.5 text-[#BDC3C7] hover:bg-[#BDC3C7]/10 rounded transition-colors"
                                  title="Descartar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Estadísticas de preguntas */}
                        <div className="mt-3 pt-3 border-t border-[#FF6F61]/10 flex items-center justify-between text-xs">
                          <span className="text-[#2C3E50]/60">
                            {workplace.smartQuestions.usedQuestions.length} preguntas utilizadas
                          </span>
                          <span className="text-[#FF6F61] font-medium">
                            {workplace.smartQuestions.currentSuggestions.length} pendientes
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mensaje cuando no hay preguntas activas */}
                    {workplace.smartQuestions.currentSuggestions.length === 0 && 
                     workplace.smartQuestions.preparationQuestions.length === 0 && (
                      <div className="p-4 bg-[#A8E6CF]/10 rounded-lg border border-[#A8E6CF]/20">
                        <div className="w-8 h-8 bg-[#A8E6CF]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-4 h-4 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <p className="text-sm text-[#2C3E50]/60 text-center mb-3">
                          La IA analizará la conversación y sugerirá preguntas relevantes
                        </p>
                        
                        {/* Preguntas de ejemplo para demostración */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-[#2C3E50] mb-2">Preguntas de ejemplo (habla para activar IA):</h5>
                          {[
                            '¿Cómo ha evolucionado el dolor desde la última sesión?',
                            '¿Ha realizado los ejercicios en casa regularmente?',
                            '¿Qué actividades le generan más molestias?'
                          ].map((question, index) => (
                            <div key={index} className="flex items-start space-x-2 p-2 bg-white/50 rounded text-xs">
                              <span className="text-[#5DA5A3] font-medium">•</span>
                              <span className="text-[#2C3E50]/70 flex-1">{question}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {workplace.session.status === 'PROCESSING' && (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h4 className="text-lg font-medium text-[#2C3E50] mb-2">Procesando Transcripción</h4>
                    <p className="text-sm text-[#2C3E50]/60">
                      {workplace.soapGeneration.isGenerating ? 'Generando nota SOAP...' : 'Analizando entidades clínicas...'}
                    </p>
                  </div>
                )}

                {workplace.session.status === 'COMPLETED' && workplace.session.entities.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-[#A8E6CF]/10 rounded-lg">
                        <div className="text-lg font-bold text-[#5DA5A3]">{workplace.session.entities.length}</div>
                        <div className="text-xs text-[#2C3E50]/60">Entidades</div>
                      </div>
                      <div className="text-center p-3 bg-[#A8E6CF]/10 rounded-lg">
                        <div className="text-lg font-bold text-[#5DA5A3]">
                          {Math.floor(workplace.soapGeneration.confidence * 100)}%
                        </div>
                        <div className="text-xs text-[#2C3E50]/60">Confianza</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-[#2C3E50]">Entidades Detectadas</h4>
                      {workplace.session.entities.map((entity, index) => (
                        <div key={entity.id} className="flex items-center justify-between p-2 bg-[#F7F7F7] rounded">
                          <div className="flex items-center space-x-2">
                            <span 
                              className={`w-2 h-2 rounded-full ${
                                entity.type === 'SYMPTOM' ? 'bg-[#FF6F61]' :
                                entity.type === 'ANATOMY' ? 'bg-[#5DA5A3]' :
                                entity.type === 'TREATMENT' ? 'bg-[#A8E6CF]' :
                                'bg-[#BDC3C7]'
                              }`}
                            ></span>
                            <span className="text-sm text-[#2C3E50] capitalize">{entity.text}</span>
                            <span className="text-xs text-[#2C3E50]/50 uppercase">{entity.type}</span>
                          </div>
                          <span className="text-xs text-[#5DA5A3] font-medium">
                            {Math.floor(entity.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {workplace.session.entities.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-[#2C3E50]/60">
                          No se detectaron entidades clínicas en la transcripción.
                        </p>
                        <p className="text-xs text-[#2C3E50]/50 mt-1">
                          Intente hablar más claramente sobre síntomas, anatomía o tratamientos.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {workplace.activeListening.error && (
                  <div className="p-4 bg-[#FF6F61]/10 rounded-lg border-l-4 border-[#FF6F61]">
                    <h4 className="font-medium text-[#FF6F61] mb-2">Error de Transcripción</h4>
                    <p className="text-sm text-[#2C3E50]/80 mb-3">
                      {workplace.activeListening.error}
                    </p>
                    {workplace.activeListening.error.includes('micrófono') && (
                      <div className="text-xs text-[#2C3E50]/60 space-y-1">
                        <p>• Asegúrese de permitir el acceso al micrófono</p>
                        <p>• Verifique que el micrófono esté conectado</p>
                        <p>• Intente recargar la página si el problema persiste</p>
                      </div>
                    )}
                  </div>
                )}

                {workplace.session.status === 'READY' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#A8E6CF]/10 rounded-lg border-l-4 border-[#5DA5A3]">
                      <h4 className="font-medium text-[#2C3E50] mb-2">Captura de Audio Real</h4>
                      <p className="text-sm text-[#2C3E50]/80 mb-3">
                        El sistema capturará y transcribirá automáticamente la conversación entre fisioterapeuta y paciente.
                      </p>
                      <div className="text-xs text-[#2C3E50]/60 space-y-1">
                        <p>• Se solicitará acceso al micrófono al iniciar</p>
                        <p>• La transcripción aparecerá en tiempo real</p>
                        <p>• Compatible con reconocimiento de voz en español</p>
                        <p>• Hable claramente y cerca del micrófono para mejor calidad</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#FF6F61]/10 rounded-lg border-l-4 border-[#FF6F61]">
                      <h4 className="font-medium text-[#FF6F61] mb-2">Consejos para Mejor Transcripción</h4>
                      <div className="text-xs text-[#2C3E50]/70 space-y-1">
                        <p>• Use Chrome o Edge para mejor compatibilidad</p>
                        <p>• Asegúrese de tener conexión a internet estable</p>
                        <p>• Evite ruido de fondo excesivo</p>
                        <p>• Hable con claridad y pausas naturales</p>
                        <p>• Permita acceso al micrófono cuando se solicite</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Asistente Clínico */}
          <div className="lg:col-span-1 space-y-6">
            <ClinicalAssistantPanel
              patient={patient}
              entities={workplace.session.entities}
              analysisResult={workplace.session.clinicalAnalysis || null}
              isAnalyzing={workplace.clinicalAssistant.isAnalyzing}
              onSuggestionAccepted={handleSuggestionAccepted}
              onSuggestionDismissed={handleSuggestionDismissed}
              onTestCompleted={handleTestCompleted}
              onSOAPEnhancement={handleSOAPEnhancement}
            />
          </div>

          {/* Panel SOAP Dinámico (solo cuando está completado) */}
          {workplace.session.status === 'COMPLETED' && (
            <div className="lg:col-span-1 space-y-6">
              <DynamicSOAPEditor
                initialSOAP={workplace.soapGeneration.result ? {
                  subjective: workplace.soapGeneration.result.subjetivo,
                  objective: workplace.soapGeneration.result.objetivo,
                  assessment: workplace.soapGeneration.result.evaluacion,
                  plan: workplace.soapGeneration.result.plan
                } : undefined}
                acceptedSuggestions={workplace.session.acceptedSuggestions}
                completedTests={workplace.session.completedTests}
                onSOAPChange={handleSOAPChange}
                onSuggestionApplied={handleSuggestionApplied}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientCompletePage;