/**
 * NOTES POST CONSULTATION DICTATION - Modo Dictado Post-Consulta
 * 
 * Componente placeholder para el modo de dictado después de la consulta.
 * Optimizado para un solo hablante (el profesional).
 */

import React, { useState } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PlayIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PostConsultationDictationProps {
  patientName?: string;
  onComplete?: (transcription: string) => void;
  onBack?: () => void;
}

export default function PostConsultationDictation({ 
  patientName = 'el paciente',
  onComplete,
  onBack 
}: PostConsultationDictationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implementar grabación de audio real
    console.log('Iniciando grabación de dictado...');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simular procesamiento
    setTimeout(() => {
      setTranscription('Paciente presenta dolor lumbar crónico de 2 semanas de evolución. Al examen físico se observa contractura en músculos paravertebrales L4-L5. Test de Lasègue positivo en miembro inferior derecho. Se recomienda programa de ejercicios de estabilización lumbar y terapia manual.');
      setIsProcessing(false);
    }, 2000);
  };

  const handleComplete = () => {
    if (onComplete && transcription) {
      onComplete(transcription);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dictado Post-Consulta
        </h1>
        <p className="text-lg text-gray-600">
          Dicta un resumen de la consulta con {patientName}
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <DocumentTextIcon className="w-4 h-4 mr-1" />
          Optimizado para un solo hablante
        </div>
      </div>

      {/* Recording Section */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 mb-6">
        <div className="text-center">
          {!isRecording && !transcription && (
            <div>
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MicrophoneIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Listo para dictar
                </h3>
                <p className="text-gray-600 mb-6">
                  Haz clic en "Iniciar Dictado" y comienza a narrar el resumen de la consulta
                </p>
              </div>
              
              <button
                onClick={handleStartRecording}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <MicrophoneIcon className="w-5 h-5 mr-2" />
                Iniciar Dictado
              </button>
            </div>
          )}

          {isRecording && (
            <div>
              <div className="mb-6">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <MicrophoneIcon className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Grabando...
                </h3>
                <p className="text-gray-600 mb-6">
                  Estás dictando. Habla claramente y describe los hallazgos de la consulta
                </p>
                <div className="flex space-x-2 justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              
              <button
                onClick={handleStopRecording}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <StopIcon className="w-5 h-5 mr-2" />
                Detener Grabación
              </button>
            </div>
          )}

          {isProcessing && (
            <div>
              <div className="mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Procesando...
                </h3>
                <p className="text-gray-600">
                  Analizando el dictado y generando notas SOAP
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcription Preview */}
      {transcription && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Transcripción Generada
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 leading-relaxed">
              {transcription}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setTranscription('')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Dictar de nuevo
            </button>
            <button
              onClick={handleComplete}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Continuar con Análisis
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Volver al selector de modos
        </button>
      </div>
    </div>
  );
} 