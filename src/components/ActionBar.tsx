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
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      {/* Botón principal de grabación */}
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={recordingStatus.status === 'processing'}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isRecording ? '#dc3545' : '#28a745',
          color: 'white',
          fontWeight: 'bold',
          cursor: recordingStatus.status === 'processing' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {isRecording ? (
          <>🛑 Detener Grabación</>
        ) : (
          <>🎙️ Iniciar Grabación</>
        )}
      </button>

      {/* Indicador de estado */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ 
          fontSize: '0.9rem',
          color: recordingStatus.status === 'error' ? '#dc3545' : '#212529'
        }}>
          {recordingStatus.message}
        </div>

        {/* Barra de progreso */}
        {(recordingStatus.status === 'recording' || recordingStatus.status === 'processing') && (
          <div style={{ 
            width: '100%',
            height: '4px',
            backgroundColor: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div 
              style={{
                width: `${recordingStatus.progress}%`,
                height: '100%',
                backgroundColor: recordingStatus.status === 'recording' ? '#28a745' : '#007bff',
                transition: 'width 0.3s ease-in-out'
              }}
            />
          </div>
        )}
      </div>

      {/* Indicador de grabación en vivo */}
      {isRecording && (
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc3545',
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          animation: 'pulse 2s infinite'
        }}>
          🔴 EN VIVO
        </div>
      )}
    </div>
  );
};

export default ActionBar;
