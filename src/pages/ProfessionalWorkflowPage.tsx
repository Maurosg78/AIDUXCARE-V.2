/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout rediseñado según wireframe proporcionado
 */

import React, { useState } from 'react';

// 1. Tipos estrictos para respuesta del backend
interface BackendAnalysisResponse {
  highlights: Array<{
    id: string;
    text: string;
    category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
    confidence: number;
  }>;
  warnings: Array<{
    id: string;
    type: 'legal' | 'iatrogénica' | 'contraindicación';
    description: string;
    severity: 'alta' | 'media' | 'baja';
  }>;
  facts: Array<string>;
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  condition: string;
  allergies: string[];
  previousTreatments: string[];
  medications: string[];
  clinicalHistory: string;
}

interface HighlightItem {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
  confidence: number;
  isSelected: boolean;
}

interface LegalWarning {
  id: string;
  type: 'legal' | 'iatrogénica' | 'contraindicación';
  description: string;
  severity: 'alta' | 'media' | 'baja';
  isAccepted: boolean;
}

export const ProfessionalWorkflowPage: React.FC = () => {
  // Estado principal
  const [isListening, setIsListening] = useState(false);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [legalWarnings, setLegalWarnings] = useState<LegalWarning[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Nuevo estado para layout de 3 pestañas
  const [activeTab, setActiveTab] = useState<'collection' | 'evaluation' | 'soap'>('collection');
  const [transcription, setTranscription] = useState('');
  const [consultationData, setConsultationData] = useState({
    patientInfo: { name: '', age: 0, gender: '', occupation: '' },
    symptoms: [] as string[],
    medicalHistory: [] as string[],
    currentMedication: [] as string[],
    allergies: [] as string[],
    redFlags: [] as string[],
    clinicalTests: [] as Array<{ name: string; result: string; notes: string }>,
    painAnatomy: [] as Array<{ region: string; intensity: number; type: string; radiation: string }>,
    soapData: { subjective: '', objective: '', assessment: '', plan: '' }
  });

  // Datos del paciente
  const [patientData] = useState<PatientData>({
    id: 'FT-2025-001',
    name: 'María González Rodríguez',
    age: 45,
    condition: 'Lumbalgia crónica L4-L5',
    allergies: ['AINEs', 'Penicilina'],
    previousTreatments: ['Fisioterapia manual', 'Electroterapia', 'Ejercicio terapéutico'],
    medications: ['Tramadol 50mg', 'Omeprazol 20mg'],
    clinicalHistory: 'Cirugía discectomía L4-L5 (2023), Diabetes tipo 2 controlada'
  });

  const handleStartListening = () => {
    setIsListening(true);
    
    // Simulación de transcripción en tiempo real
    setTimeout(() => {
      setTranscription('Paciente refiere dolor lumbar de 3 meses de evolución...');
    }, 2000);
    
    // Simulación de highlights detectados
    setTimeout(() => {
      setHighlights([
        { id: '1', text: 'Dolor lumbar irradiado', category: 'síntoma', confidence: 0.95, isSelected: false },
        { id: '2', text: 'Limitación flexión', category: 'hallazgo', confidence: 0.88, isSelected: false },
        { id: '3', text: 'Test Lasègue positivo', category: 'hallazgo', confidence: 0.92, isSelected: false },
        { id: '4', text: 'Ejercicios de fortalecimiento', category: 'plan', confidence: 0.85, isSelected: false }
      ]);
      
      setLegalWarnings([
        { 
          id: '1', 
          type: 'contraindicación', 
          description: 'Paciente alérgico a AINEs - evitar antiinflamatorios', 
          severity: 'alta',
          isAccepted: false 
        },
        { 
          id: '2', 
          type: 'iatrogénica', 
          description: 'Diabetes - monitorear ejercicio intenso', 
          severity: 'media',
          isAccepted: false 
        }
      ]);
    }, 3000);
  };

  // 3. Función asíncrona para enviar transcripción al backend
  const analyzeTranscription = async (transcript: string) => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcript, patientId: patientData.id })
      });
      if (!res.ok) throw new Error('Error en el análisis clínico');
      const data: BackendAnalysisResponse = await res.json();
      setHighlights(data.highlights.map(h => ({ ...h, isSelected: false })));
      setLegalWarnings(data.warnings.map(w => ({ ...w, isAccepted: false })));
      // Puedes poblar facts en otro estado si lo deseas
    } catch (err: unknown) {
      // setErrorAnalysis((err as Error).message || 'Error desconocido'); // This line was removed
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (transcription) {
      analyzeTranscription(transcription);
    }
  };

  const toggleHighlight = (id: string) => {
    setHighlights(prev => prev.map(item => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const acceptWarning = (id: string) => {
    setLegalWarnings(prev => prev.map(warning =>
      warning.id === id ? { ...warning, isAccepted: true } : warning
    ));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      
      {/* Navegación por Pestañas */}
      <div className="mx-4 mb-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'collection', label: 'Captura', icon: '🎤' },
              { id: 'evaluation', label: 'Evaluación', icon: '🔍' },
              { id: 'soap', label: 'SOAP Final', icon: '📝' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'collection' | 'evaluation' | 'soap')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Header del Paciente - Información Resumida */}
      <div className="mx-4 mb-6">
        {/* Barra Superior con Info Básica */}
        <div className="bg-white rounded-t-lg border-b-0 border p-4" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8E6CF' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                  {patientData.name}
                </h1>
                <p className="text-sm" style={{ color: '#7F8C8D' }}>
                  {patientData.age} años • {patientData.condition}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
                {patientData.id}
              </span>
              <button
                className="text-sm px-3 py-1 rounded-md border transition-colors hover:bg-gray-50"
                style={{ borderColor: '#BDC3C7', color: '#7F8C8D' }}
              >
                Ver Historia Completa
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Información Detallada */}
        <div className="bg-white rounded-b-lg border-t-0 border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna 1: Antecedentes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide pb-2 border-b" style={{ color: '#5DA5A3', borderColor: '#BDC3C7' }}>
                Antecedentes Clínicos
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1" style={{ color: '#2C3E50' }}>Historia Médica</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#7F8C8D' }}>
                    {patientData.clinicalHistory}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1" style={{ color: '#2C3E50' }}>Tratamientos Previos</h4>
                  <div className="space-y-1">
                    {patientData.previousTreatments.map((treatment, i) => (
                      <div key={i} className="flex items-center text-sm" style={{ color: '#7F8C8D' }}>
                        <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: '#A8E6CF' }}></div>
                        {treatment}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Medicación Actual */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide pb-2 border-b" style={{ color: '#5DA5A3', borderColor: '#BDC3C7' }}>
                Medicación Actual
              </h3>
              <div className="space-y-2">
                {patientData.medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#F7F7F7' }}>
                    <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>{med}</span>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#A8E6CF', color: '#2C3E50' }}>
                      Activo
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna 3: Alertas Médicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide pb-2 border-b" style={{ color: '#FF6F61', borderColor: '#BDC3C7' }}>
                Alertas Médicas
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border-l-4" style={{ backgroundColor: '#FFF5F4', borderLeftColor: '#FF6F61' }}>
                  <h4 className="font-medium text-sm mb-1" style={{ color: '#2C3E50' }}>Alergias</h4>
                  <div className="flex flex-wrap gap-1">
                    {patientData.allergies.map((allergy, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FF6F61', color: 'white' }}>
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
                  <p className="text-xs font-medium" style={{ color: '#2C3E50' }}>
                    ✓ Historia clínica revisada
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#5DA5A3' }}>
                    Última actualización: Hoy
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Contenido de Pestañas */}
      {activeTab === 'collection' && (
        <div className="mx-4 mb-6">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acto 1: La Anamnesis Aumentada</h3>
            <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
              El sistema actúa como un experto fisioterapeuta senior analizando la conversación mediante la &quot;Cascada de Análisis&quot;
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna A - Hechos Clave */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">A</span>
                  <span>Hechos Clave</span>
                  <span className="ml-2 text-sm font-normal" style={{ color: '#7F8C8D' }}>
                    (La Columna Vertebral del SOAP)
                  </span>
                </h4>
                
                <div className="space-y-3">
                  {loadingAnalysis && (
                    <div className="flex items-center text-blue-500 mb-4">
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" className="opacity-75" />
            </svg>
                      Analizando transcripción...
          </div>
                  )}
                  
            {highlights.map((highlight) => (
                    <label htmlFor={`highlight-${highlight.id}`} key={highlight.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50" style={{ borderColor: '#BDC3C7' }}>
                <input
                  id={`highlight-${highlight.id}`}
                  type="checkbox"
                  checked={highlight.isSelected}
                  onChange={() => toggleHighlight(highlight.id)}
                        className="mt-1 rounded"
                  style={{ accentColor: '#5DA5A3' }}
                />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                  <span 
                            className="font-medium px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: highlight.category === 'síntoma' ? '#FF6F61' : 
                                      highlight.category === 'hallazgo' ? '#A8E6CF' : '#5DA5A3',
                      color: highlight.category === 'síntoma' ? 'white' : '#2C3E50'
                    }}
                  >
                    {highlight.category}
                  </span>
                          <div className="text-xs" style={{ color: '#7F8C8D' }}>
                            {Math.round(highlight.confidence * 100)}% confianza
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: '#2C3E50' }}>{highlight.text}</p>
                      </div>
              </label>
            ))}
          </div>
              </div>

              {/* Columna B - Insights y Advertencias */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">B</span>
                  <span>Insights y Advertencias</span>
                  <span className="ml-2 text-sm font-normal" style={{ color: '#7F8C8D' }}>
                    (El Sistema de Alerta Temprana)
                  </span>
                </h4>
                
                <div className="space-y-4">
                  {/* Advertencias Legales */}
                  <div>
                    <h5 className="font-medium text-sm mb-3" style={{ color: '#FF6F61' }}>⚠️ Advertencias Legales</h5>
                    <div className="space-y-2">
                      {legalWarnings.map((warning) => (
                        <div key={warning.id} className="p-3 rounded-lg border-l-4" style={{ 
                          backgroundColor: warning.severity === 'alta' ? '#FFF5F4' : '#FEF9E7',
                          borderLeftColor: warning.severity === 'alta' ? '#FF6F61' : '#F39C12'
                        }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: '#2C3E50' }}>{warning.description}</p>
                              <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>
                                Tipo: {warning.type} • Severidad: {warning.severity}
                              </p>
                            </div>
                            {!warning.isAccepted && (
            <button
                                onClick={() => acceptWarning(warning.id)}
                                className="ml-2 px-2 py-1 rounded text-xs font-medium transition-colors"
                                style={{ backgroundColor: '#5DA5A3', color: 'white' }}
                              >
                                Aceptar
            </button>
          )}
        </div>
                        </div>
                      ))}
                    </div>
          </div>
          
                  {/* Botón de Grabación */}
                  <div className="text-center">
                    <button
                      onClick={isListening ? handleStopListening : handleStartListening}
                      className={`px-8 py-3 rounded-lg font-medium transition-all transform ${
                        isListening 
                          ? 'bg-red-500 hover:bg-red-600 text-white scale-105' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" strokeWidth="2"/>
                          </svg>
                          Detener Grabación
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                          </svg>
                          Iniciar Grabación
                        </>
                      )}
                    </button>
                    
                    {isListening && (
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
                        <div className="flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#FF6F61' }}></div>
                          <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>Grabando en vivo...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="mx-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acto 2: La Evaluación Funcional</h3>
            <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
              Mapa corporal interactivo y checklist de pruebas clínicas basadas en los insights del Acto 1
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mapa Corporal Interactivo */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">🗺️</span>
                  <span>Mapa Corporal Interactivo</span>
                </h4>
                
                <div className="space-y-4">
                  {/* Selector de Vistas */}
                  <div className="flex space-x-2 mb-4">
                    {['Anterior', 'Posterior', 'Lateral Derecho', 'Lateral Izquierdo'].map((view) => (
            <button 
                        key={view}
                        className="px-3 py-1 rounded text-xs font-medium transition-colors"
                        style={{ 
                          backgroundColor: view === 'Anterior' ? '#5DA5A3' : '#F7F7F7',
                          color: view === 'Anterior' ? 'white' : '#2C3E50'
                        }}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                  
                  {/* Figura Humanoide */}
                  <div className="text-center">
                    <div className="w-48 h-64 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-dashed" style={{ borderColor: '#BDC3C7' }}>
                      <div className="text-center">
                        <svg className="w-24 h-32 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                        <p className="text-sm" style={{ color: '#7F8C8D' }}>Vista Anterior</p>
                        <p className="text-xs mt-1" style={{ color: '#BDC3C7' }}>Haz clic para marcar zonas de dolor</p>
                      </div>
                    </div>
                    
                    {/* Leyenda de Colores */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#FF6F61' }}></div>
                        <span style={{ color: '#2C3E50' }}>Dolor muscular</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#FFA500' }}></div>
                        <span style={{ color: '#2C3E50' }}>Dolor neuropático</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#5DA5A3' }}></div>
                        <span style={{ color: '#2C3E50' }}>Problemas vasculares</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#A8E6CF' }}></div>
                        <span style={{ color: '#2C3E50' }}>Limitación funcional</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist de Pruebas Clínicas */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">📋</span>
                  <span>Checklist de Pruebas Clínicas</span>
                </h4>
                
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: '#7F8C8D' }}>
                    Tests aprobados basados en los insights del Acto 1
                  </p>
                  
                  {/* Tests Preestablecidos */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F7F7F7' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm" style={{ color: '#2C3E50' }}>Test de Lasègue</h5>
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FF6F61', color: 'white' }}>Recomendado</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#7F8C8D' }}>Resultado:</span>
                          <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#BDC3C7' }}>
                            <option>Seleccionar</option>
                            <option>Positivo</option>
                            <option>Negativo</option>
                            <option>Dudoso</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#7F8C8D' }}>Ángulo:</span>
                          <input type="number" placeholder="45°" className="text-xs px-2 py-1 rounded border w-16" style={{ borderColor: '#BDC3C7' }} />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F7F7F7' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm" style={{ color: '#2C3E50' }}>ROM Flexión Lumbar</h5>
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#A8E6CF', color: '#2C3E50' }}>Funcional</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#7F8C8D' }}>Grados:</span>
                          <input type="number" placeholder="60°" className="text-xs px-2 py-1 rounded border w-16" style={{ borderColor: '#BDC3C7' }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#7F8C8D' }}>Limitación:</span>
                          <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#BDC3C7' }}>
                            <option>Seleccionar</option>
                            <option>Dolor</option>
                            <option>Rigidez</option>
                            <option>Músculo</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F7F7F7' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm" style={{ color: '#2C3E50' }}>Test de Tinetti</h5>
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>Equilibrio</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#7F8C8D' }}>Puntuación:</span>
                          <input type="number" placeholder="24/28" className="text-xs px-2 py-1 rounded border w-16" style={{ borderColor: '#BDC3C7' }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#7F8C8D' }}>Riesgo caída:</span>
                          <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#BDC3C7' }}>
                            <option>Seleccionar</option>
                            <option>Bajo</option>
                            <option>Moderado</option>
                            <option>Alto</option>
                          </select>
                        </div>
          </div>
        </div>
      </div>

                  {/* Box Libre para Tests Adicionales */}
                  <div className="mt-4">
                    <h5 className="font-medium text-sm mb-2" style={{ color: '#2C3E50' }}>Tests Adicionales</h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre del test..."
                        className="w-full px-3 py-2 text-sm border rounded-lg" 
                        style={{ borderColor: '#BDC3C7' }}
                      />
                      <textarea
                        placeholder="Resultados y observaciones..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                        style={{ borderColor: '#BDC3C7' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'soap' && (
        <div className="mx-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acto 3: La Documentación Inteligente</h3>
            <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
              SOAP estructurado, editable y listo para exportación PDF
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="subjective" className="block text-sm font-medium text-gray-700 mb-2">Subjetivo</label>
                <textarea
                  id="subjective"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del paciente sobre su problema..."
                  value={consultationData.soapData.subjective}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, subjective: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
                <textarea
                  id="objective"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Hallazgos del examen físico..."
                  value={consultationData.soapData.objective}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, objective: e.target.value }
                  }))}
                />
                </div>
              <div>
                <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
                <textarea
                  id="assessment"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Diagnóstico y evaluación clínica..."
                  value={consultationData.soapData.assessment}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, assessment: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <textarea
                  id="plan"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Plan de tratamiento y seguimiento..."
                  value={consultationData.soapData.plan}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, plan: e.target.value }
                  }))}
                />
              </div>
          </div>
          
            {/* Botones de Acción */}
            <div className="flex justify-center mt-6 space-x-3">
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#5DA5A3' }}
              >
                📄 Exportar PDF
              </button>
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#FF6F61' }}
                onClick={() => setConsultationData(prev => ({
                  ...prev,
                  soapData: { subjective: '', objective: '', assessment: '', plan: '' }
                }))}
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asistente Virtual */}
      {showAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="text-lg font-bold" style={{ color: '#2C3E50' }}>AIDUX Asistente Virtual</h3>
              </div>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar asistente virtual"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
                <h4 className="font-medium mb-2" style={{ color: '#2C3E50' }}>Consultas Disponibles:</h4>
                <ul className="text-sm space-y-1" style={{ color: '#2C3E50' }}>
                  <li>💊 Información de medicamentos</li>
                  <li>📋 Historia previa del paciente</li>
                  <li>📚 Términos médicos desconocidos</li>
                  <li>🔬 Protocolos de tratamiento</li>
                  <li>⚠️ Contraindicaciones y alertas</li>
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Escribe tu consulta..."
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ 
                    borderColor: '#BDC3C7'
                  }}
                />
                <button
                  className="px-4 py-2 rounded text-white font-medium transition-colors"
                  style={{ backgroundColor: '#5DA5A3' }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalWorkflowPage; 