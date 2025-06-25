import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import supabase from '../../../core/auth/supabaseClient';

interface IntegratedSuggestion {
  id: string;
  content: string;
  field: string;
  accepted_by: string;
  accepted_at: string;
  type: 'recommendation' | 'warning' | 'info';
}

interface IntegratedSuggestionViewerProps {
  visitId: string;
}

const IntegratedSuggestionViewer: React.FC<IntegratedSuggestionViewerProps> = ({ visitId }) => {
  const [suggestions, setSuggestions] = useState<IntegratedSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegratedSuggestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Consultar sugerencias integradas desde la tabla de logs
        const { data, error: fetchError } = await supabase
          .from('suggestion_logs')
          .select('*')
          .eq('visit_id', visitId)
          .eq('status', 'integrated')
          .order('field_name', { ascending: true })
          .order('accepted_at', { ascending: false });

        if (fetchError) {
          throw new Error(`Error al cargar sugerencias: ${fetchError.message}`);
        }

        if (!data) {
          setSuggestions([]);
          return;
        }

        // Transformar los datos al formato esperado
        const formattedSuggestions: IntegratedSuggestion[] = data.map(log => ({
          id: log.suggestion_id,
          content: log.content,
          field: log.field_name,
          accepted_by: log.accepted_by,
          accepted_at: log.accepted_at,
          type: log.suggestion_type as 'recommendation' | 'warning' | 'info'
        }));

        setSuggestions(formattedSuggestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error al cargar sugerencias integradas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegratedSuggestions();
  }, [visitId]);

  // Función para obtener el color del badge según el tipo de sugerencia
  const getTypeColorClass = (type: 'recommendation' | 'warning' | 'info'): string => {
    switch (type) {
      case 'recommendation':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-green-100 text-green-800';
    }
  };

  // Función para obtener el ícono según el tipo de sugerencia
  const getTypeIcon = (type: 'recommendation' | 'warning' | 'info'): string => {
    switch (type) {
      case 'recommendation':
        return 'TIP';
      case 'warning':
        return 'WARNING:';
      case 'info':
        return 'INFO';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg shadow-sm">
        <p className="text-red-600">Error al cargar sugerencias: {error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
        <p className="text-gray-500 text-center">No hay sugerencias integradas para esta visita</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Sugerencias IA Integradas ({suggestions.length})
      </h3>
      
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColorClass(suggestion.type)}`}>
                  {suggestion.field}
                </span>
                <span className="text-sm text-gray-500">
                  {getTypeIcon(suggestion.type)} Sugerido por IA
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(suggestion.accepted_at), { 
                  addSuffix: true,
                  locale: es 
                })}
              </span>
            </div>

            <p className="text-gray-800 mb-2">{suggestion.content}</p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>SUCCESS: Integrado</span>
              <span>Por: {suggestion.accepted_by}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

IntegratedSuggestionViewer.displayName = 'IntegratedSuggestionViewer';

export default IntegratedSuggestionViewer; 