import React from 'react';

interface ProcessingStatusProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isAnalyzing: boolean;
  transcriptLength?: number;
  error?: string | null;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  isRecording,
  isTranscribing,
  isAnalyzing,
  transcriptLength,
  error
}) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-800">⚠️ {error}</p>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 animate-pulse">
        <p className="text-blue-800 font-medium">🔴 Grabando consulta...</p>
        <p className="text-sm text-blue-600 mt-1">Hable claramente cerca del micrófono</p>
      </div>
    );
  }

  if (isTranscribing) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
          <p className="text-yellow-800 font-medium">Procesando audio...</p>
        </div>
        <p className="text-sm text-yellow-600 mt-2">Transcribiendo consulta</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          <p className="text-purple-800 font-medium">Analizando consulta...</p>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-sm text-purple-600 flex items-center">
            <span className="mr-2">•</span> Identificando información clínica relevante
          </p>
          <p className="text-sm text-purple-600 flex items-center">
            <span className="mr-2">•</span> Detectando posibles advertencias
          </p>
          <p className="text-sm text-purple-600 flex items-center">
            <span className="mr-2">•</span> Generando propuestas de evaluación
          </p>
        </div>
      </div>
    );
  }

  return null;
};
