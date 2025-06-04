/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Interfaz clínica profesional limpia y automática
 */

import React, { useState, useCallback } from 'react';

interface PatientData {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit?: string;
}

interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: string;
  speakerDetected: boolean;
}

interface ClinicalFinding {
  id: string;
  type: 'symptom' | 'finding' | 'diagnosis' | 'plan';
  text: string;
  confidence: number;
}

export const ProfessionalWorkflowPage: React.FC = () => {
  // Estado principal
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [clinicalFindings, setClinicalFindings] = useState<ClinicalFinding[]>([]);
  const [soapNotes, setSOAPNotes] = useState<any>(null);

  // Datos del paciente
  const [patientData] = useState<PatientData>({
    id: 'PAT-2025-001',
    name: 'María González Rodríguez',
    age: 45,
    condition: 'Lumbalgia crónica L4-L5',
    lastVisit: '15 enero 2025'
  });

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    
    // Simulación de transcripción automática
    setTimeout(() => {
      setTranscription("Paciente refiere dolor lumbar matutino de intensidad 7/10, irradiación hacia pierna derecha...");
    }, 2000);
    
    setTimeout(() => {
      setTranscription("Paciente refiere dolor lumbar matutino de intensidad 7/10, irradiación hacia pierna derecha. En exploración se observa limitación flexión lumbar, test Lasègue positivo a 45°.");
      
      // Hallazgos automáticos
      setClinicalFindings([
        { id: '1', type: 'symptom', text: 'Dolor lumbar matutino 7/10', confidence: 0.95 },
        { id: '2', type: 'symptom', text: 'Irradiación pierna derecha', confidence: 0.92 },
        { id: '3', type: 'finding', text: 'Limitación flexión lumbar', confidence: 0.88 },
        { id: '4', type: 'finding', text: 'Lasègue positivo 45°', confidence: 0.91 }
      ]);
    }, 4000);
    
    setTimeout(() => {
      setIsRecording(false);
      
      // Generar SOAP automáticamente
      setSOAPNotes({
        subjective: "Dolor lumbar matutino intensidad 7/10 con irradiación a pierna derecha",
        objective: "Limitación flexión lumbar, test Lasègue positivo a 45°",
        assessment: "Probable radiculopatía L5-S1",
        plan: "Continuar fisioterapia, ejercicios extensión lumbar, reevaluación en 2 semanas"
      });
    }, 6000);
    
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      
      {/* Información del Paciente */}
      <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#A8E6CF', border: '1px solid #5DA5A3' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <h2 className="text-xl font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Información del Paciente
            </h2>
          </div>
          <span className="px-3 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
            ID: {patientData.id}
          </span>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Datos Básicos */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Datos Básicos
            </h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium" style={{ color: '#BDC3C7' }}>Nombre:</span>
              <p className="font-medium" style={{ color: '#2C3E50' }}>{patientData.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: '#BDC3C7' }}>Edad:</span>
              <p className="font-medium" style={{ color: '#2C3E50' }}>{patientData.age} años</p>
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: '#BDC3C7' }}>Última consulta:</span>
              <p className="font-medium" style={{ color: '#2C3E50' }}>{patientData.lastVisit}</p>
            </div>
          </div>
        </div>

        {/* Condición Actual */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A8E6CF' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Condición Actual
            </h3>
          </div>
          
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
            <p className="font-semibold text-center" style={{ color: '#2C3E50' }}>
              {patientData.condition}
            </p>
          </div>
        </div>

        {/* Historial Relevante */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6F61' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Historial Relevante
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm" style={{ color: '#2C3E50' }}>• Cirugía discectomía L4-L5 (2023)</div>
            <div className="text-sm" style={{ color: '#2C3E50' }}>• Fisioterapia previa 6 meses</div>
            <div className="text-sm" style={{ color: '#2C3E50' }}>• Alergia: AINEs</div>
            <div className="text-sm" style={{ color: '#2C3E50' }}>• Diabetes tipo 2 controlada</div>
          </div>
        </div>
      </div>

      {/* Control de Grabación */}
      <div className="mt-8 bg-white rounded-lg border p-8 text-center" style={{ borderColor: '#BDC3C7' }}>
        <h3 className="text-xl font-semibold mb-6" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
          Transcripción Automática de Consulta
        </h3>
        
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all mb-4 mx-auto ${
            isRecording ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: isRecording ? '#FF6F61' : '#5DA5A3'
          }}
        >
          {isRecording ? (
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
          )}
        </button>
        
        <p className="text-lg font-medium mb-2" style={{ color: '#2C3E50' }}>
          {isRecording ? 'Grabando consulta...' : 'Iniciar grabación'}
        </p>
        <p className="text-sm" style={{ color: '#BDC3C7' }}>
          {isRecording 
            ? 'El sistema detecta automáticamente la conversación y genera notas clínicas' 
            : 'Presiona para comenzar la transcripción automática de la consulta'
          }
        </p>
      </div>

      {/* Transcripción */}
      {transcription && (
        <div className="mt-6 bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Transcripción de Consulta
            </h3>
          </div>
          
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#F7F7F7', border: '1px solid #BDC3C7' }}>
            <p className="leading-relaxed" style={{ color: '#2C3E50' }}>{transcription}</p>
            
            {isRecording && (
              <div className="flex items-center mt-3">
                <div className="w-2 h-2 rounded-full animate-pulse mr-2" style={{ backgroundColor: '#FF6F61' }}></div>
                <span className="text-sm" style={{ color: '#BDC3C7' }}>Transcribiendo en tiempo real...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hallazgos Clínicos */}
      {clinicalFindings.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A8E6CF' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Hallazgos Identificados Automáticamente
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalFindings.map((finding) => (
              <div key={finding.id} className="p-3 rounded-lg border" style={{ backgroundColor: '#F7F7F7', borderColor: '#BDC3C7' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ 
                    backgroundColor: finding.type === 'symptom' ? '#FF6F61' : '#A8E6CF',
                    color: finding.type === 'symptom' ? 'white' : '#2C3E50'
                  }}>
                    {finding.type.toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: '#BDC3C7' }}>
                    {Math.round(finding.confidence * 100)}% confianza
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: '#2C3E50' }}>{finding.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas SOAP */}
      {soapNotes && (
        <div className="mt-6 bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6F61' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                Notas SOAP Generadas
              </h3>
            </div>
            <button 
              className="px-4 py-2 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: '#FF6F61' }}
            >
              Exportar PDF
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#5DA5A3' }}>S - Subjetivo</h4>
              <p className="text-sm" style={{ color: '#2C3E50' }}>{soapNotes.subjective}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#A8E6CF' }}>O - Objetivo</h4>
              <p className="text-sm" style={{ color: '#2C3E50' }}>{soapNotes.objective}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#FF6F61' }}>A - Análisis</h4>
              <p className="text-sm" style={{ color: '#2C3E50' }}>{soapNotes.assessment}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#5DA5A3' }}>P - Plan</h4>
              <p className="text-sm" style={{ color: '#2C3E50' }}>{soapNotes.plan}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfessionalWorkflowPage; 