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

// ========= COMPONENTE PRINCIPAL =========

export const PatientCompletePage: React.FC = () => {
  const navigate = useNavigate();

  // ========= ESTADO PRINCIPAL =========
  const [viewMode, setViewMode] = useState<ViewMode>('review');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ========= DATOS DEL PACIENTE =========
  const [patientData] = useState<PatientData>({
    id: "P-2024-0342",
    name: "Ana María Rodríguez Silva",
    age: 52,
    gender: "F",
    condition: "Lumbalgia crónica + Cervicalgia",
    lastVisit: "2024-01-15",
    riskLevel: "medio",
    allergies: ["AINEs sistémicos", "Penicilina"],
    medications: [
      {
        name: "Paracetamol",
        dosage: "1000mg",
        frequency: "8h si dolor",
        prescribedBy: "Dr. García (Traumatología)",
        status: "activo",
        interactions: []
      },
      {
        name: "Omeprazol",
        dosage: "20mg", 
        frequency: "1/día en ayunas",
        prescribedBy: "Dr. Martín (MAP)",
        status: "activo",
        interactions: ["Puede afectar absorción de B12"]
      }
    ],
    clinicalHistory: "Lumbalgia crónica L4-L5 con radiculopatía bilateral desde hace 3 años. 12 sesiones previas con mejora funcional del 40%."
  });

  const [medicalAlerts] = useState<MedicalAlert[]>([
    {
      type: "alergia",
      description: "Alergia conocida a AINEs sistémicos (urticaria + disnea)",
      severity: "crítica",
      source: "Historia clínica 2022"
    },
    {
      type: "contraindicación",
      description: "Evitar manipulaciones cervicales por mareos frecuentes",
      severity: "importante",
      source: "Protocolo fisioterapia"
    },
    {
      type: "precaución",
      description: "Diabetes tipo 2 - monitorizar ejercicio intenso",
      severity: "moderada",
      source: "Comorbilidad activa"
    }
  ]);

  const [aiSuggestions] = useState<AISuggestion[]>([
    {
      id: "1",
      category: "evaluación",
      title: "Reevaluar rango articular lumbar",
      description: "Han pasado 2 semanas desde última medición. Evaluar mejora en flexión anterior.",
      priority: "alta",
      evidenceLevel: 92
    },
    {
      id: "2",
      category: "tratamiento", 
      title: "Progresión en ejercicios de estabilización",
      description: "Paciente tolera bien ejercicios actuales. Considerar incremento en resistencia.",
      priority: "media",
      evidenceLevel: 87
    }
  ]);

  // ========= ESTADO DE SESIÓN ACTIVA =========
  const [isListening, setIsListening] = useState(false);
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [soapContent, setSOAPContent] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

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
    setIsListening(true);
    
    // Simulación de highlights detectados en tiempo real
    setTimeout(() => {
      const mockHighlights: ClinicalHighlight[] = [
        {
          id: 'h1',
          text: 'Dolor lumbar irradiado hacia pierna derecha',
          category: 'síntoma',
          confidence: 0.95,
          timestamp: new Date().toISOString(),
          isSelected: false
        },
        {
          id: 'h2', 
          text: 'Limitación del ROM en flexión anterior 40°',
          category: 'hallazgo',
          confidence: 0.88,
          timestamp: new Date().toISOString(),
          isSelected: false
        },
        {
          id: 'h3',
          text: 'Test Lasègue positivo a 45°',
          category: 'hallazgo',
          confidence: 0.92,
          timestamp: new Date().toISOString(),
          isSelected: false
        }
      ];
      
      setHighlights(mockHighlights);
    }, 3000);
  }, []);

  const handleStopListening = useCallback(() => {
    setIsListening(false);
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
            { mode: 'review' as ViewMode, label: '📋 Revisar Historia', icon: '📋' },
            { mode: 'active' as ViewMode, label: '🎙️ Sesión Activa', icon: '🎙️' },
            { mode: 'completed' as ViewMode, label: '💾 Finalizar SOAP', icon: '💾' }
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* HISTORIA CLÍNICA */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Historia Clínica</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Diagnóstico Principal</h4>
                  <p className="text-gray-600 text-sm">{patientData.clinicalHistory}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Alergias</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientData.allergies.map((allergy, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MEDICACIÓN ACTUAL */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💊 Medicación Actual</h3>
              <div className="space-y-3">
                {patientData.medications.map((med, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{med.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        med.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {med.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                    <p className="text-xs text-gray-500">{med.prescribedBy}</p>
                    {med.interactions.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                        ⚠️ {med.interactions.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ALERTAS MÉDICAS */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alertas Médicas</h3>
              <div className="space-y-3">
                {medicalAlerts.map((alert, i) => (
                  <div 
                    key={i}
                    className="border-l-4 pl-3 py-2"
                    style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 capitalize">{alert.type}</span>
                      <span 
                        className="px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.source}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SUGERENCIAS IA */}
            <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🤖 Sugerencias Pre-Sesión IA</h3>
                <span className="text-sm text-gray-500">Confianza promedio: 89%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className="px-2 py-1 rounded-full text-xs text-white font-medium"
                        style={{ backgroundColor: getCategoryColor(suggestion.category) }}
                      >
                        {suggestion.category}
                      </span>
                      <span className="text-xs text-gray-500">{suggestion.evidenceLevel}% confianza</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleViewModeChange('active')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <span>🎙️</span>
                  <span>Iniciar Escucha Activa</span>
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
                <h3 className="text-lg font-semibold text-gray-900">🎙️ Transcripción en Tiempo Real</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  isListening ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isListening ? '🔴 GRABANDO' : '⏸️ EN PAUSA'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 min-h-64 max-h-64 overflow-y-auto mb-4">
                {isListening ? (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">FT</div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Fisioterapeuta • {new Date().toLocaleTimeString()}</div>
                        <p className="text-sm bg-white p-2 rounded-lg shadow-sm">
                          "Buenos días Ana María, hoy vamos a trabajar en ejercicios específicos para su región lumbar..."
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">PC</div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Paciente • {new Date().toLocaleTimeString()}</div>
                        <p className="text-sm bg-white p-2 rounded-lg shadow-sm">
                          "Me siento mejor que la semana pasada, pero aún tengo dolor cuando me inclino hacia adelante..."
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">Transcribiendo...</span>
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
                <h3 className="text-lg font-semibold text-gray-900">✨ Highlights Detectados</h3>
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
                <h3 className="text-lg font-semibold text-gray-900">📋 Documentación SOAP</h3>
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
                {soapContent ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 leading-relaxed">
                    {soapContent}
                  </pre>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p className="text-lg font-medium mb-2">SOAP pendiente de generación</p>
                    <p className="text-sm">Selecciona highlights y genera la documentación</p>
                  </div>
                )}
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