import React, { useState, useEffect } from 'react';
import { useAiModeStore, useLocalTranscriptions, usePromoteToProOnReconnect } from '../stores/aiModeStore';
import { LocalTranscription } from '../stores/aiModeStore';

interface PromoteToProButtonProps {
  transcriptionId?: string;
  onPromote?: (proTranscription: ProTranscriptionResult) => void;
  className?: string;
}

interface ProTranscriptionResult {
  id: string;
  originalText: string;
  proText: string;
  confidence: number;
  improvements: string[];
  processingTime: number;
  timestamp: Date;
}

export const PromoteToProButton: React.FC<PromoteToProButtonProps> = ({
  transcriptionId,
  onPromote,
  className = ''
}) => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<ProTranscriptionResult | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localTranscriptions = useLocalTranscriptions();
  const promoteToProOnReconnect = usePromoteToProOnReconnect();
  const { addPendingUpload, removePendingUpload } = useAiModeStore();

  // Detectar transcripción específica o usar la más reciente
  const targetTranscription = transcriptionId 
    ? localTranscriptions.find(t => t.id === transcriptionId)
    : localTranscriptions[localTranscriptions.length - 1];

  // Auto-promoción al reconectar (si está habilitada)
  useEffect(() => {
    if (promoteToProOnReconnect && targetTranscription && navigator.onLine) {
      const handleOnline = () => {
        console.log('Promote to Pro: Conexión restaurada, iniciando promoción automática...');
        handlePromoteToPro();
      };

      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [promoteToProOnReconnect, targetTranscription]);

  // Función principal de promoción
  const handlePromoteToPro = async () => {
    if (!targetTranscription) {
      setError('No hay transcripción disponible para promocionar');
      return;
    }

    setIsPromoting(true);
    setError(null);

    try {
      // Agregar a cola de uploads pendientes
      const pendingUpload = {
        id: crypto.randomUUID(),
        transcriptionId: targetTranscription.id,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      };

      addPendingUpload(pendingUpload);

      // Simular llamada al servidor (en implementación real, usar endpoint real)
      const result = await promoteTranscriptionToPro(targetTranscription);

      // Remover de cola de pendientes
      removePendingUpload(pendingUpload.id);

      setPromotionResult(result);
      
      // Notificar al componente padre
      if (onPromote) {
        onPromote(result);
      }

      console.log('Promote to Pro: Transcripción promocionada exitosamente');

    } catch (error) {
      console.error('Promote to Pro: Error en promoción:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido en promoción');
    } finally {
      setIsPromoting(false);
    }
  };

  // Simular promoción al servidor (placeholder)
  const promoteTranscriptionToPro = async (transcription: LocalTranscription): Promise<ProTranscriptionResult> => {
    // En implementación real, llamar al endpoint de Functions
    // Por ahora, simular procesamiento
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simular mejoras de IA Pro
    const improvements = [
      'Terminología médica corregida',
      'Estructura SOAP aplicada',
      'Entidades clínicas identificadas',
      'Confianza aumentada del 65% al 92%'
    ];

    return {
      id: transcription.id,
      originalText: transcription.text,
      proText: transcription.text.replace(
        '[Audio capturado - modo offline]',
        'Paciente refiere dolor lumbar de 3 días de evolución, con irradiación a miembro inferior derecho. No hay antecedentes de trauma. El dolor se agrava con la sedestación prolongada y mejora con el decúbito lateral.'
      ),
      confidence: 0.92,
      improvements,
      processingTime: 1500,
      timestamp: new Date()
    };
  };

  // Renderizar diff entre versión local y Pro
  const renderDiff = () => {
    if (!promotionResult) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold text-gray-800 mb-3">Comparación Local vs Pro</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Local Draft</h5>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-gray-700">
              {promotionResult.originalText}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Clinically Verified</h5>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-700">
              {promotionResult.proText}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-600 mb-2">Mejoras aplicadas:</h5>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {promotionResult.improvements.map((improvement, index) => (
              <li key={index} className="text-green-700">{improvement}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Procesado en {promotionResult.processingTime}ms • Confianza: {Math.round(promotionResult.confidence * 100)}%
        </div>
      </div>
    );
  };

  // No mostrar si no hay transcripciones locales
  if (!targetTranscription) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botón principal */}
      <button
        onClick={handlePromoteToPro}
        disabled={isPromoting}
        className={`
          px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${isPromoting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 to-blue-700 hover:shadow-lg'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isPromoting ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Promocionando...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Actualizar con IA Pro</span>
          </span>
        )}
      </button>

      {/* Estado de la transcripción */}
      <div className="text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            targetTranscription.confidence > 0.7 ? 'bg-green-400' : 'bg-yellow-400'
          }`} />
          <span>
            Local STT • 
            Confianza: {Math.round(targetTranscription.confidence * 100)}%
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {targetTranscription.timestamp.toLocaleString()}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resultado de promoción */}
      {promotionResult && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Promoción Completada</h3>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showDiff ? 'Ocultar' : 'Mostrar'} comparación
            </button>
          </div>
          
          {showDiff && renderDiff()}
        </div>
      )}
    </div>
  );
};

export default PromoteToProButton;
