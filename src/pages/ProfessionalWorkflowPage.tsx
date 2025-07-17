/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout rediseñado según wireframe proporcionado
 */

import React, { useState, useCallback } from 'react';

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

interface BackendSOAPResponse {
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    fullText: string;
  };
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
  const [soapContent, setSOAPContent] = useState('');
  const [showAssistant, setShowAssistant] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null);
  const [loadingSOAP, setLoadingSOAP] = useState(false);
  const [errorSOAP, setErrorSOAP] = useState<string | null>(null);
  
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

  const handleStartListening = useCallback(() => {
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
  }, []);

  // 3. Función asíncrona para enviar transcripción al backend
  const analyzeTranscription = async (transcript: string) => {
    setLoadingAnalysis(true);
    setErrorAnalysis(null);
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
    } catch (err: any) {
      setErrorAnalysis(err.message || 'Error desconocido');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // 4. Función para enviar selección a backend y poblar nota SOAP
  const generateSOAPFromSelection = async () => {
    setLoadingSOAP(true);
    setErrorSOAP(null);
    try {
      const selectedHighlights = highlights.filter(h => h.isSelected);
      const acceptedWarnings = legalWarnings.filter(w => w.isAccepted);
      const res = await fetch('/generate-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highlights: selectedHighlights,
          warnings: acceptedWarnings,
          patientId: patientData.id
        })
      });
      if (!res.ok) throw new Error('Error generando nota SOAP');
      const data: BackendSOAPResponse = await res.json();
      setSOAPContent(data.soap.fullText);
      setConsultationData(prev => ({
        ...prev,
        soapData: {
          subjective: data.soap.subjective,
          objective: data.soap.objective,
          assessment: data.soap.assessment,
          plan: data.soap.plan
        }
      }));
    } catch (err: any) {
      setErrorSOAP(err.message || 'Error desconocido');
    } finally {
      setLoadingSOAP(false);
    }
  };

  const handleStopListening = useCallback(() => {
    setIsListening(false);
    if (transcription) {
      analyzeTranscription(transcription);
    }
  }, [transcription]);

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

  const generateSOAP = () => {
    generateSOAPFromSelection();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      
      {/* Navegación por Pestañas */}
      <div className="mx-4 mb-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'collection', label: 'Recopilación', icon: '📋' },
              { id: 'evaluation', label: 'Evaluación Clínica', icon: '🔍' },
              { id: 'soap', label: 'SOAP', icon: '📝' }
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

      {/* Tres Cards Funcionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mx-4 mb-6">
        
        {/* Card 1: Botón Escucha Activa */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
            <h3 className="font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>Escucha Activa</h3>
          </div>
          
          <p className="text-sm mb-4" style={{ color: '#7F8C8D' }}>
            Activa la transcripción automática del ambiente. El sistema identifica 
            diferentes interlocutores y marca las partes del audio que requieren clarificación.
          </p>
          
          <div className="text-center">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all mx-auto mb-3 ${
                isListening ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: isListening ? '#FF6F61' : '#5DA5A3'
              }}
              aria-label={isListening ? 'Detener escucha' : 'Iniciar escucha activa'}
            >
              {isListening ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              )}
            </button>
            <p className="text-sm font-medium" style={{ color: '#2C3E50' }}>
              {isListening ? 'Escuchando...' : 'Iniciar Escucha'}
            </p>
          </div>
        </div>

        {/* Card 2: Checklist de Highlights */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A8E6CF' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>Highlights de Conversación</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: '#7F8C8D' }}>
            Elementos clave detectados automáticamente en la conversación. 
            Selecciona los que deseas incluir en las notas SOAP.
          </p>
          {loadingAnalysis && (
            <div className="flex items-center text-blue-500 mb-2">
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" className="opacity-75" />
              </svg>
              Analizando transcripción...
            </div>
          )}
          {errorAnalysis && (
            <div className="text-red-500 mb-2">{errorAnalysis}</div>
          )}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {highlights.map((highlight) => (
              <label key={highlight.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={highlight.isSelected}
                  onChange={() => toggleHighlight(highlight.id)}
                  className="rounded"
                  style={{ accentColor: '#5DA5A3' }}
                />
                <span className="text-sm">
                  <span 
                    className="font-medium px-2 py-1 rounded text-xs mr-2"
                    style={{ 
                      backgroundColor: highlight.category === 'síntoma' ? '#FF6F61' : 
                                      highlight.category === 'hallazgo' ? '#A8E6CF' : '#5DA5A3',
                      color: highlight.category === 'síntoma' ? 'white' : '#2C3E50'
                    }}
                  >
                    {highlight.category}
                  </span>
                  {highlight.text}
                </span>
              </label>
            ))}
          </div>
          {highlights.length > 0 && (
            <button
              onClick={generateSOAP}
              className="mt-3 w-full px-4 py-2 rounded text-white text-sm font-medium transition-colors flex items-center justify-center"
              style={{ backgroundColor: '#5DA5A3' }}
              disabled={loadingSOAP}
            >
              {loadingSOAP && (
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" className="opacity-75" />
                </svg>
              )}
              {loadingSOAP ? 'Generando nota SOAP...' : 'Generar Notas SOAP'}
            </button>
          )}
          {errorSOAP && (
            <div className="text-red-500 mt-2">{errorSOAP}</div>
          )}
        </div>

        {/* Card 3: Advertencias Legales */}
        <div className="bg-white rounded-lg border p-6 relative" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6F61' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <h3 className="font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>Advertencias Clínicas</h3>
          </div>
          
          <p className="text-sm mb-4" style={{ color: '#7F8C8D' }}>
            Alertas de seguridad, contraindicaciones y consideraciones iatrogénicas 
            basadas en el perfil del paciente.
          </p>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {legalWarnings.map((warning) => (
              <div 
                key={warning.id} 
                className="border rounded p-3" 
                style={{ 
                  borderColor: warning.severity === 'alta' ? '#FF6F61' : '#BDC3C7',
                  backgroundColor: warning.severity === 'alta' ? '#FFF5F4' : '#F7F7F7'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span 
                      className="text-xs font-medium uppercase px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: warning.severity === 'alta' ? '#FF6F61' : '#5DA5A3',
                        color: 'white'
                      }}
                    >
                      {warning.type}
                    </span>
                    <p className="text-xs mt-2" style={{ color: '#2C3E50' }}>{warning.description}</p>
                  </div>
                  <button
                    onClick={() => acceptWarning(warning.id)}
                    className={`ml-2 px-2 py-1 rounded text-xs transition-colors ${
                      warning.isAccepted 
                        ? 'bg-green-500 text-white' 
                        : 'hover:bg-gray-300'
                    }`}
                    style={{ backgroundColor: warning.isAccepted ? '#5DA5A3' : '#BDC3C7' }}
                  >
                    {warning.isAccepted ? '✓' : 'Revisar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Asistente Virtual Flotante */}
          <div className="absolute -right-2 -bottom-2">
            <button 
              className="p-4 rounded-lg shadow-lg cursor-pointer max-w-xs text-left transition-transform hover:scale-105"
              style={{ backgroundColor: '#2C3E50', color: 'white' }}
              onClick={() => setShowAssistant(!showAssistant)}
              aria-label="Abrir asistente virtual AIDUX"
            >
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h4 className="font-bold text-sm">AIDUX Asistente</h4>
              </div>
              <p className="text-xs">
                Consulta medicamentos, protocolos, términos médicos y más...
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de Pestañas */}
      {activeTab === 'collection' && (
        <div className="mx-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recopilación de Información</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del Paciente */}
              <div>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>Información del Paciente</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={consultationData.patientInfo.name}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      patientInfo: { ...prev.patientInfo, name: e.target.value }
                    }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Edad"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={consultationData.patientInfo.age || ''}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        patientInfo: { ...prev.patientInfo, age: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={consultationData.patientInfo.gender}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        patientInfo: { ...prev.patientInfo, gender: e.target.value }
                      }))}
                    >
                      <option value="">Género</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="no binario">No binario</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Transcripción */}
              <div>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>Transcripción de Conversación</h4>
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <button
                      onClick={isListening ? handleStopListening : handleStartListening}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isListening
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isListening ? '⏹️ Detener' : '🎤 Iniciar Grabación'}
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                    <div className="text-sm text-gray-600">
                      {transcription || 'La transcripción aparecerá aquí...'}
                    </div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluación Clínica</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tests Clínicos */}
              <div>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>Tests Clínicos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Test de Lasègue</div>
                      <div className="text-sm text-gray-600">Positivo a 45°</div>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Positivo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Test de Bragard</div>
                      <div className="text-sm text-gray-600">Negativo</div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Negativo</span>
                  </div>
                </div>
              </div>

              {/* Anatomía del Dolor */}
              <div>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>Anatomía del Dolor</h4>
                <div className="text-center">
                  <div className="w-32 h-48 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-500">Figura Humanoide</span>
                  </div>
                  <div className="text-sm text-gray-600">Haz clic en las áreas para marcar el dolor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'soap' && (
        <div className="mx-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SOAP Editable</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjetivo</label>
                <textarea
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
                <textarea
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
                <textarea
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <textarea
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
          </div>
        </div>
      )}

      {/* Sección SOAP Original */}
      <div className="mx-4 mb-6">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h2 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                Documentación SOAP
              </h2>
            </div>
            <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: '#A8E6CF', color: '#2C3E50' }}>
              Generación Automática
            </span>
          </div>
          
          <p className="text-sm mb-4" style={{ color: '#7F8C8D' }}>
            Documentación clínica estructurada, lógica y temporal. Lista para exportación PDF.
          </p>
          
          <div 
            className="rounded-lg p-6 min-h-48 border"
            style={{ backgroundColor: '#F7F7F7', borderColor: '#BDC3C7' }}
          >
            {soapContent ? (
              <div>
                <div className="mb-4">
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium mb-2" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
                    Documento generado automáticamente
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed" style={{ color: '#2C3E50' }}>
                  {soapContent}
                </pre>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-16">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p style={{ color: '#7F8C8D' }}>Las notas SOAP aparecerán aquí automáticamente</p>
                <p className="text-xs mt-1" style={{ color: '#BDC3C7' }}>Selecciona elementos y genera la documentación</p>
              </div>
            )}
          </div>
          
          {soapContent && (
            <div className="flex justify-center mt-4 space-x-3">
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#5DA5A3' }}
              >
                📄 Exportar PDF
              </button>
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#FF6F61' }}
                onClick={() => setSOAPContent('')}
              >
                🗑️ Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

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