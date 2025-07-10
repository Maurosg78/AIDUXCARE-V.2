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
  return (
    <div style={{ 
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '1rem',
      backgroundColor: 'white',
      position: 'relative'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#495057' }}>
        📝 Transcripción Médica
      </h3>

      {/* Área de transcripción */}
      <div style={{
        minHeight: '200px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        fontSize: '0.9rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        position: 'relative'
      }}>
        {transcription || (
          <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
            {recordingStatus.status === 'recording' ? (
              'Grabando audio... El análisis aparecerá al finalizar.'
            ) : recordingStatus.status === 'processing' ? (
              'Procesando audio con Google Cloud...'
            ) : recordingStatus.status === 'error' ? (
              recordingStatus.message
            ) : (
              'La transcripción aparecerá aquí al iniciar la grabación.'
            )}
          </div>
        )}
      </div>

      {/* Indicadores de estado */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1rem',
        fontSize: '0.8rem',
        color: '#6c757d'
      }}>
        {/* Estado de grabación */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          {recordingStatus.status === 'recording' && (
            <span style={{ 
              color: '#28a745',
              animation: 'pulse 2s infinite'
            }}>
              🎙️ Grabando...
            </span>
          )}
          {recordingStatus.status === 'processing' && (
            <span style={{ color: '#007bff' }}>
              🔄 Procesando...
            </span>
          )}
          {recordingStatus.status === 'completed' && (
            <span style={{ color: '#28a745' }}>
              ✅ Análisis completado
            </span>
          )}
          {recordingStatus.status === 'error' && (
            <span style={{ color: '#dc3545' }}>
              ❌ {recordingStatus.message}
            </span>
          )}
        </div>

        {/* Contador de caracteres */}
        {transcription && (
          <div>
            {transcription.length} caracteres
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionArea;
