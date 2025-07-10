/**
 * 🔧 PÁGINA DE DEBUG: Aislamiento del AudioPipelineService
 * Para diagnosticar el bug de chunks repetidos
 */

import { useState } from 'react';

export function DebugAudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');

  const handleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranscription(''); // Limpiar transcripción al iniciar
    }
  };

  return (
    <div className="debug-page">
      <h1>Debug Audio</h1>
      <button onClick={handleRecording}>
        {isRecording ? 'Detener' : 'Grabar'}
      </button>
      <div className="transcription">
        <h2>Transcripción:</h2>
        <p>{transcription}</p>
      </div>
    </div>
  );
} 