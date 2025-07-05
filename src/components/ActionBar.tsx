import React from 'react';

interface ActionBarProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onUploadClick: () => void;
  onCameraClick: () => void;
  onSave: () => void;
  disabled?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  isRecording, 
  onStartRecording,
  onStopRecording,
  onUploadClick, 
  onCameraClick, 
  onSave,
  disabled = false
}) => {
  const getButtonStyle = (baseStyle: React.CSSProperties, isPrimary: boolean = false) => ({
    ...baseStyle,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' as const : 'auto' as const
  });

  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      justifyContent: 'center',
      padding: '1rem',
      borderTop: '1px solid #eee'
    }}>
      {!isRecording ? (
        <button
          onClick={onStartRecording}
          disabled={disabled}
          style={getButtonStyle({
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#10b981',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px'
          }, true)}
        >
          🎙️ Iniciar Grabación Médica
        </button>
      ) : (
        <button
          onClick={onStopRecording}
          disabled={disabled}
          style={getButtonStyle({
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px'
          }, true)}
        >
          🛑 Detener Grabación
        </button>
      )}
      
      <button
        onClick={onUploadClick}
        disabled={disabled || isRecording}
        style={getButtonStyle({
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          color: '#333',
          fontSize: '14px'
        })}
      >
        📁 Subir Audio
      </button>
      
      <button
        onClick={onCameraClick}
        disabled={disabled || isRecording}
        style={getButtonStyle({
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          color: '#333',
          fontSize: '14px'
        })}
      >
        📷 Foto
      </button>
      
      <button
        onClick={onSave}
        disabled={disabled || isRecording}
        style={getButtonStyle({
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        }, true)}
      >
        💾 Guardar
      </button>
    </div>
  );
};

export default ActionBar;
