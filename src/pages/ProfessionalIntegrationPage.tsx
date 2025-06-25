/**
 * 🏥 AiDuxCare Professional - Página de Integración Completa
 * OPCIÓN 3: FULL INTEGRATION PROFESIONAL
 * 
 * Pipeline completo: Audio → STT → Google Cloud AI → SOAP → Agentes → UI
 * Escalable para múltiples fisioterapeutas
 * 
 * @version 2.0.0
 * @author Implementador Jefe
 */

import React, { useState, useCallback, useEffect } from 'react';
import ProfessionalAudioProcessor from '@/components/professional/ProfessionalAudioProcessor';
import AgentSuggestionsViewer from '@/shared/components/Agent/AgentSuggestionsViewer';
import { AudioProcessingResult } from '@/services/AudioProcessingServiceProfessional';
import { AgentSuggestion } from '@/types/agent';
import { textProcessingService } from '@/services/TextProcessingService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';

interface ProfessionalIntegrationPageProps {
  // Datos de la sesión
  visitId?: string;
  userId?: string;
  patientId?: string;
}

interface SystemStatus {
  googleCloudAI: 'checking' | 'healthy' | 'unhealthy';
  nlp: 'checking' | 'healthy' | 'unhealthy';
  audio: 'checking' | 'healthy' | 'unhealthy';
  integration: 'checking' | 'healthy' | 'unhealthy';
}

