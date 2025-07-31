import React from 'react';

interface AgentSuggestion {
  id: string;
  type: 'recommendation' | 'warning' | 'info';
  content: string;
  sourceBlockId: string;
  field: string;
}

interface AgentSuggestionListProps {
  suggestions: AgentSuggestion[];
  integratedSuggestions: Set<string>;
  onAccept: (suggestion: AgentSuggestion) => void;
  onReject: (suggestion: AgentSuggestion) => void;
  onFeedback: (suggestion: AgentSuggestion) => void;
}

const AgentSuggestionList: React.FC<AgentSuggestionListProps> = ({
  suggestions,
  integratedSuggestions,
  onAccept,
  onReject,
  onFeedback
}) => {
  if (suggestions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No hay sugerencias disponibles
      </div>
    );
  }

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'recommendation':
        return 'Recomendación';
      case 'warning':
        return 'Advertencia';
      case 'info':
        return 'Información';
      default:
        return type;
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'recommendation':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ul aria-label="Lista de sugerencias" className="space-y-4">
      {suggestions.map((suggestion) => {
        const isIntegrated = integratedSuggestions.has(suggestion.id);
        
        return (
          <li key={suggestion.id}>
            <article className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSuggestionTypeColor(suggestion.type)}`}
                    >
                      {getSuggestionTypeLabel(suggestion.type)}
                    </span>
                    {isIntegrated && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Integrado
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 mb-2">{suggestion.content}</p>
                  <p className="text-sm text-gray-500">Campo: {suggestion.field}</p>
                </div>
                
                {!isIntegrated && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onAccept(suggestion)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      aria-label={`Aceptar sugerencia: ${suggestion.content}`}
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => onReject(suggestion)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Rechazar sugerencia: ${suggestion.content}`}
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => onFeedback(suggestion)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Solicitar retroalimentación para: ${suggestion.content}`}
                    >
                      Retroalimentación
                    </button>
                  </div>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
};

export default AgentSuggestionList; 