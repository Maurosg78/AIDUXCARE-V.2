import React, { useState, useEffect, useMemo } from 'react';
import { MCPContext, MCPMemoryBlock } from '@/core/mcp/schema';
import { buildMCPContext } from '@/core/mcp/MCPContextBuilder';
import { 
  getContextualMemory, 
  getPersistentMemory, 
  getSemanticMemory 
} from '@/core/mcp/MCPDataSourceSupabase';
import { Visit } from '@/core/domain/visitType';
import { DiffEntry, DiffState, DiffStats, MCPContextDiff } from '@/core/types/mcp';

interface MCPContextDiffDashboardProps {
  visits: Visit[];
  patientId: string;
}

const MCPContextDiffDashboard: React.FC<MCPContextDiffDashboardProps> = ({ visits, patientId }) => {
  const [selectedVisitIds, setSelectedVisitIds] = useState<{ current: string; previous: string }>({
    current: '',
    previous: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contextDiff, setContextDiff] = useState<MCPContextDiff | null>(null);

  // Organizar visitas por fecha (más recientes primero)
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [visits]);

  // Consultar los datos MCP de una visita
  const fetchMCPDataForVisit = async (visitId: string): Promise<MCPContext | null> => {
    try {
      // Obtener los tres tipos de memoria para la visita
      const contextualData = await getContextualMemory(visitId);
      const persistentData = await getPersistentMemory(patientId);
      const semanticData = await getSemanticMemory();

      // Construir el contexto MCP completo
      const mcpContext = buildMCPContext(contextualData, persistentData, semanticData);
      return mcpContext;
    } catch (error) {
      console.error(`Error al obtener datos MCP para visita ${visitId}:`, error);
      return null;
    }
  };

  // Comparar dos bloques de memoria y generar entradas de diferencias
  const compareMemoryBlocks = (
    previousBlocks: MCPMemoryBlock[],
    currentBlocks: MCPMemoryBlock[],
    blockType: 'contextual' | 'persistent' | 'semantic'
  ): DiffEntry[] => {
    const diffEntries: DiffEntry[] = [];
    const previousBlocksMap = new Map<string, MCPMemoryBlock>();
    
    // Mapear bloques previos por ID para facilitar la búsqueda
    previousBlocks.forEach(block => {
      previousBlocksMap.set(block.id, block);
    });
    
    // Comparar bloques actuales con previos
    currentBlocks.forEach(currentBlock => {
      const previousBlock = previousBlocksMap.get(currentBlock.id);
      
      if (!previousBlock) {
        // Bloque añadido en la visita actual
        diffEntries.push({
          id: currentBlock.id,
          type: blockType,
          field: 'content',
          value_after: currentBlock.content,
          state: 'añadido'
        });
      } else {
        // Bloque existente, verificar si cambió
        if (previousBlock.content !== currentBlock.content) {
          diffEntries.push({
            id: currentBlock.id,
            type: blockType,
            field: 'content',
            value_before: previousBlock.content,
            value_after: currentBlock.content,
            state: 'modificado'
          });
        } else {
          // Bloque sin cambios
          diffEntries.push({
            id: currentBlock.id,
            type: blockType,
            field: 'content',
            value_before: previousBlock.content,
            value_after: currentBlock.content,
            state: 'igual'
          });
        }
        
        // Eliminar el bloque del mapa para rastrear los eliminados
        previousBlocksMap.delete(currentBlock.id);
      }
    });
    
    // Bloques que solo existen en la visita previa (eliminados)
    previousBlocksMap.forEach(block => {
      diffEntries.push({
        id: block.id,
        type: blockType,
        field: 'content',
        value_before: block.content,
        state: 'eliminado'
      });
    });
    
    return diffEntries;
  };

  // Calcular estadísticas de diferencias
  const calculateDiffStats = (entries: DiffEntry[]): DiffStats => {
    const stats: DiffStats = {
      contextual: { total: 0, modificados: 0, eliminados: 0, añadidos: 0 },
      persistent: { total: 0, modificados: 0, eliminados: 0, añadidos: 0 },
      semantic: { total: 0, modificados: 0, eliminados: 0, añadidos: 0 }
    };
    
    entries.forEach(entry => {
      stats[entry.type].total++;
      
      if (entry.state === 'modificado') {
        stats[entry.type].modificados++;
      } else if (entry.state === 'eliminado') {
        stats[entry.type].eliminados++;
      } else if (entry.state === 'añadido') {
        stats[entry.type].añadidos++;
      }
    });
    
    return stats;
  };

  // Comparar contextos MCP completos
  const compareContexts = async (previousId: string, currentId: string) => {
    if (!previousId || !currentId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const previousContext = await fetchMCPDataForVisit(previousId);
      const currentContext = await fetchMCPDataForVisit(currentId);
      
      if (!previousContext || !currentContext) {
        throw new Error("No se pudieron cargar ambos contextos MCP");
      }
      
      // Comparar bloques por tipo
      const contextualDiffs = compareMemoryBlocks(
        previousContext.contextual.data, 
        currentContext.contextual.data, 
        'contextual'
      );
      
      const persistentDiffs = compareMemoryBlocks(
        previousContext.persistent.data, 
        currentContext.persistent.data, 
        'persistent'
      );
      
      const semanticDiffs = compareMemoryBlocks(
        previousContext.semantic.data, 
        currentContext.semantic.data, 
        'semantic'
      );
      
      // Combinar todos los resultados
      const allDiffs = [...contextualDiffs, ...persistentDiffs, ...semanticDiffs];
      
      // Ordenar por tipo y luego por estado (mostrando primero los cambios)
      const sortedDiffs = [...allDiffs].sort((a, b) => {
        // Primero ordenar por tipo
        if (a.type !== b.type) {
          const typeOrder = { contextual: 1, persistent: 2, semantic: 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
        
        // Luego ordenar por estado, priorizando los cambios
        const stateOrder = { modificado: 1, añadido: 2, eliminado: 3, igual: 4 };
        return stateOrder[a.state] - stateOrder[b.state];
      });
      
      // Calcular estadísticas
      const stats = calculateDiffStats(sortedDiffs);
      
      // Crear el resultado final
      const diff: MCPContextDiff = {
        previousVisitId: previousId,
        currentVisitId: currentId,
        entries: sortedDiffs,
        stats
      };
      
      setContextDiff(diff);
      setLoading(false);
      return diff;
    } catch (error) {
      console.error("Error al comparar contextos:", error);
      setError(`Error al comparar contextos: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
      return null;
    }
  };

  // Procesar comparación cuando cambian las visitas seleccionadas
  useEffect(() => {
    if (selectedVisitIds.current && selectedVisitIds.previous) {
      compareContexts(selectedVisitIds.previous, selectedVisitIds.current);
    }
  }, [selectedVisitIds]);

  // Manejar cambio de selección para la visita actual
  const handleCurrentVisitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currentId = e.target.value;
    setSelectedVisitIds(prev => ({ ...prev, current: currentId }));
    
    // Si la visita actual es igual a la previa, limpiar selección previa
    if (currentId === selectedVisitIds.previous) {
      setSelectedVisitIds(prev => ({ ...prev, previous: '' }));
    }
  };

  // Manejar cambio de selección para la visita previa
  const handlePreviousVisitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const previousId = e.target.value;
    setSelectedVisitIds(prev => ({ ...prev, previous: previousId }));
  };

  // Generar opciones de visitas para la selección anterior, excluyendo la visita actual
  const generatePreviousVisitOptions = () => {
    return sortedVisits
      .filter(visit => visit.id !== selectedVisitIds.current)
      .map(visit => {
        const visitDate = new Date(visit.date);
        const formattedDate = visitDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        return (
          <option key={visit.id} value={visit.id}>
            {formattedDate} - {visit.id.slice(0, 8)}
          </option>
        );
      });
  };

  // Obtener clase de color según el estado de diferencia
  const getDiffStateColor = (state: DiffState): string => {
    switch (state) {
      case 'modificado': return 'bg-yellow-50 border-yellow-200';
      case 'añadido': return 'bg-green-50 border-green-200';
      case 'eliminado': return 'bg-red-50 border-red-200';
      case 'igual': return 'bg-slate-50 border-slate-200';
      default: return 'bg-white border-gray-200';
    }
  };

  // Obtener clase de color para badges según el tipo
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'contextual': return 'bg-blue-100 text-blue-800';
      case 'persistent': return 'bg-green-100 text-green-800';
      case 'semantic': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <h2 className="text-xl font-bold mb-6">Comparador de Contexto MCP</h2>
      
      {/* Selección de visitas */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="current-visit" className="block text-sm font-medium text-gray-700 mb-1">
            Visita actual
          </label>
          <select
            id="current-visit"
            value={selectedVisitIds.current}
            onChange={handleCurrentVisitChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccionar visita...</option>
            {sortedVisits.map(visit => {
              const visitDate = new Date(visit.date);
              const formattedDate = visitDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              return (
                <option key={visit.id} value={visit.id}>
                  {formattedDate} - {visit.id.slice(0, 8)}
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="previous-visit" className="block text-sm font-medium text-gray-700 mb-1">
            Visita anterior
          </label>
          <select
            id="previous-visit"
            value={selectedVisitIds.previous}
            onChange={handlePreviousVisitChange}
            disabled={!selectedVisitIds.current}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">Seleccionar visita...</option>
            {generatePreviousVisitOptions()}
          </select>
        </div>
      </div>
      
      {/* Indicador de carga */}
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
      
      {/* Estadísticas de diferencias */}
      {contextDiff && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Contextual */}
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Memoria Contextual</h3>
            <div className="flex justify-between text-sm">
              <span>Total: {contextDiff.stats.contextual.total}</span>
              <span className="text-yellow-700">Modificados: {contextDiff.stats.contextual.modificados}</span>
              <span className="text-green-700">Añadidos: {contextDiff.stats.contextual.añadidos}</span>
              <span className="text-red-700">Eliminados: {contextDiff.stats.contextual.eliminados}</span>
            </div>
          </div>
          
          {/* Persistent */}
          <div className="bg-green-50 border border-green-100 rounded-md p-4">
            <h3 className="font-semibold text-green-800 mb-2">Memoria Persistente</h3>
            <div className="flex justify-between text-sm">
              <span>Total: {contextDiff.stats.persistent.total}</span>
              <span className="text-yellow-700">Modificados: {contextDiff.stats.persistent.modificados}</span>
              <span className="text-green-700">Añadidos: {contextDiff.stats.persistent.añadidos}</span>
              <span className="text-red-700">Eliminados: {contextDiff.stats.persistent.eliminados}</span>
            </div>
          </div>
          
          {/* Semantic */}
          <div className="bg-purple-50 border border-purple-100 rounded-md p-4">
            <h3 className="font-semibold text-purple-800 mb-2">Memoria Semántica</h3>
            <div className="flex justify-between text-sm">
              <span>Total: {contextDiff.stats.semantic.total}</span>
              <span className="text-yellow-700">Modificados: {contextDiff.stats.semantic.modificados}</span>
              <span className="text-green-700">Añadidos: {contextDiff.stats.semantic.añadidos}</span>
              <span className="text-red-700">Eliminados: {contextDiff.stats.semantic.eliminados}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de diferencias */}
      {contextDiff && !loading && contextDiff.entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contenido Anterior
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contenido Actual
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contextDiff.entries.map((entry, index) => (
                <tr key={`${entry.id}-${index}`} className={getDiffStateColor(entry.state)}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(entry.type)}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {entry.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${entry.state === 'modificado' ? 'bg-yellow-100 text-yellow-800' : 
                      entry.state === 'añadido' ? 'bg-green-100 text-green-800' : 
                      entry.state === 'eliminado' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'}`}
                    >
                      {entry.state}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.value_before ? (
                      <div className="max-h-24 overflow-y-auto text-sm">
                        <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-2 rounded">
                          {entry.value_before}
                        </pre>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">No disponible</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.value_after ? (
                      <div className="max-h-24 overflow-y-auto text-sm">
                        <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-2 rounded">
                          {entry.value_after}
                        </pre>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">No disponible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Mensaje sin diferencias */}
      {contextDiff && !loading && contextDiff.entries.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-500">No se encontraron diferencias entre las visitas seleccionadas.</p>
        </div>
      )}
      
      {/* Mensaje inicial */}
      {!contextDiff && !loading && !error && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-8 text-center">
          <p className="text-blue-600">Selecciona dos visitas para comparar su contexto MCP.</p>
        </div>
      )}
    </div>
  );
};

export default MCPContextDiffDashboard; 