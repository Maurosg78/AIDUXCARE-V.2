import React, { useState, useEffect } from 'react';
import { SemanticMemoryBlock, SemanticMemoryService } from '../../../core/mcp/SemanticMemoryService';

/**
 * Props para el componente SemanticMemoryViewer
 */
export interface SemanticMemoryViewerProps {
  patientId?: string;
  visitId?: string;
  minRelevance?: number; // default: 0.3
}

/**
 * Componente para visualizar bloques de memoria semántica
 * Permite visualizar por visita o por paciente (con filtro de relevancia)
 */
const SemanticMemoryViewer: React.FC<SemanticMemoryViewerProps> = ({
  patientId,
  visitId,
  minRelevance = 0.3
}) => {
  // Estado para almacenar los bloques de memoria semántica
  const [blocks, setBlocks] = useState<SemanticMemoryBlock[]>([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para manejar errores
  const [error, setError] = useState<string | null>(null);
  // Estado para controlar qué categorías están expandidas
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Obtener los bloques de memoria semántica
  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const service = new SemanticMemoryService();
        let fetchedBlocks: SemanticMemoryBlock[] = [];
        
        // Determinar qué función usar según los props recibidos
        if (visitId) {
          // Si tenemos un visitId, obtenemos los bloques de esa visita
          fetchedBlocks = await service.getSemanticBlocksByVisit(visitId);
        } else if (patientId) {
          // Si tenemos un patientId, obtenemos los bloques importantes de ese paciente
          fetchedBlocks = await service.getImportantSemanticBlocksByPatient(patientId, minRelevance);
        } else {
          throw new Error('Se requiere patientId o visitId');
        }
        
        // Filtrar los bloques por relevance_score
        const filteredBlocks = fetchedBlocks.filter(block => block.relevance_score >= minRelevance);
        
        setBlocks(filteredBlocks);
        
        // Inicializar todas las categorías como expandidas
        const categories = [...new Set(filteredBlocks.map(block => block.category))];
        const initialExpandedState = categories.reduce((acc, category) => {
          return { ...acc, [category]: true };
        }, {});
        
        setExpandedCategories(initialExpandedState);
      } catch (err) {
        console.error('Error al cargar bloques de memoria semántica:', err);
        setError(`Error al cargar datos: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlocks();
  }, [patientId, visitId, minRelevance]);

  // Agrupar bloques por categoría
  const groupedBlocks = blocks.reduce<Record<string, SemanticMemoryBlock[]>>((groups, block) => {
    const category = block.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(block);
    return groups;
  }, {});

  // Ordenar categorías alfabéticamente
  const sortedCategories = Object.keys(groupedBlocks).sort();

  // Función para alternar la expansión de una categoría
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Función para formatear el puntaje de relevancia
  const formatRelevanceScore = (score: number): string => {
    return (score * 100).toFixed(0) + '%';
  };

  // Función para obtener el color según la importancia
  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Función para obtener el color de fondo según la categoría
  const getCategoryBgColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'diagnóstico':
        return 'bg-red-50 border-red-200';
      case 'alerta':
        return 'bg-amber-50 border-amber-200';
      case 'riesgo':
        return 'bg-orange-50 border-orange-200';
      case 'observación':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Renderizar componente
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-bold mb-4">Memoria Semántica</h2>
      
      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Sin resultados */}
      {!loading && !error && blocks.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
          <p className="text-gray-500">No se encontraron bloques de memoria semántica.</p>
        </div>
      )}
      
      {/* Resultados */}
      {!loading && !error && blocks.length > 0 && (
        <div className="space-y-4">
          {sortedCategories.map(category => (
            <div 
              key={category}
              className={`border rounded-md ${getCategoryBgColor(category)}`}
            >
              {/* Encabezado de categoría (acordeón) */}
              <button 
                className="w-full px-4 py-3 flex justify-between items-center focus:outline-none"
                onClick={() => toggleCategory(category)}
                aria-expanded={expandedCategories[category] ? 'true' : 'false'}
              >
                <span className="font-semibold">{category} ({groupedBlocks[category].length})</span>
                <svg 
                  className={`w-5 h-5 transform transition-transform ${expandedCategories[category] ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Contenido de la categoría */}
              {expandedCategories[category] && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Ordenar bloques por relevance_score (mayor a menor) */}
                  {groupedBlocks[category]
                    .sort((a, b) => b.relevance_score - a.relevance_score)
                    .map(block => (
                      <div 
                        key={block.id} 
                        className="bg-white border rounded-md p-3 hover:shadow-sm transition"
                      >
                        <div className="flex flex-col">
                          {/* Concepto */}
                          <div className="flex items-start mb-2">
                            <span className="text-gray-500 mr-1">🧠</span>
                            <span className="font-medium">{block.concept}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {/* Score */}
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">⚖️</span>
                              <span>Score: <strong>{formatRelevanceScore(block.relevance_score)}</strong></span>
                            </div>
                            
                            {/* Importancia */}
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">🧩</span>
                              <span>Importancia: <strong className={getImportanceColor(block.importance)}>
                                {block.importance}
                              </strong></span>
                            </div>
                          </div>
                          
                          {/* ID de la visita */}
                          <div className="mt-2 text-xs text-gray-500">
                            Visita: {block.visit_id}
                          </div>
                          
                          {/* Texto fuente si existe */}
                          {block.source_text && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <em>"{block.source_text}"</em>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SemanticMemoryViewer; 