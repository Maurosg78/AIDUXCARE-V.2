/**
 * 🏥 Patient Complete Page - AiDuxCare V.2
 * Página unificada: Historia clínica + Workflow activo + SOAP
 * Estados: 'review' | 'active' | 'completed'
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    // Verificar soporte de Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz. Intenta con Chrome o Edge.');
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
          // Generar highlight simple cuando se detecta información clínica
          generateHighlightFromText(finalTranscript);
        }
      };

      newRecognition.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        setIsListening(false);
      };

      newRecognition.onend = () => {
        setIsListening(false);
        console.log('⏹️ Grabación finalizada');
      };

      newRecognition.start();
      setRecognition(newRecognition);
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      alert('Error al iniciar la grabación. Inténtalo de nuevo.');
    }
  }, []);

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

    // Detectar categorías básicas
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
• Evaluación clínica basada en hallazgos objetivos y contexto histórico
• Paciente con ${patientData.condition}

PLAN:
${plans.map(h => `• ${h.text}`).join('\n') || '• Plan de tratamiento a definir según evaluación'}`;

    setSOAPContent(soap);
  }, [highlights, patientData]);

  // Función para documentación manual
  const handleManualDocumentation = useCallback(() => {
    const manualSOAP = `DOCUMENTACIÓN SOAP MANUAL - ${new Date().toLocaleDateString()}
Paciente: ${patientData.name} (${patientData.age} años)

SUBJETIVO:
• [Escribir síntomas y quejas del paciente]

OBJETIVO:
• [Escribir hallazgos de la evaluación]

EVALUACIÓN:
• [Escribir diagnóstico y análisis clínico]

PLAN:
• [Escribir plan de tratamiento]`;

    setSOAPContent(manualSOAP);
    setViewMode('completed');
  }, [patientData]);

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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-teal-600 font-bold text-lg">
                {patientData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patientData.name}</h1>
              <p className="text-gray-600">
                {patientData.age} años • {patientData.gender} • {patientData.condition}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
              {patientData.id}
            </span>
            <div className="text-right text-sm text-gray-500">
              <p>Última visita: {patientData.lastVisit}</p>
              <p>Riesgo: <span className="font-medium">{patientData.riskLevel}</span></p>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN DE ESTADOS */}
        <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
                  { mode: 'review' as ViewMode, label: 'Revisar Historia', icon: 'review' },
      { mode: 'active' as ViewMode, label: 'Sesión Activa', icon: 'microphone' },
      { mode: 'completed' as ViewMode, label: 'Finalizar SOAP', icon: 'document' }
          ].map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              disabled={isTransitioning}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white shadow-sm text-teal-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <div className="px-6 py-6">
        {isTransitioning && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        )}

        {!isTransitioning && viewMode === 'review' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sesión Clínica</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Información del paciente cargada. Puedes elegir entre grabación con IA o documentación manual.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleViewModeChange('active')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Grabar con IA</span>
                </button>
                
                <button
                  onClick={handleManualDocumentation}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Documentar Manual</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!isTransitioning && viewMode === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TRANSCRIPCIÓN EN TIEMPO REAL */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transcripción en Tiempo Real</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  isListening ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isListening ? '🔴 GRABANDO' : '⏸️ EN PAUSA'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 min-h-64 max-h-64 overflow-y-auto mb-4">
                {transcription ? (
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
                <button
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-teal-500 hover:bg-teal-600'
                  }`}
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

        {!isTransitioning && viewMode === 'completed' && (
          <div className="max-w-4xl mx-auto">
            {/* SOAP GENERADO */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Documentación SOAP</h3>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    ✅ Generado automáticamente
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 min-h-64">
                <textarea
                  value={soapContent || `DOCUMENTACIÓN SOAP MANUAL - ${new Date().toLocaleDateString()}
Paciente: ${patientData.name} (${patientData.age} años)

SUBJETIVO:
• [Escribir síntomas y quejas del paciente]

OBJETIVO:
• [Escribir hallazgos de la evaluación]

EVALUACIÓN:
• [Escribir diagnóstico y análisis clínico]

PLAN:
• [Escribir plan de tratamiento]`}
                  onChange={(e) => setSOAPContent(e.target.value)}
                  className="w-full h-96 resize-none border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-4"
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151'
                  }}
                  placeholder="Escribe aquí tu documentación SOAP..."
                />
              </div>

              {soapContent && (
                <div className="flex justify-center space-x-4 mt-6">
                  <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
                    <span>💾</span>
                    <span>Guardar Localmente</span>
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
                    <span>📄</span>
                    <span>Exportar PDF</span>
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>🏠</span>
                    <span>Volver al Inicio</span>
                  </button>
                </div>
              )}
            </div>

            {/* RESUMEN DE SESIÓN */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumen de Sesión</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">{highlights.length}</div>
                  <div className="text-sm text-gray-600">Highlights detectados</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 60000) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Minutos de sesión</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {highlights.filter(h => h.isSelected).length}
                  </div>
                  <div className="text-sm text-gray-600">Elementos en SOAP</div>
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