import React from 'react';

interface RecordingStatus {
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
}

export interface ActionBarProps {
  isRecording: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  recordingStatus: RecordingStatus;
}

const ActionBar: React.FC<ActionBarProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  recordingStatus
}) => {
  const getStatusColor = () => {
    switch (recordingStatus.status) {
      case 'recording':
        return 'bg-red-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getButtonStyle = () => {
    if (recordingStatus.status === 'recording') {
      return 'bg-red-500 hover:bg-red-600';
    }
    return 'bg-blue-500 hover:bg-blue-600';
  };

  const isButtonDisabled = recordingStatus.status === 'processing';

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      {/* Botón principal */}
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isButtonDisabled}
        className={`
          px-6 py-2 rounded-lg text-white font-medium
          transition-colors duration-200
          ${getButtonStyle()}
          ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isRecording ? '⏹️ Detener Grabación' : '🎙️ Iniciar Grabación'}
      </button>

      {/* Estado y progreso */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium text-gray-700">
            {recordingStatus.message}
          </span>
        </div>
        
        {/* Barra de progreso */}
        {recordingStatus.status !== 'idle' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${recordingStatus.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionBar;
