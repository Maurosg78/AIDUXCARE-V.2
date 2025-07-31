/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout completamente funcional con captura de audio y asistente virtual
 */

import React, { useState, useEffect } from 'react';
import { ProfessionalAudioCapture } from '../components/professional/ProfessionalAudioCapture';
import { RealTimeHighlights } from '../components/RealTimeHighlights';
import { ClinicalMetrics } from '../components/ClinicalMetrics';
import { useAuth } from '../hooks/useAuth';

export type MedicalPhase = 'anamnesis' | 'exploration' | 'evaluation' | 'planning';

export interface SessionMetrics {
  totalChunks: number;
  analyzedChunks: number;
  averageProcessingTime: number;
  clinicalRelevance: number;
  redFlagsCount: number;
  soapCompleteness: {
    S: number;
    O: number;
    A: number;
    P: number;
  };
}

export interface WorkflowState {
  isRecording: boolean;
  currentPhase: MedicalPhase;
  sessionStartTime: number | null;
  sessionDuration: number;
  metrics: SessionMetrics;
}

export const ProfessionalWorkflowPage: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<MedicalPhase>('anamnesis');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Timer para duración de sesión
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      setSessionDuration(Date.now() - sessionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const handleRecordingStart = () => {
    setIsRecording(true);
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  const handlePhaseChange = (phase: MedicalPhase) => {
    setCurrentPhase(phase);
    
    // Emit phase change para semantic chunking
    window.dispatchEvent(new CustomEvent('medicalPhaseChange', {
      detail: { phase, timestamp: Date.now() }
    }));
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="professional-workflow min-h-screen bg-gray-50">
      {/* Header profesional */}
      <div className="workflow-header bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="session-info">
              <h1 className="text-2xl font-bold text-gray-800">
                Consulta en Progreso
              </h1>
              <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Profesional: {user?.displayName || 'Dr. Usuario'}
                </span>
                <span>Paciente: [Datos anonimizados para demo]</span>
                <span>Duración: {formatDuration(sessionDuration)}</span>
                <span className="flex items-center">
                  Fase: 
                  <span className="ml-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                    {currentPhase}
                  </span>
                </span>
              </div>
            </div>

            <div className="session-controls flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Nueva Sesión
              </button>
              <div className={`recording-indicator flex items-center px-3 py-2 rounded ${
                isRecording 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                {isRecording ? 'Grabando' : 'Detenido'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="workflow-content max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* Columna izquierda: Control de audio */}
          <div className="audio-control-column space-y-6">
            
            {/* Captura de audio */}
            <div className="audio-capture-section">
                      <ProfessionalAudioCapture
          onRecordingComplete={(audioBlob) => {
            handleRecordingStart();
            // TODO: Process audio blob with semantic chunking
            console.log('Audio captured:', audioBlob.size, 'bytes');
          }}
          isProcessing={isRecording}
        />
            </div>

            {/* Métricas clínicas */}
            <div className="metrics-section">
              <ClinicalMetrics 
                isRecording={isRecording}
                currentPhase={currentPhase}
                sessionDuration={sessionDuration}
              />
            </div>

            {/* Controles de fase médica */}
            <div className="phase-controls bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Fase de Consulta
              </h3>
              <div className="phase-buttons grid grid-cols-2 gap-2">
                {[
                  { phase: 'anamnesis', label: 'Anamnesis', icon: '📋' },
                  { phase: 'exploration', label: 'Exploración', icon: '🔍' },
                  { phase: 'evaluation', label: 'Evaluación', icon: '⚕️' },
                  { phase: 'planning', label: 'Planificación', icon: '📝' }
                ].map(({ phase, label, icon }) => (
                  <button
                    key={phase}
                    onClick={() => handlePhaseChange(phase as MedicalPhase)}
                    className={`p-3 rounded-lg border transition-all ${
                      currentPhase === phase
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-600 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Columna derecha: Análisis en tiempo real */}
          <div className="analysis-column space-y-6">
            
            {/* Highlights en tiempo real */}
            <div className="highlights-section">
              <RealTimeHighlights />
            </div>

            {/* Transcripción en vivo */}
            <div className="live-transcription bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Transcripción en Vivo
                </h3>
              </div>
              <div className="p-4">
                <div 
                  id="live-transcription-content"
                  className="h-40 overflow-y-auto border rounded p-3 bg-gray-50 text-sm"
                >
                  <p className="text-gray-500 italic">
                    {isRecording 
                      ? 'Transcribiendo audio en tiempo real...' 
                      : 'Presiona grabar para iniciar transcripción'
                    }
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="workflow-footer bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="session-status text-sm text-gray-600">
              <span>Estado: </span>
              <span className={`font-medium ${
                isRecording ? 'text-green-600' : 'text-gray-600'
              }`}>
                {isRecording ? 'Sesión activa' : 'Sesión pausada'}
              </span>
            </div>

            <div className="action-buttons flex space-x-3">
              <button 
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                onClick={() => {/* TODO: Implement pause */}}
                disabled={!isRecording}
              >
                Pausar Sesión
              </button>
              
              <button 
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                onClick={() => {/* TODO: Implement complete */}}
                disabled={isRecording}
              >
                Completar Consulta
              </button>
              
              <button 
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                onClick={() => {/* TODO: Implement export */}}
              >
                Generar SOAP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 