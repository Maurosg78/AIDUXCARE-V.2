/**
 * 🏥 AiDuxCare Professional - Página de Integración Completa
 * OPCIÓN 3: FULL INTEGRATION PROFESIONAL
 * 
 * Pipeline completo: Audio → STT → Ollama NLP → SOAP → Agentes → UI
 * Escalable para múltiples fisioterapeutas
 * 
 * @version 1.0.0
 * @author Implementador Jefe
 */

import React, { useState, useCallback, useEffect } from 'react';
import ProfessionalAudioProcessor from '@/components/professional/ProfessionalAudioProcessor';
import AgentSuggestionsViewer from '@/shared/components/Agent/AgentSuggestionsViewer';
import { AudioProcessingResult } from '@/services/AudioProcessingServiceProfessional';
import { AgentSuggestion } from '@/types/agent';
import { NLPServiceOllama } from '@/services/nlpServiceOllama';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';

interface ProfessionalIntegrationPageProps {
  // Datos de la sesión
  visitId?: string;
  userId?: string;
  patientId?: string;
}

interface SystemStatus {
  ollama: 'checking' | 'healthy' | 'unhealthy';
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
    ollama: 'checking',
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
      ollama: 'checking',
      nlp: 'checking', 
      audio: 'checking',
      integration: 'checking'
    });

    try {
      // 1. Verificar Ollama
      setSystemStatus(prev => ({ ...prev, ollama: 'checking' }));
      const ollamaHealth = await NLPServiceOllama.healthCheck();
      setSystemStatus(prev => ({ 
        ...prev, 
        ollama: ollamaHealth.status === 'healthy' ? 'healthy' : 'unhealthy' 
      }));

      // 2. Verificar NLP Service
      setSystemStatus(prev => ({ ...prev, nlp: 'checking' }));
      if (ollamaHealth.status === 'healthy') {
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
      const allHealthy = ollamaHealth.status === 'healthy' && hasAudioAccess;
      
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
          ollama: ollamaHealth.status,
          audio: navigator.mediaDevices ? 'available' : 'unavailable'
        }
      });

    } catch (error) {
      console.error('Error inicializando sistemas:', error);
      setError(`Error de inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      setSystemStatus({
        ollama: 'unhealthy',
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
    setSuggestions(result.agentSuggestions);
    setError(null);

    // Auditoría de procesamiento exitoso
    AuditLogger.log('audio.processing.integrated', {
      userId,
      visitId,
      patientId,
      processingId: result.processingId,
      entitiesCount: result.entities.length,
      suggestionsCount: result.agentSuggestions.length,
      qualityScore: result.qualityAssessment.overall_score
    });

    // Métrica de integración completa
    trackMetric('suggestions_generated', {
      suggestionId: result.processingId,
      suggestionType: 'recommendation' as const, 
      suggestionField: 'notes'
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
  const handleProcessingError = useCallback((errorMessage: string) => {
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
  const handleSuggestionRejected = useCallback((suggestion: AgentSuggestion) => {
    console.log('Sugerencia rechazada:', suggestion);
    
    // Auditoría
    AuditLogger.log('suggestion.rejected', {
      userId,
      visitId,
      patientId,
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      suggestionField: suggestion.field
    });

    // Métrica
    trackMetric('suggestions_rejected', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type === 'diagnostic' ? 'recommendation' : suggestion.type as 'recommendation' | 'warning' | 'info',
      suggestionField: suggestion.field
    }, userId, visitId);

  }, [userId, visitId, patientId]);

  /**
   * Renderiza el estado del sistema
   */
  const renderSystemStatus = () => {
    const getStatusIcon = (status: 'checking' | 'healthy' | 'unhealthy') => {
      switch (status) {
        case 'checking': return '🔄';
        case 'healthy': return '✅';
        case 'unhealthy': return '❌';
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
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏥 Estado del Sistema Profesional
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(systemStatus.ollama)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Ollama LLM</div>
              <div className={`text-xs ${getStatusColor(systemStatus.ollama)}`}>
                {systemStatus.ollama === 'checking' ? 'Verificando...' :
                 systemStatus.ollama === 'healthy' ? 'Operativo' : 'Error'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(systemStatus.nlp)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">NLP Service</div>
              <div className={`text-xs ${getStatusColor(systemStatus.nlp)}`}>
                {systemStatus.nlp === 'checking' ? 'Verificando...' :
                 systemStatus.nlp === 'healthy' ? 'Operativo' : 'Error'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(systemStatus.audio)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Audio API</div>
              <div className={`text-xs ${getStatusColor(systemStatus.audio)}`}>
                {systemStatus.audio === 'checking' ? 'Verificando...' :
                 systemStatus.audio === 'healthy' ? 'Disponible' : 'No disponible'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(systemStatus.integration)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Integración</div>
              <div className={`text-xs ${getStatusColor(systemStatus.integration)}`}>
                {systemStatus.integration === 'checking' ? 'Verificando...' :
                 systemStatus.integration === 'healthy' ? 'Completa' : 'Incompleta'}
              </div>
            </div>
          </div>
        </div>

        {!isInitialized && (
          <div className="mt-4">
            <button
              onClick={initializeSystems}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Inicializar Sistema
            </button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renderiza el resumen de resultados
   */
  const renderResultsSummary = () => {
    if (!processingResult) return null;

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Resumen de Procesamiento
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {processingResult.entities.length}
            </div>
            <div className="text-sm text-gray-600">Entidades Clínicas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {processingResult.agentSuggestions.length}
            </div>
            <div className="text-sm text-gray-600">Sugerencias</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {processingResult.qualityAssessment.overall_score}/100
            </div>
            <div className="text-sm text-gray-600">Score Calidad</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              $0.00
            </div>
            <div className="text-sm text-gray-600">Costo Total</div>
          </div>
        </div>

        {processingResult.qualityAssessment.requires_review && (
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800">
              ⚠️ Requiere revisión manual
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inicialización automática
  useEffect(() => {
    if (!isInitialized) {
      initializeSystems();
    }
  }, [initializeSystems, isInitialized]);

  return (
    <div className="professional-integration-page min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 AiDuxCare Professional
          </h1>
          <p className="text-lg text-gray-600">
            Integración completa: Audio → STT → Ollama NLP → SOAP → Agentes → UI
          </p>
          <div className="text-sm text-gray-500 mt-1">
            Sessión: {visitId} | Paciente: {patientId} | Usuario: {userId}
          </div>
        </div>

        {/* Estado del Sistema */}
        {renderSystemStatus()}

        {/* Error Global */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg">⚠️</span>
              <div>
                <div className="font-medium text-red-800">Error del Sistema</div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Resultados */}
        {renderResultsSummary()}

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel Izquierdo: Procesamiento de Audio */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ProfessionalAudioProcessor
                visitId={visitId}
                userId={userId}
                patientId={patientId}
                onProcessingComplete={handleProcessingComplete}
                onSuggestionsGenerated={handleSuggestionsGenerated}
                onError={handleProcessingError}
              />
            </div>
          </div>

          {/* Panel Derecho: Sugerencias del Agente */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
          
        </div>

        {/* Footer Profesional */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <div className="mb-2">
              🤖 <strong>Powered by Ollama Local LLM</strong> - Costo: $0.00 por transcripción
            </div>
            <div>
              Escalable para múltiples fisioterapeutas • Integración profesional completa
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfessionalIntegrationPage; 