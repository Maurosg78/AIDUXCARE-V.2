/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout rediseñado según wireframe proporcionado
 */

import React, { useState, useCallback } from 'react';

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

  const handleStopListening = useCallback(() => {
    setIsListening(false);
  }, []);

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
    const selectedHighlights = highlights.filter(h => h.isSelected);
    const symptoms = selectedHighlights.filter(h => h.category === 'síntoma').map(h => h.text).join(', ');
    const findings = selectedHighlights.filter(h => h.category === 'hallazgo').map(h => h.text).join(', ');
    const plans = selectedHighlights.filter(h => h.category === 'plan').map(h => h.text).join(', ');
    
    const soapText = `S: ${symptoms}\nO: ${findings}\nA: Evaluación fisioterapéutica\nP: ${plans}`;
    setSOAPContent(soapText);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      
      {/* Header del Paciente - Historia Clínica */}
      <div className="p-6 m-4 rounded-lg border" style={{ backgroundColor: '#A8E6CF', borderColor: '#5DA5A3' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
            Información del Paciente - Historia Clínica - Tratamientos Previos
          </h1>
          <span className="px-3 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
            ID: {patientData.id}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>Datos del Paciente</h3>
            <p><strong>Nombre:</strong> {patientData.name}</p>
            <p><strong>Edad:</strong> {patientData.age} años</p>
            <p><strong>Condición:</strong> {patientData.condition}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>Historia Clínica</h3>
            <p className="text-sm">{patientData.clinicalHistory}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>Tratamientos Previos</h3>
            {patientData.previousTreatments.map((treatment, i) => (
              <p key={i} className="text-sm">• {treatment}</p>
            ))}
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>Advertencias Médicas</h3>
            <p><strong>Alergias:</strong> {patientData.allergies.join(', ')}</p>
            <div className="mt-2">
              <strong>Medicamentos:</strong>
              {patientData.medications.map((med, i) => (
                <p key={i} className="text-sm">• {med}</p>
              ))}
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
              className="mt-3 w-full px-4 py-2 rounded text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: '#5DA5A3' }}
            >
              Generar Notas SOAP
            </button>
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

      {/* Sección SOAP */}
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