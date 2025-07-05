import React from 'react';

interface TranscriptionAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TranscriptionArea: React.FC<TranscriptionAreaProps> = ({ 
  value, 
  onChange, 
  placeholder = "La transcripción aparecerá aquí en tiempo real...",
  disabled = false
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontWeight: 'bold',
        color: '#333'
      }}>
        Transcripción en Tiempo Real:
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '1rem',
          border: disabled ? '1px solid #ccc' : '1px solid #ddd',
          borderRadius: '0.5rem',
          fontSize: '14px',
          lineHeight: '1.5',
          resize: 'vertical',
          fontFamily: 'monospace',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          color: disabled ? '#666' : '#333',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
      {disabled && (
        <div style={{ 
          fontSize: '0.8rem', 
          color: '#666', 
          marginTop: '0.5rem',
          fontStyle: 'italic'
        }}>
          📝 Modo transcripción automática activo
        </div>
      )}
    </div>
  );
};

export default TranscriptionArea;
