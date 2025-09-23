import React from 'react';

interface ActionBarProps {
  isRecording: boolean;
  onAction: () => void;
}

export function ActionBar({ isRecording, onAction }: ActionBarProps) {
  return (
    <div className="action-bar">
      <button 
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onClick={onAction}
      >
        {isRecording ? 'Stop' : 'Record'}
      </button>
    </div>
  );
}
