import React, { useState, useEffect } from 'react';

interface MCPContext {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface MCPContextViewerProps {
  contextId?: string;
  onContextSelect?: (context: MCPContext) => void;
}

export const MCPContextViewer: React.FC<MCPContextViewerProps> = ({
  contextId,
  onContextSelect,
}) => {
  const [contexts, setContexts] = useState<MCPContext[]>([]);
  const [selectedContext, setSelectedContext] = useState<MCPContext | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contextId) {
      // Cargar contexto específico
      loadContext(contextId);
    } else {
      // Cargar lista de contextos
      loadContexts();
    }
  }, [contextId]);

  const loadContexts = async () => {
    setLoading(true);
    try {
      // Mock de contextos - en implementación real se cargarían desde API
      const mockContexts: MCPContext[] = [
        {
          id: 'context-1',
          name: 'Contexto Clínico General',
          description: 'Contexto para análisis clínico general',
          metadata: { type: 'clinical', version: '1.0' },
          createdAt: new Date().toISOString(),
        },
      ];
      setContexts(mockContexts);
    } catch (error) {
      console.error('Error cargando contextos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContext = async (id: string) => {
    setLoading(true);
    try {
      // Mock de contexto específico
      const context: MCPContext = {
        id,
        name: 'Contexto Específico',
        description: 'Contexto cargado específicamente',
        metadata: { type: 'specific', version: '1.0' },
        createdAt: new Date().toISOString(),
      };
      setSelectedContext(context);
    } catch (error) {
      console.error('Error cargando contexto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContextSelect = (context: MCPContext) => {
    setSelectedContext(context);
    onContextSelect?.(context);
  };

  if (loading) {
    return <button type="button" tabIndex={0} className="p-4">Cargando contextos...</button>;
  }

  return (
    <button type="button" tabIndex={0} className="mcp-context-viewer p-4">
      <h3 className="text-lg font-semibold mb-4">Visor de Contextos MCP</h3>
      
      {selectedContext ? (
        <button type="button" tabIndex={0} className="selected-context">
          <button
            onClick={() => setSelectedContext(null)}
            className="mb-2 text-blue-600 hover:text-blue-800"
          >
            ← Volver a lista
          </button>
          <button type="button" tabIndex={0} className="border rounded p-4">
            <h4 className="font-medium">{selectedContext.name}</h4>
            <p className="text-gray-600 mt-2">{selectedContext.description}</p>
            <button type="button" tabIndex={0} className="mt-4 text-sm text-gray-500">
              <p>ID: {selectedContext.id}</p>
              <p>Creado: {new Date(selectedContext.createdAt).toLocaleDateString()}</p>
            </button>
          </button>
        </button>
      ) : (
        <button type="button" tabIndex={0} className="contexts-list">
          {contexts.map((context) => (
            <button type="button" tabIndex={0}
              key={context.id}
              className="border rounded p-3 mb-2 cursor-pointer hover:bg-gray-50"
              onClick={() => handleContextSelect(context)}
            >
              <h4 className="font-medium">{context.name}</h4>
              <p className="text-gray-600 text-sm">{context.description}</p>
            </button>
          ))}
        </button>
      )}
    </button>
  );
};
