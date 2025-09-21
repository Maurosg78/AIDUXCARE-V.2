import React, { useState } from 'react';

export const MicrophoneTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const testMicrophone = async () => {
    try {
      setStatus('🎤 Requesting microphone access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      setStatus('✅ Microphone access granted!');
      setStream(mediaStream);
      
      // Test audio levels
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setStatus(`🎵 Audio level: ${Math.round(average)} (speak now to test)`);
        
        if (average > 10) {
          setStatus('🎯 MICROPHONE WORKING! Audio detected.');
          return;
        }
        
        setTimeout(checkAudio, 100);
      };
      
      checkAudio();
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      console.error('Microphone test failed:', error);
    }
  };

  const stopTest = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStatus('Stopped');
  };

  const testSpeechRecognition = () => {
    try {
      setStatus('🎙️ Testing Speech Recognition...');
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        setStatus('❌ Speech Recognition not supported');
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setStatus('🎙️ Speech Recognition active - say something!');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setStatus(`✅ SUCCESS! Heard: "${transcript}"`);
      };
      
      recognition.onerror = (event: any) => {
        setStatus(`❌ Speech Recognition error: ${event.error}`);
      };
      
      recognition.onend = () => {
        if (status.includes('active')) {
          setStatus('❌ No speech detected');
        }
      };
      
      recognition.start();
      
    } catch (error) {
      setStatus(`❌ Speech Recognition failed: ${error.message}`);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">🔧 Diagnóstico de Micrófono</h3>
      
      <div className="mb-4 p-3 bg-white rounded border">
        <strong>Estado:</strong> {status}
      </div>
      
      <div className="space-x-2">
        <button 
          onClick={testMicrophone}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Micrófono
        </button>
        
        <button 
          onClick={testSpeechRecognition}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Speech Recognition
        </button>
        
        <button 
          onClick={stopTest}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>1. Primero test "Test Micrófono" - debería mostrar niveles de audio</p>
        <p>2. Luego "Test Speech Recognition" - di algo en español</p>
      </div>
    </div>
  );
};
