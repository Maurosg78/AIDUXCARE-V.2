/**
 * @file AgentSuggestionsViewer.tsx
 * @description Componente que muestra y gestiona las sugerencias generadas por el agente clínico.
 * Permite integrar sugerencias al EMR, manejar errores y proporcionar feedback.
 * 
 * @version 2.0.0
 * @lastModified 2024-03-20
 * 
 * @component
 * @example
 * ```tsx
 * <AgentSuggestionsViewer
 *   visitId="visit-123"
 *   suggestions={suggestions}
 *   onSuggestionAccepted={handleAccept}
 *   onSuggestionRejected={handleReject}
 * />
 * ```
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { AgentSuggestion, SuggestionType } from '@/types/agent';
import { trackMetric, UsageMetricType } from '@/services/UsageAnalyticsService';
import { EMRFormService } from '@/core/services/EMRFormService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { Button } from '../UI/Button';

/**
 * Tipos de sugerencias que se pueden integrar al EMR
 * @constant
 */
const INTEGRABLE_SUGGESTION_TYPES = ['recommendation', 'warning', 'info'] as const;
type IntegrableSuggestionType = typeof INTEGRABLE_SUGGESTION_TYPES[number];

/**
 * Mensajes de error estandarizados del componente
 * @constant
 */
const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión al integrar la sugerencia',
  VALIDATION: 'La sugerencia no cumple con los requisitos de validación',
  INTEGRATION: 'Error al integrar la sugerencia',
  UNKNOWN: 'Error al integrar la sugerencia',
  REJECTION: 'Error al rechazar la sugerencia'
} as const;

type ErrorMessage =
  | 'Error al integrar la sugerencia'
  | 'Error de conexión al integrar la sugerencia'
  | 'La sugerencia no cumple con los requisitos de validación'
  | 'Error al rechazar la sugerencia';

/**
 * Textos estandarizados para botones
 * @constant
 */
const BUTTON_TEXTS = {
  INTEGRATE: 'Integrar',
  INTEGRATED: 'Integrada',
  NOT_INTEGRABLE: 'No integrable',
  REJECT: 'Rechazar',
  SHOW: 'Mostrar',
  HIDE: 'Ocultar'
} as const;

/**
 * Estilos visuales por tipo de sugerencia
 * @constant
 */
const SUGGESTION_STYLES: Record<SuggestionType, { icon: string; colorClass: string }> = {
  recommendation: { icon: '💡', colorClass: 'bg-blue-50 border-blue-200' },
  warning: { icon: '⚠️', colorClass: 'bg-yellow-50 border-yellow-200' },
  info: { icon: 'ℹ️', colorClass: 'bg-green-50 border-green-200' },
  diagnostic: { icon: '🔍', colorClass: 'bg-purple-50 border-purple-200' },
  treatment: { icon: '💊', colorClass: 'bg-indigo-50 border-indigo-200' },
  followup: { icon: '📅', colorClass: 'bg-pink-50 border-pink-200' },
  contextual: { icon: '📝', colorClass: 'bg-gray-50 border-gray-200' }
};

/**
 * Interfaz para la sugerencia a integrar en el EMR
 * @interface
 */
interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: IntegrableSuggestionType;
  sourceBlockId: string;
  field: string;
  suggestionType: IntegrableSuggestionType;
  suggestionField: string;
}

/**
 * Props del componente AgentSuggestionsViewer
 * @interface
 */
interface AgentSuggestionsViewerProps {
  /** ID de la visita actual */
  visitId: string;
  /** Lista de sugerencias a mostrar */
  suggestions: AgentSuggestion[];
  /** Callback opcional para notificar integración de sugerencias */
  onIntegrateSuggestions?: (count: number) => void;
  /** ID del usuario actual */
  userId?: string;
  /** ID del paciente actual */
  patientId?: string;
  /** Callback para notificar aceptación de sugerencia */
  onSuggestionAccepted: (suggestion: AgentSuggestion) => void;
  /** Callback para notificar rechazo de sugerencia */
  onSuggestionRejected: (suggestion: AgentSuggestion) => void;
}

/**
 * Valida que una sugerencia cumpla con los requisitos mínimos
 * @param suggestion - Sugerencia a validar
 * @returns boolean indicando si la sugerencia es válida
 */
function isValidSuggestion(suggestion: AgentSuggestion): boolean {
  return Boolean(
    suggestion &&
    typeof suggestion.id === 'string' &&
    typeof suggestion.type === 'string' &&
    typeof suggestion.content === 'string' &&
    suggestion.content.trim().length > 0 &&
    suggestion.type in SUGGESTION_STYLES
  );
}

