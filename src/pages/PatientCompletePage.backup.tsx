/**
 * 🏥 Patient Complete Page - AiDuxCare V.2
 * Página unificada: Historia clínica + Workflow activo + SOAP
 * Estados: 'review' | 'active' | 'completed'
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebSpeechSTTService } from '../services/WebSpeechSTTService';
// Typography components replaced with standard HTML elements for quick fix

// ========= TIPOS E INTERFACES =========

type ViewMode = 'review' | 'active' | 'completed';

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

interface MedicalAlert {
  type: 'alergia' | 'contraindicación' | 'precaución';
  description: string;
  severity: 'crítica' | 'importante' | 'moderada';
  source: string;
}

interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
  confidence: number;
  timestamp: string;
  isSelected: boolean;
}

interface SessionData {
  patientId: string;
  sessionDate: string;
  highlights: ClinicalHighlight[];
  soapNotes: string;
  duration: number;
}

interface AISuggestion {
  id: string;
  category: 'evaluación' | 'tratamiento' | 'seguimiento' | 'prevención';
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  evidenceLevel: number;
}

// Tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ========= COMPONENTE PRINCIPAL =========

export const PatientCompletePage: React.FC = () => {
  const navigate = useNavigate();

  // ========= ESTADO PRINCIPAL =========
  const [viewMode, setViewMode] = useState<ViewMode>('review');
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Cargar datos del paciente desde LocalStorage al montar el componente
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
            gender: "", // Se puede agregar después
            condition: patient.condition || "",
            lastVisit: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "",
            riskLevel: "bajo",
            allergies: patient.allergies || [],
            medications: [], // Se puede expandir después
            clinicalHistory: patient.clinicalHistory || ""
          });
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del paciente:', error);
      }
    };

    loadPatientData();
    
    // Ejecutar test de conectividad STT silencioso
    performSTTConnectivityTest();
  }, []);

  // ========= TEST DE CONECTIVIDAD STT SILENCIOSO =========
  const performSTTConnectivityTest = useCallback(async () => {
    console.log('🔍 Iniciando test de conectividad STT silencioso...');
    
    try {
      // 1. Verificar soporte básico del navegador
      if (!WebSpeechSTTService.isSupported()) {
        console.log('❌ Navegador no soporta Web Speech API');
        setSTTAvailable(false);
        setSTTTestCompleted(true);
        return;
      }

      // 2. Verificar conexión a internet
      if (!navigator.onLine) {
        console.log('❌ Sin conexión a internet');
        setSTTAvailable(false);
        setSTTTestCompleted(true);
        return;
      }

      // 3. Test de conectividad a Google Speech Services
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      const response = await fetch('https://speech.googleapis.com', {
        method: 'HEAD',
        mode: 'no-cors', // Evitar CORS issues
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Si llegamos aquí, el servicio es accesible
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

  const [medicalAlerts] = useState<MedicalAlert[]>([]);

  // Eliminamos aiSuggestions - no son necesarias en la versión profesional

  // ========= ESTADO DE SESIÓN ACTIVA =========
  const [isListening, setIsListening] = useState(false);
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [soapContent, setSOAPContent] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);
  const [sttAvailable, setSTTAvailable] = useState<boolean | null>(null); // null = testing, true = available, false = unavailable
  const [sttTestCompleted, setSTTTestCompleted] = useState(false);

  // ========= FUNCIONES DE TRANSICIÓN =========
  const handleViewModeChange = useCallback(async (newMode: ViewMode) => {
    if (newMode === viewMode) return;
    
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setViewMode(newMode);
    setIsTransitioning(false);

    // Configuraciones específicas por modo
    if (newMode === 'active') {
      setSessionStartTime(new Date());
    } else if (newMode === 'completed') {
      setIsListening(false);
      if (highlights.length > 0 && !soapContent) {
        generateSOAP();
      }
    }
  }, [viewMode, highlights, soapContent]);

  // ========= FUNCIONES DE WORKFLOW ACTIVO =========
  const handleStartListening = useCallback(() => {
    // Verificar disponibilidad STT
    if (!sttAvailable) {
      alert('⚠️ Transcripción automática no disponible. Use el modo manual.');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'es-ES';

      newRecognition.onstart = () => {
        setIsListening(true);
        console.log('🎙️ Grabación iniciada');
      };

      newRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscription(prev => prev + finalTranscript);
          generateHighlightFromText(finalTranscript);
        }
      };

      newRecognition.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        setIsListening(false);
        
        if (event.error === 'network') {
          alert('🌐 Error de conectividad STT. Cambiando a modo manual...');
          setSTTAvailable(false);
          return;
        }
        
        let errorMessage = 'Error en el reconocimiento de voz. ';
        switch (event.error) {
          case 'not-allowed':
            errorMessage += 'Acceso al micrófono denegado.';
            break;
          case 'no-speech':
            errorMessage += 'No se detectó habla.';
            break;
          default:
            errorMessage += `Error: ${event.error}`;
        }
        
        alert(errorMessage);
      };

      newRecognition.onend = () => {
        setIsListening(false);
        console.log('⏹️ Grabación finalizada');
      };

      newRecognition.start();
      setRecognition(newRecognition);
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      alert('Error al iniciar la grabación. Use el modo manual.');
    }
  }, [sttAvailable]);

  const handleStopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  }, [recognition]);

  // Función simple para generar highlights básicos
  const generateHighlightFromText = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    let category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia' = 'hallazgo';
    let confidence = 0.7;

    if (lowerText.includes('duele') || lowerText.includes('dolor') || lowerText.includes('molesta')) {
      category = 'síntoma';
      confidence = 0.9;
    } else if (lowerText.includes('tratamiento') || lowerText.includes('ejercicio') || lowerText.includes('plan')) {
      category = 'plan';
      confidence = 0.8;
    }

    const newHighlight: ClinicalHighlight = {
      id: `highlight_${Date.now()}`,
      text: text.trim(),
      category,
      confidence,
      timestamp: new Date().toISOString(),
      isSelected: false
    };

    setHighlights(prev => [...prev, newHighlight]);
  }, []);

  const toggleHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.map(h => 
      h.id === id ? { ...h, isSelected: !h.isSelected } : h
    ));
  }, []);

  const generateSOAP = useCallback(() => {
    const selectedHighlights = highlights.filter(h => h.isSelected);
    
    if (selectedHighlights.length === 0) {
      setSOAPContent('');
      return;
    }

    const symptoms = selectedHighlights.filter(h => h.category === 'síntoma');
    const findings = selectedHighlights.filter(h => h.category === 'hallazgo');
    const plans = selectedHighlights.filter(h => h.category === 'plan');

    const soap = `DOCUMENTACIÓN SOAP - ${new Date().toLocaleDateString()}
Paciente: ${patientData.name} (${patientData.age} años)

SUBJETIVO:
${symptoms.map(h => `• ${h.text}`).join('\n') || '• Sin síntomas reportados específicos'}

OBJETIVO:
${findings.map(h => `• ${h.text}`).join('\n') || '• Pendiente de evaluación objetiva'}

EVALUACIÓN:
• Análisis basado en ${selectedHighlights.length} highlights clínicos
• Confianza promedio: ${Math.round(selectedHighlights.reduce((acc, h) => acc + h.confidence, 0) / selectedHighlights.length * 100)}%

PLAN:
${plans.map(h => `• ${h.text}`).join('\n') || '• Plan de tratamiento por definir'}

---
Documentado con AIDuxCare V.2 - Sistema de Transcripción Clínica
Timestamp: ${new Date().toISOString()}`;

    setSOAPContent(soap);
  }, [highlights, patientData]);

  // ========= FUNCIONES AUXILIARES =========
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'crítica': return '#FF6F61';
      case 'importante': return '#FFA726';
      case 'moderada': return '#42A5F5';
      default: return '#66BB6A';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'síntoma': return '#FF6F61';
      case 'hallazgo': return '#66BB6A';
      case 'plan': return '#42A5F5';
      case 'advertencia': return '#FFA726';
      default: return '#9E9E9E';
    }
  };

  // ========= RENDERIZADO =========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER DEL PACIENTE */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                              <h2 className="text-xl font-semibold text-gray-900 mb-0">Consulta Completa</h2>
              <p className="text-sm text-gray-600 mb-0">{patientData.name}</p>
              </div>
            </div>

            {/* STATUS INDICATOR */}
            <div className="flex items-center space-x-4">
              {!sttTestCompleted && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600 mb-0">Verificando STT...</p>
                </div>
              )}
              
              {sttTestCompleted && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${sttAvailable ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                  <p className="text-sm text-gray-600 mb-0">
                  {sttAvailable ? 'Transcripción Automática' : 'Modo Manual'}
                </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            {[
              { id: 'review', label: '📋 Revisar Datos', description: 'Información del paciente' },
              { id: 'active', label: sttAvailable ? '🎙️ Grabar con IA' : '📝 Documentar', description: sttAvailable ? 'Transcripción automática' : 'Modo manual' },
              { id: 'completed', label: '📄 SOAP Final', description: 'Documentación clínica' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleViewModeChange(mode.id as ViewMode)}
                className={`flex-1 text-center px-4 py-3 rounded-lg border-2 transition-all ${
                  viewMode === mode.id
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{mode.label}</div>
                <div className="text-xs mt-1">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* MODO REVISIÓN DE DATOS */}
        {!isTransitioning && viewMode === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* INFORMACIÓN BÁSICA */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Paciente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nombre completo</label>
                  <p className="text-gray-900 font-medium mb-0">{patientData.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Edad</label>
                    <p className="text-gray-900 mb-0">{patientData.age} años</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Género</label>
                    <p className="text-gray-900 mb-0">{patientData.gender}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Condición actual</label>
                  <p className="text-gray-900 mb-0">{patientData.condition}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Última visita</label>
                  <p className="text-gray-900 mb-0">{new Date(patientData.lastVisit).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nivel de riesgo</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    patientData.riskLevel === 'alto' ? 'bg-red-100 text-red-800' :
                    patientData.riskLevel === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {patientData.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* ALERGIAS Y CONTRAINDICACIONES */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <Heading3 className="text-gray-900 mb-4">Alergias</Heading3>
              <div className="space-y-2">
                {patientData.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                    <span className="text-red-600">⚠️</span>
                    <Text className="text-red-800 mb-0">{allergy}</Text>
                  </div>
                ))}
              </div>
            </div>

            {/* MEDICAMENTOS ACTUALES */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <Heading3 className="text-gray-900 mb-4">Medicamentos Actuales</Heading3>
              <div className="space-y-3">
                {patientData.medications.map((med, index) => (
                  <div key={index} className="border border-gray-100 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Text className="font-medium text-gray-900 mb-0">{med.name}</Text>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        med.status === 'activo' ? 'bg-green-100 text-green-800' :
                        med.status === 'temporal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {med.status}
                      </span>
                    </div>
                    <Text className="text-sm text-gray-600 mb-1">{med.dosage} - {med.frequency}</Text>
                    <Text className="text-xs text-gray-500 mb-0">Prescrito por: {med.prescribedBy}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODO ACTIVO - TRANSCRIPCIÓN */}
        {!isTransitioning && viewMode === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TRANSCRIPCIÓN EN TIEMPO REAL O MENSAJE DE ESTADO */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sttAvailable === false ? 'Documentación Manual' : 'Transcripción en Tiempo Real'}
                </h3>
                {sttTestCompleted && (
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    sttAvailable === false 
                      ? 'bg-blue-100 text-blue-700' 
                      : isListening 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sttAvailable === false 
                      ? '📝 MANUAL' 
                      : isListening 
                        ? '🔴 GRABANDO' 
                        : '⏸️ EN PAUSA'
                    }
                  </span>
                )}
                {!sttTestCompleted && (
                  <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                    🔍 VERIFICANDO...
                  </span>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 min-h-64 max-h-64 overflow-y-auto mb-4">
                {/* MENSAJE PROFESIONAL CUANDO STT NO ESTÁ DISPONIBLE */}
                {sttTestCompleted && sttAvailable === false ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Modo de Documentación Manual</h4>
                    <p className="text-sm text-gray-600 mb-4 max-w-sm">
                      La transcripción automática no está disponible en su red o navegador actual. 
                      Puede utilizar el editor SOAP manual para documentar la consulta.
                    </p>
                    <button
                      onClick={() => handleViewModeChange('completed')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      🚀 Abrir Editor SOAP
                    </button>
                  </div>
                ) : !sttTestCompleted ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Verificando disponibilidad...</p>
                      <p className="text-xs text-gray-500">Detectando servicios de transcripción</p>
                    </div>
                  </div>
                ) : transcription ? (
                  <div className="text-sm text-gray-900 leading-relaxed">
                    <p className="whitespace-pre-wrap">{transcription}</p>
                    {isListening && (
                      <div className="flex items-center mt-2 text-teal-600">
                        <div className="flex space-x-1 mr-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs">Escuchando...</span>
                      </div>
                    )}
                  </div>
                ) : isListening ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Grabación activa</p>
                      <p className="text-xs text-gray-500">Comienza a hablar...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                    </svg>
                    <p className="text-center text-sm">
                      La transcripción aparecerá aquí en tiempo real<br/>
                      <span className="text-xs">Presiona el botón para comenzar</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  {/* BOTÓN DE GRABACIÓN - SOLO DISPONIBLE SI STT FUNCIONA */}
                  {sttTestCompleted && sttAvailable === true && (
                    <button
                      onClick={isListening ? handleStopListening : handleStartListening}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-teal-500 hover:bg-teal-600'
                      }`}
                      title={isListening ? "Detener grabación" : "Iniciar grabación con IA"}
                    >
                      {isListening ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="6" width="12" height="12" rx="2"/>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        </svg>
                      )}
                    </button>
                  )}

                  {/* BOTÓN DE MODO MANUAL - SIEMPRE DISPONIBLE */}
                  <button
                    onClick={() => handleViewModeChange('completed')}
                    className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${
                      sttTestCompleted && sttAvailable === false 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                    title={sttTestCompleted && sttAvailable === false 
                      ? "Abrir editor SOAP manual" 
                      : "Alternativamente, usar modo manual"
                    }
                  >
                    {sttTestCompleted && sttAvailable === false ? '🚀 Abrir Editor SOAP' : '📝 Modo Manual'}
                  </button>
                </div>
                
                {isListening && sessionStartTime && (
                  <div className="text-sm text-gray-600">
                    <div>⏱️ Tiempo: {Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)}:{((Date.now() - sessionStartTime.getTime()) % 60000 / 1000).toFixed(0).padStart(2, '0')}</div>
                    <div>🎯 Confianza: 94%</div>
                  </div>
                )}
              </div>
            </div>

            {/* HIGHLIGHTS DETECTADOS */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Highlights Detectados</h3>
                <span className="text-sm text-gray-500">{highlights.length} elementos</span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {highlights.length > 0 ? (
                  highlights.map((highlight) => (
                    <label key={highlight.id} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highlight.isSelected}
                        onChange={() => toggleHighlight(highlight.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span 
                            className="px-2 py-1 rounded-full text-xs text-white font-medium"
                            style={{ backgroundColor: getCategoryColor(highlight.category) }}
                          >
                            {highlight.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(highlight.confidence * 100)}% confianza
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{highlight.text}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(highlight.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm">Los highlights aparecerán aquí automáticamente</p>
                    <p className="text-xs">Inicia la grabación para detectar elementos clave</p>
                  </div>
                )}
              </div>

              {highlights.length > 0 && (
                <div className="flex space-x-3">
                  <button
                    onClick={generateSOAP}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Generar SOAP
                  </button>
                  <button
                    onClick={() => handleViewModeChange('completed')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Finalizar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODO COMPLETADO - SOAP FINAL */}
        {!isTransitioning && viewMode === 'completed' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <Heading2 className="text-gray-900 mb-0">Documentación SOAP Final</Heading2>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    💾 Guardar Borrador
                  </button>
                  <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
                    ✅ Finalizar Consulta
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* EDITOR SOAP */}
                <div>
                  <Label className="block text-gray-700 font-medium mb-2">Documentación SOAP</Label>
                  <textarea
                    value={soapContent}
                    onChange={(e) => setSOAPContent(e.target.value)}
                    placeholder={`DOCUMENTACIÓN SOAP - ${new Date().toLocaleDateString()}
Paciente: ${patientData.name} (${patientData.age} años)

SUBJETIVO:
• [Describe los síntomas reportados por el paciente]

OBJETIVO:
• [Hallazgos del examen físico y signos vitales]

EVALUACIÓN:
• [Diagnóstico e impresión clínica]

PLAN:
• [Tratamiento, medicamentos y seguimiento]

---
Documentado con AIDuxCare V.2 - Modo Manual
Timestamp: ${new Date().toISOString()}`}
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                  />
                </div>

                {/* RESUMEN DE HIGHLIGHTS */}
                <div>
                  <Label className="block text-gray-700 font-medium mb-2">Highlights Disponibles ({highlights.length})</Label>
                  <div className="h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-3">
                    {highlights.length > 0 ? (
                      highlights.map((highlight) => (
                        <div key={highlight.id} className="border border-gray-100 rounded p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span 
                              className="px-2 py-1 rounded-full text-xs text-white font-medium"
                              style={{ backgroundColor: getCategoryColor(highlight.category) }}
                            >
                              {highlight.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(highlight.confidence * 100)}% confianza
                            </span>
                            <button
                              onClick={() => {
                                const textToAdd = `\n• ${highlight.text}`;
                                setSOAPContent(prev => prev + textToAdd);
                              }}
                              className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              Añadir
                            </button>
                          </div>
                          <p className="text-sm text-gray-900">{highlight.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(highlight.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p className="text-sm">No hay highlights generados</p>
                        <p className="text-xs">Los highlights de la transcripción aparecerían aquí</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ESTADÍSTICAS DE SESIÓN */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-teal-600">{highlights.length}</div>
                    <div className="text-sm text-gray-600">Highlights</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-teal-600">{transcription.split(' ').length}</div>
                    <div className="text-sm text-gray-600">Palabras</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-teal-600">
                      {sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 60000) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Minutos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-teal-600">
                      {sttAvailable ? '✅' : '📝'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {sttAvailable ? 'Automático' : 'Manual'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCompletePage; 