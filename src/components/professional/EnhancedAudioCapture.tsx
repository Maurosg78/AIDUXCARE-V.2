import React from 'react';

interface EnhancedAudioCaptureProps {
  onTranscriptionComplete?: (segments: any) => void;
  onTranscriptionUpdate?: (segments: any) => void;
}

export const EnhancedAudioCapture: React.FC<EnhancedAudioCaptureProps> = ({
  onTranscriptionComplete,
  onTranscriptionUpdate
}) => {
  return (
    <div className="p-4 border rounded">
      <p>Audio Capture Component</p>
    </div>
  );
};