export const ProfessionalIntegrationPage: React.FC<ProfessionalIntegrationPageProps> = ({
  visitId = `visit_${Date.now()}`,
  userId = 'professional_user',
  patientId = `patient_${Date.now()}`
}) => {
  const [processingResult, setProcessingResult] = useState<AudioProcessingResult | null>(null);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    googleCloudAI: 'checking',
    nlp: 'checking',
    audio: 'checking',
    integration: 'checking'
  });
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Inicializa y verifica todos los sistemas
   */
  const initializeSystems = useCallback(async () => {
    // Reset status
    setSystemStatus({
      googleCloudAI: 'checking',
      nlp: 'checking', 
      audio: 'checking',
      integration: 'checking'
    });

    try {
      // 1. Verificar Google Cloud AI
      setSystemStatus(prev => ({ ...prev, googleCloudAI: 'checking' }));
      const googleCloudHealth = await textProcessingService.checkHealth();
      setSystemStatus(prev => ({ 
        ...prev, 
        googleCloudAI: googleCloudHealth ? 'healthy' : 'unhealthy' 
      }));

      // 2. Verificar NLP Service
      setSystemStatus(prev => ({ ...prev, nlp: 'checking' }));
      if (googleCloudHealth) {
        setSystemStatus(prev => ({ ...prev, nlp: 'healthy' }));
      } else {
        setSystemStatus(prev => ({ ...prev, nlp: 'unhealthy' }));
      }

      // 3. Verificar Audio API
      setSystemStatus(prev => ({ ...prev, audio: 'checking' }));
      const hasAudioAccess = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
      if (hasAudioAccess) {
        setSystemStatus(prev => ({ ...prev, audio: 'healthy' }));
      } else {
        setSystemStatus(prev => ({ ...prev, audio: 'unhealthy' }));
      }

      // 4. Estado de integración
      const allHealthy = googleCloudHealth && hasAudioAccess;
      
      setSystemStatus(prev => ({ 
        ...prev, 
        integration: allHealthy ? 'healthy' : 'unhealthy' 
      }));

      setIsInitialized(true);

      // Auditoría de inicialización
      AuditLogger.log('system.initialization.completed', {
        userId,
        visitId,
        patientId,
        systemStatus: {
          googleCloudAI: googleCloudHealth ? 'healthy' : 'unhealthy',
          audio: navigator.mediaDevices ? 'available' : 'unavailable'
        }
      });

    } catch (error) {
      console.error('Error inicializando sistemas:', error);
      setError(`Error de inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      setSystemStatus({
        googleCloudAI: 'unhealthy',
        nlp: 'unhealthy',
        audio: 'unhealthy',
        integration: 'unhealthy'
      });
    }
  }, [userId, visitId, patientId]);

  /**
   * Maneja la finalización del procesamiento de audio
   */
  const handleProcessingComplete = useCallback((result: AudioProcessingResult) => {
    setProcessingResult(result);
    setSuggestions([]);
    setError(null);

    // Auditoría de procesamiento exitoso
    AuditLogger.log('audio.processing.integrated', {
      userId,
      visitId,
      patientId,
      processingTime: result.processingTime,
      confidence: result.confidence,
      audioQuality: result.audioQuality
    });

    // Métrica de integración completa
    trackMetric('suggestions_generated', {
      suggestionId: `audio_processing_${Date.now()}`,
      suggestionType: 'info' as const,
      suggestionField: 'transcription'
    }, userId, visitId);

  }, [userId, visitId, patientId]);

  /**
   * Maneja la generación de sugerencias
   */
  const handleSuggestionsGenerated = useCallback((newSuggestions: AgentSuggestion[]) => {
    setSuggestions(prev => [...prev, ...newSuggestions]);
  }, []);

  /**
   * Maneja errores del procesamiento
   */
  const handleProcessingError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    setError(errorMessage);
    
    // Auditoría de error
    AuditLogger.log('audio.processing.error', {
      userId,
      visitId,
      patientId,
      error: errorMessage
    });
  }, [userId, visitId, patientId]);

  /**
   * Maneja aceptación de sugerencias
   */
  const handleSuggestionAccepted = useCallback((suggestion: AgentSuggestion) => {
    console.log('Sugerencia aceptada:', suggestion);
    
    // Auditoría
    AuditLogger.log('suggestion.accepted', {
      userId,
      visitId,
      patientId,
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      suggestionField: suggestion.field
    });

    // Métrica
    trackMetric('suggestions_accepted', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type === 'diagnostic' ? 'recommendation' : suggestion.type as 'recommendation' | 'warning' | 'info',
      suggestionField: suggestion.field
    }, userId, visitId);

  }, [userId, visitId, patientId]);

  /**
   * Maneja rechazo de sugerencias
   */
  const handleSuggestionRejected = useCallback((suggestion: AgentSuggestion, reason?: string) => {
    console.log('Sugerencia rechazada:', suggestion, 'Razón:', reason);
    
    // Auditoría
    AuditLogger.log('suggestion.rejected', {
      userId,
      visitId,
      patientId,
      suggestionId: suggestion.id,
      reason
    });
  }, [userId, visitId, patientId]);

  // Inicializar en mount
  useEffect(() => {
    initializeSystems();
  }, [initializeSystems]);

  /**
   * Render del estado de sistemas
   */
  const renderSystemStatus = () => {
    const getStatusIcon = (status: 'checking' | 'healthy' | 'unhealthy') => {
      switch (status) {
        case 'checking': return 'RELOAD:';
        case 'healthy': return 'SUCCESS:';
        case 'unhealthy': return 'ERROR:';
      }
    };

    const getStatusColor = (status: 'checking' | 'healthy' | 'unhealthy') => {
      switch (status) {
        case 'checking': return 'text-blue-600';
        case 'healthy': return 'text-green-600';
        case 'unhealthy': return 'text-red-600';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon(systemStatus.googleCloudAI)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Google Cloud AI</div>
              <div className={`text-xs ${getStatusColor(systemStatus.googleCloudAI)}`}>
                {systemStatus.googleCloudAI === 'checking' ? 'Verificando...' :
                 systemStatus.googleCloudAI === 'healthy' ? 'Operativo' : 'Error'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon(systemStatus.nlp)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Procesamiento NLP</div>
              <div className={`text-xs ${getStatusColor(systemStatus.nlp)}`}>
                {systemStatus.nlp === 'checking' ? 'Verificando...' :
                 systemStatus.nlp === 'healthy' ? 'Operativo' : 'Error'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon(systemStatus.audio)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Audio API</div>
              <div className={`text-xs ${getStatusColor(systemStatus.audio)}`}>
                {systemStatus.audio === 'checking' ? 'Verificando...' :
                 systemStatus.audio === 'healthy' ? 'Operativo' : 'Error'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon(systemStatus.integration)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Integración</div>
              <div className={`text-xs ${getStatusColor(systemStatus.integration)}`}>
                {systemStatus.integration === 'checking' ? 'Verificando...' :
                 systemStatus.integration === 'healthy' ? 'Lista' : 'Error'}
              </div>
            </div>
          </div>
        </div>

        {systemStatus.integration === 'unhealthy' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">
              <strong>Sistema no está listo:</strong>
              <ul className="mt-1 list-disc list-inside">
                {systemStatus.googleCloudAI === 'unhealthy' && <li>Google Cloud AI no está disponible</li>}
                {systemStatus.audio === 'unhealthy' && <li>Acceso al micrófono no disponible</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render de resumen de resultados
   */
  const renderResultsSummary = () => {
    if (!processingResult) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Resultados</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(processingResult.confidence * 100)}%
            </div>
            <div className="text-sm text-blue-800">Confianza de Transcripción</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {processingResult.processingTime}ms
            </div>
            <div className="text-sm text-green-800">Tiempo de Procesamiento</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {processingResult.audioQuality}
            </div>
            <div className="text-sm text-purple-800">Calidad de Audio</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AiDuxCare Professional Integration
              </h1>
              <p className="text-gray-600 mt-1">
                Integración completa: Audio → STT → Google Cloud AI → SOAP → Agentes → UI
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Sesión: {visitId}</div>
              <div className="text-sm text-gray-500">Paciente: {patientId}</div>
            </div>
          </div>
        </div>

        {/* Estado del Sistema */}
        {renderSystemStatus()}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">ERROR:</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error en el Procesamiento
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Resultados */}
        {renderResultsSummary()}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Audio */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Procesamiento de Audio
            </h2>
            <ProfessionalAudioProcessor
              visitId={visitId}
              userId={userId}
              patientId={patientId}
              onProcessingComplete={handleProcessingComplete}
              onError={handleProcessingError}
            />
          </div>

          {/* Panel de Sugerencias */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sugerencias del Agente IA
            </h2>
            <AgentSuggestionsViewer
              visitId={visitId}
              suggestions={suggestions}
              onSuggestionAccepted={handleSuggestionAccepted}
              onSuggestionRejected={handleSuggestionRejected}
              userId={userId}
              patientId={patientId}
            />
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              BOT: <strong>Powered by Google Cloud AI</strong> - Escalable y Preciso
            </h3>
            <p className="text-sm text-gray-600">
              Pipeline completo de análisis médico con Vertex AI y Gemini-1.5-pro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalIntegrationPage; 