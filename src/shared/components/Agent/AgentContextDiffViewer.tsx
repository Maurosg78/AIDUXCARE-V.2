import React, { useState } from 'react';
import { MCPContext } from '../../../core/mcp/schema';
import { computeContextDiff, DiffResultBlock } from '../../../core/agent/ContextDiff';

/**
 * Props para el componente AgentContextDiffViewer
 */
interface AgentContextDiffViewerProps {
  originalContext: MCPContext;
  modifiedContext: MCPContext;
}

/**
 * Componente que muestra visualmente las diferencias entre dos contextos MCP
 */
const AgentContextDiffViewer: React.FC<AgentContextDiffViewerProps> = ({
  originalContext,
  modifiedContext,
}) => {
  // Calcular diferencias entre contextos
  const diffResults = computeContextDiff(originalContext, modifiedContext);

  // Estados para controlar la expansión de cada grupo
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    contextual: true,
    persistent: true,
    semantic: true,
  });

  // Si no hay diferencias, no mostramos nada
  if (!diffResults.length) {
    return (
      <div className="p-4 border rounded-md text-gray-500 bg-gray-50">
        No se encontraron diferencias entre los contextos.
      </div>
    );
  }

  // Agrupar diferencias por tipo
  const groupedResults: Record<string, DiffResultBlock[]> = {
    contextual: diffResults.filter((diff) => diff.type === 'contextual'),
    persistent: diffResults.filter((diff) => diff.type === 'persistent'),
    semantic: diffResults.filter((diff) => diff.type === 'semantic'),
  };

  // Función para cambiar el estado de expansión de un grupo
  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Obtener clase CSS para un bloque según su estado
  const getBlockClassName = (status: 'unchanged' | 'modified' | 'added'): string => {
    switch (status) {
      case 'added':
        return 'bg-green-50 border-green-200'; // 🟩 Verde claro para añadidos
      case 'modified':
        return 'bg-yellow-50 border-yellow-200'; // 🟨 Amarillo claro para modificados
      case 'unchanged':
      default:
        return 'bg-gray-50 border-gray-200'; // ⚪ Gris claro para sin cambios
    }
  };

  // Función para renderizar un bloque de diferencia
  const renderDiffBlock = (diff: DiffResultBlock) => {
    return (
      <div
        key={diff.id || `${diff.type}-${diff.newContent.substring(0, 10)}`}
        className={`p-3 mb-2 border rounded-md ${getBlockClassName(diff.status)}`}
        data-testid={`diff-block-${diff.status}`}
      >
        {diff.status === 'modified' && (
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-500 mb-1">Contenido original:</div>
            <div className="p-2 bg-red-50 text-red-700 border border-red-100 rounded-md text-sm">
              {diff.originalContent}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-2 mb-1">Contenido nuevo:</div>
            <div className="p-2 bg-green-50 text-green-700 border border-green-100 rounded-md text-sm">
              {diff.newContent}
            </div>
          </div>
        )}

        {diff.status !== 'modified' && (
          <div className="text-sm">
            {diff.newContent}
          </div>
        )}

        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {diff.id && <span>ID: {diff.id} | </span>}
            <span className="capitalize">Estado: {diff.status}</span>
          </div>
        </div>
      </div>
    );
  };

  // Traducción de los tipos para el encabezado
  const typeLabels: Record<string, string> = {
    contextual: 'Contextual',
    persistent: 'Persistente',
    semantic: 'Semántico',
  };

  return (
    <div className="border rounded-md border-gray-200 bg-white overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">
          Diferencias de Contexto
        </h3>
      </div>

      <div className="p-4">
        {/* Renderizar cada grupo de diferencias */}
        {Object.entries(groupedResults).map(([type, diffs]) => {
          // Si no hay diferencias en este grupo, no mostrarlo
          if (diffs.length === 0) return null;

          return (
            <div 
              key={type} 
              className="mb-4"
              role="group"
              aria-label={`Diferencias de tipo ${typeLabels[type]}`}
            >
              {/* Encabezado del grupo con botón para expandir/colapsar */}
              <div 
                className="flex items-center justify-between p-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200"
                onClick={() => toggleGroup(type)}
              >
                <h4 className="text-md font-medium">
                  {typeLabels[type]} ({diffs.length})
                </h4>
                <button 
                  className="focus:outline-none"
                  aria-label={expandedGroups[type] ? `Colapsar sección ${typeLabels[type]}` : `Expandir sección ${typeLabels[type]}`}
                  title={expandedGroups[type] ? "Colapsar" : "Expandir"}
                >
                  <svg
                    className={`w-5 h-5 transition-transform transform ${
                      expandedGroups[type] ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenido del grupo, visible solo si está expandido */}
              {expandedGroups[type] && (
                <div className="mt-2 space-y-2">
                  {diffs.map(renderDiffBlock)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentContextDiffViewer; 