import React from 'react';

interface ActionBarProps {
  isRecording: boolean;
  onMicClick: () => void;
  onUploadClick: () => void;
  onCameraClick: () => void;
  onSave: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  isRecording, 
  onMicClick, 
  onUploadClick, 
  onCameraClick, 
  onSave 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      justifyContent: 'center',
      padding: '1rem',
      borderTop: '1px solid #eee'
    }}>
      <button
        onClick={onMicClick}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          backgroundColor: isRecording ? '#ef4444' : '#10b981',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        {isRecording ? '🛑 Detener' : '🎤 Grabar'}
      </button>
      
      <button
        onClick={onUploadClick}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          color: '#333',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📁 Subir Audio
      </button>
      
      <button
        onClick={onCameraClick}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          color: '#333',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📷 Foto
      </button>
      
      <button
        onClick={onSave}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        💾 Guardar
      </button>
    </div>
  );
};

export default ActionBar;
