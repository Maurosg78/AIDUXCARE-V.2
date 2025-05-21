import { vi } from "vitest";
import React, { useState } from 'react';
import { MCPContext } from '../../../core/mcp/schema';

/**
 * Props para el componente AgentContextDiffViewer
 */
interface AgentContextDiffViewerProps {
  previousContext: MCPContext;
  currentContext: MCPContext;
}

// Tipo de bloque para la comparación
interface MemoryBlock {
  id: string;
  type: 'contextual' | 'persistent' | 'semantic';
  content: string;
  timestamp?: string;
  created_at?: string;
  validated?: boolean;
}

// Tipos de cambios para visualización
type DiffType = 'unchanged' | 'added' | 'modified' | 'deleted';

// Estructura de bloque para visualizar diferencias
interface DiffBlock {
  type: DiffType;
  original?: MemoryBlock;
  modified?: MemoryBlock;
  id: string;
}

/**
 * Componente que muestra visualmente las diferencias entre dos contextos MCP
 */
const AgentContextDiffViewer: React.FC<AgentContextDiffViewerProps> = ({
  previousContext,
  currentContext
}) => {
  // Estado para grupos colapsados
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    contextual: false,
    persistent: false,
    semantic: false
  });

  // Toggle para expandir/colapsar grupos
  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Función para extraer bloques de un contexto
  const extractBlocks = (context: MCPContext): MemoryBlock[] => {
    const blocks: MemoryBlock[] = [];
    
    ['contextual', 'persistent', 'semantic'].forEach(type => {
      const memoryType = type as 'contextual' | 'persistent' | 'semantic';
      const memoryData = context[memoryType]?.data || [];
      blocks.push(...memoryData);
    });
    
    return blocks;
  };

  // Calcular diferencias entre los contextos
  const calculateDiff = (): Record<string, DiffBlock[]> => {
    const originalBlocks = extractBlocks(previousContext);
    const modifiedBlocks = extractBlocks(currentContext);
    
    // Agrupar bloques por tipo (contextual, persistent, semantic)
    const result: Record<string, DiffBlock[]> = {
      contextual: [],
      persistent: [],
      semantic: []
    };
    
    // Verificar bloques sin cambios y modificados
    originalBlocks.forEach(originalBlock => {
      const modifiedBlock = modifiedBlocks.find(b => b.id === originalBlock.id);
      
      if (!modifiedBlock) {
        // Bloque eliminado (no se muestra en esta implementación)
        return;
      }
      
      if (modifiedBlock.content === originalBlock.content) {
        // Bloque sin cambios
        result[originalBlock.type].push({
          type: 'unchanged',
          original: originalBlock,
          modified: modifiedBlock,
          id: originalBlock.id
        });
      } else {
        // Bloque modificado
        result[originalBlock.type].push({
          type: 'modified',
          original: originalBlock,
          modified: modifiedBlock,
          id: originalBlock.id
        });
      }
    });
    
    // Buscar bloques añadidos
    modifiedBlocks.forEach(modifiedBlock => {
      const originalBlock = originalBlocks.find(b => b.id === modifiedBlock.id);
      
      if (!originalBlock) {
        // Bloque añadido
        result[modifiedBlock.type].push({
          type: 'added',
          modified: modifiedBlock,
          id: modifiedBlock.id
        });
      }
      // Los bloques modificados ya fueron procesados arriba
    });
    
    return result;
  };
  
  const diffResult = calculateDiff();

  // Estilo de fondo según el tipo de diferencia
  const getBlockStyle = (diffType: DiffType): string => {
    switch (diffType) {
      case 'unchanged': return 'bg-gray-50 border-gray-200';
      case 'added': return 'bg-green-50 border-green-200';
      case 'modified': return 'bg-yellow-50 border-yellow-200';
      case 'deleted': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900">Comparación de Contextos</h2>
      
      {Object.entries(diffResult).map(([groupType, blocks]) => {
        if (blocks.length === 0) return null;
        
        return (
          <div 
            key={groupType}
            className="border border-gray-200 rounded-md overflow-hidden"
            role="group"
            aria-label={`Diferencias de tipo ${groupType}`}
          >
            {/* Encabezado del grupo */}
            <div 
              className="flex justify-between items-center bg-gray-100 px-4 py-3 cursor-pointer"
              onClick={() => toggleGroup(groupType)}
            >
              <h3 className="text-lg font-medium text-gray-800 capitalize">
                {groupType} ({blocks.length})
              </h3>
              <button 
                aria-label={`${collapsedGroups[groupType] ? 'Expandir' : 'Colapsar'} sección ${groupType}`}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                {collapsedGroups[groupType] 
                  ? <span>+</span> 
                  : <span>-</span>}
              </button>
            </div>
            
            {/* Contenido del grupo */}
            {!collapsedGroups[groupType] && (
              <div className="p-4 space-y-3">
                {blocks.map(block => (
                  <div 
                    key={block.id}
                    data-testid={`diff-block-${block.type}`}
                    className={`p-3 border rounded-md ${getBlockStyle(block.type)}`}
                  >
                    {block.type === 'modified' && (
                      <>
                        <div className="text-xs text-gray-500 mb-2">Contenido original:</div>
                        <div className="p-2 bg-white rounded border border-gray-200 mb-3 text-sm">
                          {block.original?.content}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">Contenido modificado:</div>
                        <div className="p-2 bg-white rounded border border-gray-200 text-sm">
                          {block.modified?.content}
                        </div>
                      </>
                    )}
                    
                    {block.type === 'unchanged' && (
                      <div className="text-sm">{block.original?.content}</div>
                    )}
                    
                    {block.type === 'added' && (
                      <div className="text-sm">{block.modified?.content}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AgentContextDiffViewer; 