/**
 * Componente memoizado para mostrar una sugerencia individual
 * @component
 */
const SuggestionItem = memo(({ 
  suggestion, 
  onAccept, 
  onReject, 
  isIntegrated, 
  isIntegrable,
  onKeyDown 
}: {
  suggestion: AgentSuggestion;
  onAccept: (suggestion: AgentSuggestion) => void;
  onReject: (suggestion: AgentSuggestion) => void;
  isIntegrated: boolean;
  isIntegrable: boolean;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) => (
  <li 
    data-testid={`suggestion-${suggestion.id}`}
    className="p-3 bg-gray-50 rounded-md"
    role="article"
    aria-label={`Sugerencia: ${suggestion.content}`}
  >
    <p className="text-sm text-gray-700">{suggestion.content}</p>
    <div className="mt-2 flex justify-end space-x-2" role="group" aria-label="Acciones de sugerencia">
      <button
        onClick={() => onAccept(suggestion)}
        onKeyDown={onKeyDown}
        disabled={isIntegrated || !isIntegrable}
        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        data-testid={`accept-suggestion-${suggestion.id}`}
        aria-label={isIntegrated ? 'Sugerencia integrada' : 
                  !isIntegrable ? BUTTON_TEXTS.NOT_INTEGRABLE : 
                  BUTTON_TEXTS.INTEGRATE}
      >
        {isIntegrated ? BUTTON_TEXTS.INTEGRATED : 
         !isIntegrable ? BUTTON_TEXTS.NOT_INTEGRABLE : 
         BUTTON_TEXTS.INTEGRATE}
      </button>
      <button
        onClick={() => onReject(suggestion)}
        onKeyDown={onKeyDown}
        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        data-testid={`reject-suggestion-${suggestion.id}`}
        aria-label="Rechazar sugerencia"
      >
        {BUTTON_TEXTS.REJECT}
      </button>
    </div>
  </li>
));

SuggestionItem.displayName = 'SuggestionItem';

/**
 * Componente memoizado para mostrar una sección de sugerencias
 * @component
 */
const SuggestionSection = memo(({ 
  type, 
  suggestions, 
  onAccept, 
  onReject, 
  integratedSuggestions,
  isSuggestionIntegrable,
  onKeyDown 
}: {
  type: string;
  suggestions: AgentSuggestion[];
  onAccept: (suggestion: AgentSuggestion) => void;
  onReject: (suggestion: AgentSuggestion) => void;
  integratedSuggestions: Set<string>;
  isSuggestionIntegrable: (suggestion: AgentSuggestion) => boolean;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) => {
  const sectionTitle = type === 'recommendation' ? 'Recomendaciones' :
                      type === 'warning' ? 'Advertencias' :
                      type === 'info' ? 'Información' : type;

  return (
    <section 
      data-testid={`${type}-section`}
      className="space-y-2"
      aria-labelledby={`${type}-section-title`}
    >
      <h4 
        id={`${type}-section-title`}
        className="text-sm font-medium text-gray-700 capitalize"
      >
        {sectionTitle}
      </h4>
      <ul 
        className="space-y-2" 
        aria-label={`Lista de ${sectionTitle.toLowerCase()}`}
      >
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={onAccept}
            onReject={onReject}
            isIntegrated={integratedSuggestions.has(suggestion.id)}
            isIntegrable={isSuggestionIntegrable(suggestion)}
            onKeyDown={onKeyDown}
          />
        ))}
      </ul>
    </section>
  );
});

SuggestionSection.displayName = 'SuggestionSection';

/**
 * Componente principal que muestra las sugerencias generadas por el agente clínico
 * @component
 * 
 * @todo [DEUDA TÉCNICA] El atributo aria-expanded está comentado temporalmente debido a un falso positivo
 * del linter. La implementación técnica es correcta (aria-expanded={isExpanded ? "true" : "false"}), pero
 * el linter no reconoce la expresión ternaria como un valor válido. Se requiere una actualización del linter
 * o una configuración específica para este caso.
 * 
 * @todo [MEJORA FUTURA] Implementar un sistema de caché para las sugerencias integradas
 * para mejorar el rendimiento en visitas largas.
 * 
 * @todo [MEJORA FUTURA] Agregar soporte para sugerencias anidadas o relacionadas.
 */
