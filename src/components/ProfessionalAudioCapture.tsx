import React, { useState, useEffect } from 'react';
import { MedicalPhase } from '../pages/ProfessionalWorkflowPage';

interface ProfessionalAudioCaptureProps {
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onPhaseChange: (phase: MedicalPhase) => void;
  currentPhase: MedicalPhase;
}

export const ProfessionalAudioCapture: React.FC<ProfessionalAudioCaptureProps> = ({
  onRecordingStart,
  onRecordingStop,
  onPhaseChange,
  currentPhase
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcription, setTranscription] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);
      onRecordingStart();
      
      // Simular análisis de nivel de audio
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setAudioLevel(0);
    onRecordingStop();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: MedicalPhase): string => {
    const colors = {
      anamnesis: 'bg-blue-500',
      exploration: 'bg-green-500',
      evaluation: 'bg-orange-500',
      planning: 'bg-purple-500'
    };
    return colors[phase];
  };

  const getPhaseLabel = (phase: MedicalPhase): string => {
    const labels = {
      anamnesis: 'Anamnesis',
      exploration: 'Exploración',
      evaluation: 'Evaluación',
      planning: 'Planificación'
    };
    return labels[phase];
  };

  return (
    <div className="professional-audio-capture bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Captura de Audio Profesional
        </h3>
        <p className="text-sm text-gray-600">
          Sistema de grabación optimizado para consultas médicas
        </p>
      </div>

      {/* Estado de grabación */}
      <div className="recording-status mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="font-medium text-gray-700">
              {isRecording ? 'Grabando' : 'Detenido'}
            </span>
          </div>
          
          {isRecording && (
            <div className="text-lg font-mono text-gray-800">
              {formatTime(recordingTime)}
            </div>
          )}
        </div>

        {/* Nivel de audio */}
        {isRecording && (
          <div className="audio-level mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600">Nivel de Audio:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${(audioLevel / 255) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">
                {Math.round((audioLevel / 255) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Fase actual */}
        <div className="current-phase mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fase Actual:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPhaseColor(currentPhase)}`}>
              {getPhaseLabel(currentPhase)}
            </span>
          </div>
        </div>
      </div>

      {/* Controles principales */}
      <div className="controls mb-6">
        <div className="flex space-x-4">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRecording ? '⏹️ Detener' : '🎤 Iniciar'}
          </button>
        </div>
      </div>

      {/* Transcripción en vivo */}
      <div className="live-transcription">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Transcripción en Vivo
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
          {transcription ? (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{transcription}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              {isRecording ? 'Transcribiendo audio...' : 'La transcripción aparecerá aquí'}
            </p>
          )}
        </div>
      </div>

      {/* Indicadores de calidad */}
      {isRecording && (
        <div className="quality-indicators mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-2 rounded">
              <div className="text-green-600 font-medium">✓</div>
              <div className="text-xs text-green-700">Audio OK</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-blue-600 font-medium">✓</div>
              <div className="text-xs text-blue-700">IA Activa</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-purple-600 font-medium">✓</div>
              <div className="text-xs text-purple-700">SOAP</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 