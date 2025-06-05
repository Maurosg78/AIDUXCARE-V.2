/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout rediseñado según wireframe proporcionado
 */

import React, { useState, useCallback, useEffect } from 'react';

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
  // Estados del paciente
  const [patientData] = useState<PatientData>({
    id: "P-2024-001",
    name: "María González Rodríguez",
    age: 45,
    condition: "Lumbalgia crónica",
    allergies: ["AINEs", "Penicilina"],
    previousTreatments: ["Fisioterapia convencional", "Acupuntura"],
    medications: ["Paracetamol 500mg", "Omeprazol 20mg"],
    clinicalHistory: "Paciente con historial de lumbalgia desde hace 3 años, tratada previamente con fisioterapia convencional."
  });

  // Estados de highlights
  const [highlights, setHighlights] = useState<HighlightItem[]>([
    { id: '1', text: 'Dolor en región lumbar L4-L5', category: 'síntoma', confidence: 95, isSelected: false },
    { id: '2', text: 'Limitación del ROM en flexión anterior', category: 'hallazgo', confidence: 87, isSelected: false },
    { id: '3', text: 'Ejercicios de estabilización lumbar recomendados', category: 'plan', confidence: 92, isSelected: false },
    { id: '4', text: 'Evaluar respuesta antiinflamatoria', category: 'advertencia', confidence: 78, isSelected: false }
  ]);

  // Estados de advertencias legales/clínicas
  const [legalWarnings, setLegalWarnings] = useState<LegalWarning[]>([
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

  // Estados de SOAP
  const [soapContent, setSOAPContent] = useState<string>('');

  // Estados del asistente virtual
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantPosition, setAssistantPosition] = useState({ x: window.innerWidth - 450, y: 100 });
  const [assistantMinimized, setAssistantMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Estados para el botón flotante independiente
  const [buttonPosition, setButtonPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isButtonDragging, setIsButtonDragging] = useState(false);
  const [buttonDragOffset, setButtonDragOffset] = useState({ x: 0, y: 0 });
  
  // Estados del chat
  const [chatInput, setChatInput] = useState('');
  
  // Estados de transcripción
  const [isListening, setIsListening] = useState(false);

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
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, isSelected: !h.isSelected } : h));
  };

  const acceptWarning = (id: string) => {
    setLegalWarnings(prev => prev.map(w => w.id === id ? { ...w, isAccepted: !w.isAccepted } : w));
  };

  const generateSOAP = () => {
    const selectedHighlights = highlights.filter(h => h.isSelected);
    if (selectedHighlights.length === 0) return;

    const soap = `DOCUMENTACIÓN SOAP - ${new Date().toLocaleDateString()}
Paciente: ${patientData.name}

SUBJETIVO:
${selectedHighlights.filter(h => h.category === 'síntoma').map(h => `• ${h.text}`).join('\n')}

OBJETIVO:
${selectedHighlights.filter(h => h.category === 'hallazgo').map(h => `• ${h.text}`).join('\n')}

EVALUACIÓN:
• Evaluación clínica basada en hallazgos objetivos

PLAN:
${selectedHighlights.filter(h => h.category === 'plan').map(h => `• ${h.text}`).join('\n')}`;
    
    setSOAPContent(soap);
  };

  // Funciones para el asistente movible
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - assistantPosition.x,
      y: e.clientY - assistantPosition.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setAssistantPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
    if (isButtonDragging) {
      setButtonPosition({
        x: e.clientX - buttonDragOffset.x,
        y: e.clientY - buttonDragOffset.y
      });
    }
  }, [isDragging, dragOffset, isButtonDragging, buttonDragOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsButtonDragging(false);
  };

  // Funciones para el botón flotante
  const handleButtonMouseDown = (e: React.MouseEvent) => {
    setIsButtonDragging(true);
    setButtonDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  // Efectos para el drag and drop
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Efectos para el botón flotante
  useEffect(() => {
    if (isButtonDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isButtonDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      
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

      {/* Workflow de IA - Layout Expandido */}
      <div className="mx-4 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
            Proceso de IA Asistido
          </h2>
          <p className="text-sm" style={{ color: '#7F8C8D' }}>
            Monitorea en tiempo real cómo la IA procesa la información clínica y genera recomendaciones automáticas
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Card 1: Transcripción en Tiempo Real - EXPANDIDA */}
        <div className="bg-white rounded-lg border p-6 min-h-96" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              <h3 className="font-bold text-lg" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>🎤 Transcripción en Tiempo Real</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${isListening ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                {isListening ? '🔴 GRABANDO' : '⏸️ EN PAUSA'}
              </span>
            </div>
          </div>
          
          <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
            Sistema de transcripción automática con IA que identifica diferentes interlocutores, 
            detecta términos médicos y genera confianza en tiempo real.
          </p>
          
          {/* Ventana de Transcripción */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-48 max-h-64 overflow-y-auto border" style={{ borderColor: '#BDC3C7' }}>
            {isListening ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">FT</div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Fisioterapeuta • 10:34 AM</div>
                    <p className="text-sm bg-white p-2 rounded-lg shadow-sm" style={{ color: '#2C3E50' }}>
                      &ldquo;Buenos días María, hoy vamos a trabajar en ejercicios de fortalecimiento para su región lumbar. ¿Cómo se siente hoy?&rdquo;
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">PC</div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Paciente • 10:35 AM</div>
                    <p className="text-sm bg-white p-2 rounded-lg shadow-sm" style={{ color: '#2C3E50' }}>
                      &ldquo;Me siento mejor que la semana pasada, pero aún tengo algo de dolor cuando me inclino hacia adelante.&rdquo;
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Transcribiendo...</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
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

          {/* Controles y Métricas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: isListening ? '#FF6F61' : '#5DA5A3'
                }}
                aria-label={isListening ? 'Detener escucha' : 'Iniciar escucha activa'}
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
              
              <div className="text-sm">
                <p className="font-medium" style={{ color: '#2C3E50' }}>
                  {isListening ? 'Grabando...' : 'Listo para grabar'}
                </p>
                <p className="text-xs" style={{ color: '#7F8C8D' }}>
                  Calidad: {isListening ? '🟢 Excelente' : '⚪ Esperando'}
                </p>
              </div>
            </div>
            
            {isListening && (
              <div className="text-right text-xs" style={{ color: '#7F8C8D' }}>
                <div>⏱️ Tiempo: 2:34</div>
                <div>🔊 Nivel: 78dB</div>
                <div>🎯 Confianza: 94%</div>
              </div>
            )}
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
        </div>

        {/* Card 3: Advertencias Clínicas - Checklist Simple */}
        <div className="bg-white rounded-lg border p-6 relative" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6F61' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <h3 className="font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>🚨 Advertencias Clínicas</h3>
          </div>
          
          <p className="text-sm mb-4" style={{ color: '#7F8C8D' }}>
            Alertas de seguridad detectadas automáticamente. Haz clic en cualquier alerta para ver las fuentes bibliográficas.
          </p>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {legalWarnings.map((warning) => (
              <div key={warning.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={warning.isAccepted}
                    onChange={() => acceptWarning(warning.id)}
                    className="rounded"
                    style={{ accentColor: '#5DA5A3' }}
                    aria-label={`Aceptar advertencia: ${warning.description}`}
                  />
                  <button 
                    className="text-left flex-1 hover:text-blue-600 transition-colors"
                    onClick={() => {
                      // Función para mostrar fuentes bibliográficas
                      console.log('Mostrando fuentes para:', warning.description);
                      alert(`Referencias bibliográficas para &ldquo;${warning.description}&rdquo;:\n\n📚 Guías Clínicas APTA 2024\n📚 Manual de Fisioterapia Ortopédica\n📚 Protocolo Nacional de Seguridad Clínica`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        console.log('Mostrando fuentes para:', warning.description);
                        alert(`Referencias bibliográficas para &ldquo;${warning.description}&rdquo;:\n\n📚 Guías Clínicas APTA 2024\n📚 Manual de Fisioterapia Ortopédica\n📚 Protocolo Nacional de Seguridad Clínica`);
                      }
                    }}
                    tabIndex={0}
                  >
                    <div className="flex items-center space-x-2">
                      <span 
                        className="text-xs font-medium uppercase px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: warning.severity === 'alta' ? '#FFE5E5' : '#E5F4F4',
                          color: warning.severity === 'alta' ? '#FF6F61' : '#5DA5A3'
                        }}
                      >
                        {warning.type}
                      </span>
                      {warning.severity === 'alta' && (
                        <span className="text-xs text-red-600">⚠️</span>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      {warning.description}
                    </span>
                  </button>
                </div>
                
                <button
                  className="ml-3 px-3 py-1 rounded text-xs font-medium transition-colors hover:bg-green-100"
                  style={{ backgroundColor: '#A8E6CF', color: '#2C3E50' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Agregando advertencia a SOAP:', warning.description);
                  }}
                >
                  + SOAP
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-xs mt-3 text-center" style={{ color: '#7F8C8D' }}>
            💡 Haz clic en cualquier alerta para ver referencias bibliográficas
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

      {/* Botón Flotante Independiente del Asistente Virtual */}
      {!showAssistant && (
        <div
          className="floating-button fixed z-40 select-none"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            transition: isButtonDragging ? 'none' : 'all 0.3s ease-in-out'
          }}
        >
          <button
            className="p-3 rounded-full shadow-lg cursor-pointer transition-all hover:scale-110 hover:shadow-xl"
            style={{ backgroundColor: '#2C3E50', color: 'white' }}
            onMouseDown={handleButtonMouseDown}
            onClick={(e) => {
              if (!isButtonDragging) {
                setShowAssistant(true);
              }
            }}
            aria-label="Abrir asistente virtual AIDUX"
          >
            <div className="flex items-center justify-center relative">
              {/* Avatar del Dr. AIDUX */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 p-2 shadow-inner border-2 border-white">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8ZM12 14C16.4 14 20 15.8 20 18V20H4V18C4 15.8 7.6 14 12 14Z"/>
                </svg>
              </div>
              {/* Indicador de estado en línea */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 pointer-events-none transition-opacity hover:opacity-100 whitespace-nowrap shadow-lg">
              <div className="text-center">
                <div className="font-medium">Dr. AIDUX</div>
                <div className="text-xs opacity-80">Asistente Médico Virtual</div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Ventana Flotante del Asistente Virtual */}
      {showAssistant && (
        <div
          className="assistant-window fixed bg-white rounded-lg shadow-2xl border z-50 select-none"
          style={{
            left: `${assistantPosition.x}px`,
            top: `${assistantPosition.y}px`,
            width: assistantMinimized ? '250px' : '400px',
            height: assistantMinimized ? '50px' : '450px',
            borderColor: '#5DA5A3',
            transition: isDragging ? 'none' : 'all 0.3s ease-in-out'
          }}
        >
          {/* Barra de Título Arrastrable */}
          <div
            className="flex items-center justify-between p-3 cursor-move border-b rounded-t-lg"
            style={{ backgroundColor: '#2C3E50', borderColor: '#BDC3C7' }}
            onMouseDown={handleMouseDown}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMouseDown(e as unknown as React.MouseEvent);
              }
            }}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full mr-2 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8ZM12 14C16.4 14 20 15.8 20 18V20H4V18C4 15.8 7.6 14 12 14Z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dr. AIDUX</h3>
                <div className="text-xs text-gray-300">Asistente Médico Virtual</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Botón Minimizar */}
              <button
                onClick={() => setAssistantMinimized(!assistantMinimized)}
                className="w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
                aria-label={assistantMinimized ? 'Maximizar' : 'Minimizar'}
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {assistantMinimized ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                  )}
                </svg>
              </button>
              
              {/* Botón Cerrar */}
              <button
                onClick={() => setShowAssistant(false)}
                className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                aria-label="Cerrar asistente"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del Asistente (solo visible cuando no está minimizado) */}
          {!assistantMinimized && (
            <div className="p-4 h-full overflow-hidden flex flex-col">
              {/* Status Bar */}
              <div className="flex items-center justify-between mb-3 p-2 rounded" style={{ backgroundColor: '#A8E6CF' }}>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#5DA5A3' }}></div>
                  <span className="text-xs font-medium" style={{ color: '#2C3E50' }}>En línea</span>
                </div>
                <span className="text-xs" style={{ color: '#7F8C8D' }}>v2.0.1</span>
              </div>

              {/* Área de Conversación */}
              <div className="flex-1 bg-gray-50 rounded-lg p-3 mb-3 overflow-y-auto">
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full mr-2 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3.5C14.1 3.1 13.1 3.1 12.2 3.5L6 7V9C6 10.1 6.9 11 8 11S10 10.1 10 9V8L12 7L14 8V9C14 10.1 14.9 11 16 11S18 10.1 18 9M12 13.5C7 13.5 2.73 16.39 2 21H22C21.27 16.39 17 13.5 12 13.5Z"/>
                        </svg>
                      </div>
                      <p className="text-xs font-medium" style={{ color: '#5DA5A3' }}>Dr. AIDUX</p>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#2C3E50' }}>
                      👋 ¡Hola! Soy tu asistente médico especializado en fisioterapia. 
                      Estoy aquí para ayudarte con cualquier consulta durante tu sesión clínica.
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#7F8C8D' }}>
                      Puedes preguntarme sobre:
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-1">
                      {[
                        '💊 Medicamentos e interacciones',
                        '📋 Historia del paciente',
                        '📚 Términos médicos',
                        '🔬 Protocolos clínicos',
                        '⚠️ Contraindicaciones'
                      ].map((item, i) => (
                        <button
                          key={i}
                          className="text-xs text-left p-1 rounded hover:bg-gray-100 transition-colors"
                          style={{ color: '#7F8C8D' }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input de Consulta */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Pregunta sobre medicamentos, protocolos, términos médicos..."
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  style={{ borderColor: '#BDC3C7' }}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      // Aquí se integrará con Ollama más tarde
                      console.log('Consulta:', chatInput);
                      setChatInput('');
                    }
                  }}
                />
                <button
                  className="px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#5DA5A3' }}
                  disabled={!chatInput.trim()}
                  aria-label="Enviar consulta"
                  onClick={() => {
                    if (chatInput.trim()) {
                      // Aquí se integrará con Ollama más tarde
                      console.log('Consulta:', chatInput);
                      setChatInput('');
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalWorkflowPage; 