const AgentSuggestionsViewer: React.FC<AgentSuggestionsViewerProps> = ({ 
  visitId,
  suggestions,
  onIntegrateSuggestions,
  userId = 'admin-test-001',
  patientId = 'patient-default',
  onSuggestionAccepted,
  onSuggestionRejected
}) => {
  const [integratedSuggestions, setIntegratedSuggestions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoización de funciones
  const handleSuggestionAccepted = useCallback(async (suggestion: AgentSuggestion) => {
    try {
      setError(null);
      if (!isValidSuggestion(suggestion)) {
        throw new Error('La sugerencia no cumple con los requisitos de validación');
      }
      if (!INTEGRABLE_SUGGESTION_TYPES.includes(suggestion.type as IntegrableSuggestionType)) {
        console.warn('Tipo de sugerencia no soportado para integración:', suggestion.type);
        return;
      }
      const suggestionToIntegrate: SuggestionToIntegrate = {
          id: suggestion.id,
        content: suggestion.content.trim(),
        type: suggestion.type as IntegrableSuggestionType,
        sourceBlockId: suggestion.sourceBlockId || '',
        field: suggestion.field || 'notes',
        suggestionType: suggestion.type as IntegrableSuggestionType,
        suggestionField: suggestion.field || 'notes'
      };
      await EMRFormService.insertSuggestion(suggestionToIntegrate);
        setIntegratedSuggestions(prev => new Set([...prev, suggestion.id]));
      onSuggestionAccepted(suggestion);
      if (onIntegrateSuggestions) {
        onIntegrateSuggestions(1);
      }
        trackMetric(
        'suggestion_integrated' as UsageMetricType,
          userId,
          visitId,
          1,
          {
          suggestionId: suggestion.id,
          suggestionType: suggestion.type,
          suggestionField: suggestion.field,
          patientId
          }
        );
        AuditLogger.log('suggestion_integrated', {
        suggestionId: suggestion.id,
        visitId,
          userId,
        patientId
      });
    } catch (err) {
      let errorMessage: ErrorMessage = 'Error al integrar la sugerencia';
      if (err instanceof Error) {
        if (err.message.includes('conexión') || err.message.toLowerCase().includes('network')) {
          errorMessage = 'Error de conexión al integrar la sugerencia';
        } else if (err.message === 'La sugerencia no cumple con los requisitos de validación') {
          errorMessage = 'La sugerencia no cumple con los requisitos de validación';
        }
      }
      setError(errorMessage);
      AuditLogger.log('suggestion_integration_error', {
        error: errorMessage,
        suggestionId: suggestion.id,
        visitId,
        patientId,
        userId
      });
      console.error('Error al integrar sugerencia:', err);
    }
  }, [visitId, patientId, userId, onSuggestionAccepted, onIntegrateSuggestions]);

  const handleReject = useCallback((suggestion: AgentSuggestion) => {
    try {
      if (!isValidSuggestion(suggestion)) {
        throw new Error(ERROR_MESSAGES.VALIDATION);
      }

      onSuggestionRejected(suggestion);

      // Registrar métrica de rechazo
      trackMetric(
        'suggestion_rejected' as UsageMetricType,
        userId,
        visitId,
        1,
        {
          suggestionId: suggestion.id,
          suggestionType: suggestion.type,
          suggestionField: suggestion.field,
          patientId
        }
      );

      // Registrar el rechazo en el log de auditoría
      AuditLogger.log('suggestion_rejected', {
        suggestionId: suggestion.id,
        visitId,
        userId,
        patientId
      });

    } catch (err) {
      console.error('Error al rechazar sugerencia:', err);
      setError(ERROR_MESSAGES.REJECTION as ErrorMessage);
    }
  }, [visitId, patientId, userId, onSuggestionRejected]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const target = event.target as HTMLButtonElement;
    const isButton = target.tagName === 'BUTTON';
    
    if (!isButton) return;

    const container = document.querySelector('[data-testid="suggestions-region"]');
    if (!container) return;

    const buttons = Array.from(container.querySelectorAll('button[data-testid^="accept-suggestion-"], button[data-testid^="reject-suggestion-"], button[data-testid="toggle-suggestions"]')) as HTMLButtonElement[];
    const currentIndex = buttons.indexOf(target);
    const nextButton = buttons[currentIndex + 1];
    const prevButton = buttons[currentIndex - 1];
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        if (nextButton) {
          nextButton.focus();
        } else {
          firstButton?.focus();
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        if (prevButton) {
          prevButton.focus();
        } else {
          lastButton?.focus();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        target.click();
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          if (prevButton) {
            prevButton.focus();
          } else {
            lastButton?.focus();
          }
        } else {
          if (nextButton) {
            nextButton.focus();
          } else {
            firstButton?.focus();
          }
        }
        break;
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const isSuggestionIntegrable = useCallback((suggestion: AgentSuggestion) => {
    return INTEGRABLE_SUGGESTION_TYPES.includes(suggestion.type as IntegrableSuggestionType);
  }, []);

  // Memoización de datos derivados
  const groupedSuggestions = useMemo(() => {
    const grouped: Record<SuggestionType, AgentSuggestion[]> = {
      diagnostic: [],
      treatment: [],
      followup: [],
      contextual: [],
      recommendation: [],
      warning: [],
      info: []
    };

    suggestions.forEach(suggestion => {
      if (isValidSuggestion(suggestion) && suggestion.type in grouped) {
        grouped[suggestion.type].push(suggestion);
      }
    });

    return Object.fromEntries(
      Object.entries(grouped).filter(([_, suggestions]) => suggestions.length > 0)
    ) as Record<SuggestionType, AgentSuggestion[]>;
  }, [suggestions]);

  const totalSugerencias = useMemo(() => {
    return Object.values(groupedSuggestions).reduce((acc, arr) => acc + arr.length, 0);
  }, [groupedSuggestions]);

  // Validar props requeridas
  if (!visitId) {
    console.error('AgentSuggestionsViewer: visitId es requerido');
    return null;
  }

  // Renderizar sugerencias con su feedback correspondiente
  const renderSuggestion = (suggestion: AgentSuggestion) => (
    <div 
      key={suggestion.id} 
      className={`p-3 rounded-md border ${
        integratedSuggestions.has(suggestion.id) 
          ? 'bg-blue-50 border-blue-300' 
          : SUGGESTION_STYLES[suggestion.type as SuggestionType].colorClass
      }`}
      data-testid={`suggestion-item-${suggestion.id}`}
    >
      <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
      <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
      
      <div className="mt-2 flex justify-end space-x-2">
        <button
          onClick={() => handleSuggestionAccepted(suggestion)}
          onKeyDown={handleKeyDown}
          disabled={integratedSuggestions.has(suggestion.id) || !isSuggestionIntegrable(suggestion)}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          data-testid={`accept-suggestion-${suggestion.id}`}
          aria-label={integratedSuggestions.has(suggestion.id) ? 'Sugerencia integrada' : 
                    !isSuggestionIntegrable(suggestion) ? BUTTON_TEXTS.NOT_INTEGRABLE : 
                    BUTTON_TEXTS.INTEGRATE}
        >
          {integratedSuggestions.has(suggestion.id) ? BUTTON_TEXTS.INTEGRATED : 
           !isSuggestionIntegrable(suggestion) ? BUTTON_TEXTS.NOT_INTEGRABLE : 
           BUTTON_TEXTS.INTEGRATE}
        </button>
        <button
          onClick={() => handleReject(suggestion)}
          onKeyDown={handleKeyDown}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid={`reject-suggestion-${suggestion.id}`}
          aria-label="Rechazar sugerencia"
        >
          {BUTTON_TEXTS.REJECT}
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200"
      data-testid="suggestions-region"
      role="region"
      aria-label="Sugerencias del Copiloto"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 
            className="text-lg font-medium text-gray-900"
            data-testid="suggestions-title"
            id="suggestions-title"
          >
            Sugerencias del Copiloto ({totalSugerencias})
        </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={toggleExpanded}
            onKeyDown={handleKeyDown}
          data-testid="toggle-suggestions"
            aria-controls="suggestions-content"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} sugerencias del copiloto`}
        >
            {isExpanded ? BUTTON_TEXTS.HIDE : BUTTON_TEXTS.SHOW}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div 
          id="suggestions-content"
          data-testid="suggestions-content"
          className="p-4"
          role="region"
          aria-label="Lista de sugerencias"
        >
          {error && (
            <div 
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
              data-testid="error-message"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {totalSugerencias === 0 ? (
            <p 
              className="text-gray-500 text-center py-4"
              data-testid="no-suggestions-message"
              role="status"
              aria-live="polite"
            >
              No hay sugerencias disponibles
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
                <div key={type} role="listitem">
                  <SuggestionSection
                    type={type}
                    suggestions={typeSuggestions}
                    onAccept={handleSuggestionAccepted}
                    onReject={handleReject}
                    integratedSuggestions={integratedSuggestions}
                    isSuggestionIntegrable={isSuggestionIntegrable}
                    onKeyDown={handleKeyDown}
                    />
                  </div>
                ))}
            </div>
          )}
          
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">
              Total de sugerencias: {suggestions.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AgentSuggestionsViewer); 