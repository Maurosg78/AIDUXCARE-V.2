import React from 'react';

interface CaptureWorkspaceProps {
  children: React.ReactNode;
}

const CaptureWorkspace: React.FC<CaptureWorkspaceProps> = ({ children }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 2fr 1fr', 
      gap: '1rem',
      minHeight: '500px'
    }}>
      {/* Columna izquierda - Módulos inteligentes futuros */}
      <div style={{ 
        border: '1px dashed #ccc', 
        borderRadius: '0.5rem', 
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        [Highlights & Advertencias]
      </div>

      {/* Columna central - Área principal de captura */}
      <div>
        {children}
      </div>

      {/* Columna derecha - Preguntas sugeridas */}
      <div style={{ 
        border: '1px dashed #ccc', 
        borderRadius: '0.5rem', 
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        [Preguntas Sugeridas]
      </div>
    </div>
  );
};

export default CaptureWorkspace;
