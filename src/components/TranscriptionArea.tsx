import React from 'react';

interface RecordingStatus {
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
}

export interface TranscriptionAreaProps {
  transcription: string;
  isRecording: boolean;
  recordingStatus: RecordingStatus;
}

const TranscriptionArea: React.FC<TranscriptionAreaProps> = ({
  transcription,
  isRecording,
  recordingStatus
}) => {
  const getStatusColor = () => {
    switch (recordingStatus.status) {
      case 'recording':
        return 'border-red-500 bg-red-50';
      case 'processing':
        return 'border-yellow-500 bg-yellow-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-600 bg-red-50';
      default:
        return 'border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (recordingStatus.status) {
      case 'recording':
        return '🔴';
      case 'processing':
        return '⏳';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🎙️';
    }
  };

  return (
    <div className={`
      p-4 rounded-lg border-2 transition-colors duration-300
      ${getStatusColor()}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <label 
          htmlFor="transcription-area" 
          className="text-lg font-semibold text-gray-700 flex items-center gap-2"
        >
          {getStatusIcon()} Transcripción Médica
        </label>
        {recordingStatus.status !== 'idle' && (
          <span className="text-sm font-medium text-gray-500">
            {recordingStatus.message}
          </span>
        )}
      </div>

      {/* Área de transcripción */}
      <div 
        id="transcription-area"
        role="textbox"
        aria-readonly="true"
        tabIndex={0}
        className="relative min-h-[200px] bg-white rounded border border-gray-200 p-4"
      >
        {transcription ? (
          <p className="whitespace-pre-wrap text-gray-700">{transcription}</p>
        ) : (
          <p className="text-gray-400 italic">
            {isRecording 
              ? 'Grabando audio... El análisis aparecerá al finalizar.'
              : 'La transcripción aparecerá aquí al grabar...'}
          </p>
        )}

        {/* Indicador de grabación */}
        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-500">EN VIVO</span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {recordingStatus.status !== 'idle' && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                recordingStatus.status === 'recording' ? 'bg-red-500' :
                recordingStatus.status === 'processing' ? 'bg-yellow-500' :
                recordingStatus.status === 'completed' ? 'bg-green-500' :
                'bg-red-600'
              }`}
              style={{ width: `${recordingStatus.progress}%` }}
              role="progressbar"
              aria-valuenow={recordingStatus.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionArea;
