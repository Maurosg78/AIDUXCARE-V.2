import React, { useState } from "react";

interface AudioCaptureSectionProps {
  visitId: string;
}

const AudioCaptureSection: React.FC<AudioCaptureSectionProps> = ({
  visitId,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  // Usar visitId para registrar eventos si fuera necesario
  const handleStartCapture = () => {
    setIsRecording(true);
    console.log(`Iniciando captura para la visita ${visitId}`);
  };

  const handleStopCapture = () => {
    setIsRecording(false);
    console.log(`Deteniendo captura para la visita ${visitId}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-900">Escucha Activa</h2>
      <p className="text-sm text-gray-500">
        Capture la conversación con el paciente para generar documentación
        clínica
      </p>

      <div className="flex space-x-3 mt-6">
        {!isRecording ? (
          <button
            onClick={handleStartCapture}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Iniciar Escucha
          </button>
        ) : (
          <button
            onClick={handleStopCapture}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Detener Escucha
          </button>
        )}
      </div>

      {isRecording && (
        <div className="py-3 px-4 bg-red-50 border border-red-100 rounded-md">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <p className="text-red-700 text-sm font-medium">Grabando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioCaptureSection;
