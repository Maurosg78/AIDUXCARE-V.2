import React from 'react';
type Props = {
  onSegments?:(s:any)=>void;
  onTranscriptionUpdate?:(s:any)=>void;
  onTranscriptionComplete?:(s:any)=>void;
  className?: string;
};
const EnhancedAudioCapture: React.FC<Props> = ()=> null;
export default EnhancedAudioCapture;
export { EnhancedAudioCapture };
