/**
 * AudioProcessingPage - Demo de Procesamiento de Audio
 * Con identidad visual oficial de AiDuxCare
 */

import React, { useState } from 'react';

const AudioProcessingPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulación de transcripción en tiempo real
    setTimeout(() => {
      setTranscriptionText("El paciente Andrea presenta dolor lumbar crónico...");
    }, 2000);
    
    setTimeout(() => {
      setTranscriptionText("El paciente Andrea presenta dolor lumbar crónico desde hace 3 meses. Refiere molestias al permanecer sentada por períodos prolongados...");
    }, 4000);
    
    setTimeout(() => {
      setIsRecording(false);
      setTranscriptionText("El paciente Andrea presenta dolor lumbar crónico desde hace 3 meses. Refiere molestias al permanecer sentada por períodos prolongados. En la exploración física se observa tensión en paravertebrales L4-L5.");
    }, 6000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Título Simple */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
          Demo de Procesamiento de Audio
        </h1>
        <p style={{ color: '#BDC3C7' }}>
          Transcripción automática de consultas médicas con IA especializada en fisioterapia
        </p>
      </div>

      {/* Control de Grabación */}
      <div className="bg-white rounded-lg border p-6 mb-6" style={{ borderColor: '#BDC3C7' }}>
        <div className="text-center">
          <div className="mb-6">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: isRecording ? '#FF6F61' : '#5DA5A3'
              }}
            >
              {isRecording ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              )}
            </button>
          </div>
          
          <div className="text-lg font-medium mb-2" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
            {isRecording ? 'Grabando...' : 'Listo para grabar'}
          </div>
          
          <div className="text-sm" style={{ color: '#BDC3C7' }}>
            {isRecording 
              ? 'Presiona el botón para detener' 
              : 'Presiona el botón para comenzar la demostración'
            }
          </div>
        </div>
      </div>

      {/* Transcripción en Tiempo Real */}
      <div className="bg-white rounded-lg border p-6 mb-6" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
            Transcripción en Tiempo Real
          </h3>
        </div>
        
        <div className="min-h-32 p-4 rounded-md border" style={{ backgroundColor: '#F7F7F7', borderColor: '#BDC3C7' }}>
          {transcriptionText ? (
            <p className="leading-relaxed" style={{ color: '#2C3E50' }}>{transcriptionText}</p>
          ) : (
            <p className="italic" style={{ color: '#BDC3C7' }}>La transcripción aparecerá aquí cuando inicies la grabación...</p>
          )}
          
          {isRecording && (
            <div className="flex items-center mt-3">
              <div className="w-2 h-2 rounded-full animate-pulse mr-2" style={{ backgroundColor: '#FF6F61' }}></div>
              <span className="text-sm" style={{ color: '#BDC3C7' }}>Transcribiendo...</span>
            </div>
          )}
        </div>
      </div>

      {/* Análisis IA (solo se muestra cuando hay transcripción) */}
      {transcriptionText && !isRecording && (
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A8E6CF' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Análisis Automático
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Hallazgos Clínicos */}
            <div>
              <h4 className="font-medium mb-3" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                Hallazgos Identificados
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#FF6F61' }}></span>
                  <span style={{ color: '#2C3E50' }}>Dolor lumbar crónico</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#5DA5A3' }}></span>
                  <span style={{ color: '#2C3E50' }}>Tensión paravertebral L4-L5</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#A8E6CF' }}></span>
                  <span style={{ color: '#2C3E50' }}>3 meses de evolución</span>
                </div>
              </div>
            </div>

            {/* Nota SOAP Generada */}
            <div>
              <h4 className="font-medium mb-3" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                Estructura SOAP
              </h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium" style={{ color: '#5DA5A3' }}>S:</span> <span style={{ color: '#2C3E50' }}>Dolor lumbar crónico, 3 meses</span></div>
                <div><span className="font-medium" style={{ color: '#A8E6CF' }}>O:</span> <span style={{ color: '#2C3E50' }}>Tensión paravertebral L4-L5</span></div>
                <div><span className="font-medium" style={{ color: '#FF6F61' }}>A:</span> <span style={{ color: '#2C3E50' }}>Lumbalgia mecánica</span></div>
                <div><span className="font-medium" style={{ color: '#5DA5A3' }}>P:</span> <span style={{ color: '#2C3E50' }}>Evaluación completa requerida</span></div>
              </div>
            </div>

          </div>
          
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#BDC3C7' }}>
            <button 
              className="text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: '#FF6F61',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Generar Nota Completa
            </button>
          </div>
        </div>
      )}

      {/* Información Adicional */}
      <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: '#A8E6CF', border: '1px solid #5DA5A3' }}>
        <div className="flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h4 className="font-medium mb-1" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
              Demostración Simulada
            </h4>
            <p className="text-sm" style={{ color: '#2C3E50' }}>
              Esta es una demostración con datos pre-configurados. En el sistema real, 
              la transcripción se realiza en tiempo real con tu micrófono.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AudioProcessingPage; 