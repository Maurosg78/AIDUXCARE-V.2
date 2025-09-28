// @ts-nocheck
/**
 * 🔧 PÁGINA DE DEBUG: Aislamiento del AudioPipelineService
 * Para diagnosticar el bug de chunks repetidos
 */
import { useState } from 'react';

export default function DebugAudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');

  const handleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranscription(''); // Limpiar transcripción al iniciar
    }
  };

  return (
    <div className="debug-page" style={{ padding: '2rem' }}>
      <h1>🔧 Debug Audio Pipeline</h1>
      <button onClick={handleRecording} style={{ padding: '1rem 2rem', fontSize: '1.2rem', backgroundColor: isRecording ? '#DC2626' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px' }}>
        {isRecording ? '🛑 Detener Grabación' : '🎤 Iniciar Grabación'}
      </button>
      <div className="transcription" style={{ marginTop: '2rem' }}>
        <h2>Transcripción:</h2>
        <div style={{ padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px', minHeight: '200px' }}>
          <p>{transcription || 'Esperando transcripción...'}</p>
        </div>
      </div>
    </div>
  );
}