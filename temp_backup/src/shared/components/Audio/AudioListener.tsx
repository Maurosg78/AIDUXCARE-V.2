import React, { useState } from 'react';
import { audioCaptureService, TranscriptionSegment } from '@/core/audio/AudioCaptureService';

interface AudioListenerProps {
  onCaptureComplete: (transcription: TranscriptionSegment[]) => void;
}

/**
 * Componente para controlar la captura de audio y visualizar el estado
 */
const AudioListener: React.FC<AudioListenerProps> = ({ onCaptureComplete }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerId, setTimerId] = useState<number | null>(null);

  // Iniciar la captura de audio
  const startCapture = () => {
    if (isCapturing) return;

    audioCaptureService.startCapture();
    setIsCapturing(true);
    setElapsedTime(0);

    // Iniciar un contador para mostrar el tiempo transcurrido
    const id = window.setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    setTimerId(id);
  };

  // Detener la captura y procesar los resultados
  const stopCapture = () => {
    if (!isCapturing) return;

    // Limpiar el timer
    if (timerId !== null) {
      window.clearInterval(timerId);
      setTimerId(null);
    }

    // Detener la captura y obtener resultados
    const transcription = audioCaptureService.stopCapture();
    setIsCapturing(false);
    
    // Notificar al componente padre con los resultados
    onCaptureComplete(transcription);
  };

  // Formatear el tiempo transcurrido en formato mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">
          Escucha Activa Clínica
        </h3>
        {isCapturing && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium text-red-600">Grabando: {formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Inicie la escucha activa para capturar y transcribir la conversación clínica. 
        La transcripción debe ser revisada antes de incorporarla al EMR.
      </p>
      
      <div className="flex space-x-3">
        {!isCapturing ? (
          <button
            onClick={startCapture}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Iniciar Escucha
            </span>
          </button>
        ) : (
          <button
            onClick={stopCapture}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Detener Escucha
            </span>
          </button>
        )}
      </div>
      
      {isCapturing && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Importante:</span> La grabación en curso requiere el consentimiento informado del paciente. 
            Solo se transcribirá el audio cuando se detenga la grabación y deberá revisarse antes de su incorporación al sistema.
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioListener; 