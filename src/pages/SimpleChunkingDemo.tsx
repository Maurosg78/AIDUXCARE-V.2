import React, { useState, useEffect, useRef } from 'react';
import { SimpleChunkingService, MAURICIO_AGGRESSIVE, SimpleChunkResult } from '../services/SimpleChunkingService';

export default function SimpleChunkingDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [chunks, setChunks] = useState<SimpleChunkResult[]>([]);
  const [bufferStatus, setBufferStatus] = useState({
    currentWords: 0,
    isWaiting: false
  });

  const chunkingServiceRef = useRef<SimpleChunkingService | null>(null);

  useEffect(() => {
    // Inicializar servicio con configuración MAURICIO_AGGRESSIVE
    chunkingServiceRef.current = new SimpleChunkingService(MAURICIO_AGGRESSIVE, {
      onSessionUpdate: (transcript: string, wordCount: number) => {
        setCurrentTranscript(transcript);
        setBufferStatus({
          currentWords: wordCount,
          isWaiting: true
        });
      },
      onChunkProcessed: (result: SimpleChunkResult) => {
        console.log('TARGET: Chunk procesado:', result);
        setChunks(prev => [...prev, result]);
      },
      onError: (error: string) => {
        console.error('ERROR: Error en chunking:', error);
        alert(`Error: ${error}`);
      }
    });

    return () => {
      if (chunkingServiceRef.current) {
        chunkingServiceRef.current.stopRecording();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (!chunkingServiceRef.current) return;
    
    try {
      await chunkingServiceRef.current.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      alert(`Error: ${error}`);
    }
  };

  const handleStopRecording = async () => {
    if (!chunkingServiceRef.current) return;
    
    try {
      await chunkingServiceRef.current.stopRecording();
      setIsRecording(false);
      setBufferStatus(prev => ({ ...prev, isWaiting: false }));
    } catch (error) {
      console.error('Error deteniendo grabación:', error);
    }
  };

  const handleClear = () => {
    setCurrentTranscript('');
    setChunks([]);
    setBufferStatus({
      currentWords: 0,
      isWaiting: false
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#dcfce7', 
        border: '2px solid #16a34a',
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#15803d', margin: '0 0 10px 0', fontSize: '28px' }}>
          SUCCESS: NO más sílaba por sílaba - Chunking Semántico
        </h1>
        <p style={{ color: '#166534', margin: '0', fontSize: '16px' }}>
          <strong>MAURICIO_AGGRESSIVE:</strong> 50 palabras mín • 3000ms pausa • interimResults=false
        </p>
      </div>

      {/* Control */}
      <div style={{ 
        backgroundColor: '#f8fafc', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            style={{
              backgroundColor: isRecording ? '#94a3b8' : '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: isRecording ? 'not-allowed' : 'pointer'
            }}
          >
            {isRecording ? 'RED: Grabando...' : 'MIC: Iniciar'}
          </button>
          
          <button
            onClick={handleStopRecording}
            disabled={!isRecording}
            style={{
              backgroundColor: !isRecording ? '#94a3b8' : '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: !isRecording ? 'not-allowed' : 'pointer'
            }}
          >
            STOP: Detener
          </button>
          
          <button onClick={handleClear} style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            TRASH: Limpiar
          </button>
        </div>

        <div style={{ 
          backgroundColor: bufferStatus.isWaiting ? '#fef3c7' : '#f3f4f6',
          padding: '15px',
          borderRadius: '6px'
        }}>
          <strong>STATS: Buffer:</strong> {bufferStatus.currentWords}/50 palabras • 
          Estado: {bufferStatus.isWaiting ? 'Acumulando' : 'Detenido'}
        </div>
      </div>

      {/* Transcripción */}
      {currentTranscript && (
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: '0' }}>TARGET: Transcripción Acumulada</h3>
          <div style={{ 
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '6px',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            {currentTranscript}
          </div>
        </div>
      )}

      {/* Chunks */}
      {chunks.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: '0' }}>🧩 Chunks Procesados ({chunks.length})</h3>
          
          {chunks.map((result, index) => (
            <div key={result.chunk.id} style={{ 
              backgroundColor: '#f9fafb',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '15px'
            }}>
              <h4>Chunk #{index + 1} - {result.chunk.utterances.length} utterances</h4>
              
              {result.chunk.utterances.map((utterance, uIndex) => (
                <div key={uIndex} style={{ 
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: utterance.speaker === 'PATIENT' ? '#eff6ff' : '#f0fdf4',
                  borderRadius: '4px'
                }}>
                  <strong>{utterance.speaker}:</strong> {utterance.text}
                </div>
              ))}
              
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
                Confianza: {Math.round(result.confidence * 100)}% • 
                Tiempo: {result.processingTime}ms
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
