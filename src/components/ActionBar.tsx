import React from 'react';

interface ActionBarProps {
  isRecording: boolean;
}

export default function ActionBar({ isRecording }: ActionBarProps) {
  return (
    <div className="action-bar">
      <button 
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onClick={() => {/* handle click */}}
      >
        {isRecording ? 'Detener' : 'Grabar'}
      </button>
    </div>
  )
}
