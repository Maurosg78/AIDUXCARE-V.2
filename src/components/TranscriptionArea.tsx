import React from 'react';

interface TranscriptionAreaProps {
  value: string;
  onChange: (value: string) => void;
}

const TranscriptionArea: React.FC<TranscriptionAreaProps> = ({ value, onChange }) => {
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
        placeholder="La transcripción aparecerá aquí en tiempo real..."
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '0.5rem',
          fontSize: '14px',
          lineHeight: '1.5',
          resize: 'vertical',
          fontFamily: 'monospace'
        }}
      />
    </div>
  );
};

export default TranscriptionArea;
