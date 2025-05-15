import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MCPContextViewer from '@/shared/components/MCP/MCPContextViewer';
import AuditLogViewer from '@/shared/components/Audit/AuditLogViewer';
import AgentSuggestionsViewer from '@/shared/components/Agent/AgentSuggestionsViewer';
import { MCPContext } from '@/core/mcp/schema';
import { MCPManager } from '@/core/mcp/MCPManager';
import { AuditLogger } from '@/core/mcp/AuditLogger';
import { AgentSuggestion } from '@/core/agent/ClinicalAgent';
import { buildAgentContext } from '@/core/agent/AgentContextBuilder';
import { getAgentSuggestions } from '@/core/agent/ClinicalAgent';

/**
 * Página de detalle de una visita clínica
 * Incluye la visualización del contexto MCP generado para esta visita
 */
const VisitDetailPage: React.FC = () => {
  const { id: visitId } = useParams<{ id: string }>();
  const [context, setContext] = useState<MCPContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);

  // Referencia al MCPManager
  const mcpManager = new MCPManager();

  useEffect(() => {
    // Función asincrónica para obtener el contexto MCP
    const fetchMCPContext = async () => {
      try {
        if (!visitId) {
          throw new Error('ID de visita no disponible');
        }
        
        setLoading(true);
        
        // DEUDA TÉCNICA: Usar patientId simulado hasta que se integre con datos reales del EMR
        const patientId = "patient-test-456";
        
        // Obtener el contexto usando la instancia de MCPManager
        const mcpContext = await mcpManager.buildContext(visitId, patientId);
        
        setContext(mcpContext);
        setError(false);

        // Generar un contexto para el agente
        const agentContext = buildAgentContext(mcpContext);
        
        // Obtener sugerencias del agente
        const agentSuggestions = await getAgentSuggestions(agentContext);
        setSuggestions(agentSuggestions);
      } catch (err) {
        console.error('Error al cargar el contexto MCP:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMCPContext();
  }, [visitId]);

  // Función para guardar el contexto con persistencia real en Supabase
  const handleSaveContext = async (updatedContext: MCPContext): Promise<void> => {
    try {
      setSaving(true);
      setSaveError(false);
      setSaveSuccess(false);
      
      // Usando la persistencia real en Supabase
      const success = await mcpManager.saveContext(updatedContext);
      
      if (!success) {
        throw new Error('Error al guardar el contexto en Supabase');
      }
      
      // Actualizamos el estado local para reflejar los cambios
      setContext(updatedContext);
      setSaveSuccess(true);
      setEditMode(false);

      // Actualizar sugerencias del agente con el contexto actualizado
      if (updatedContext) {
        const agentContext = buildAgentContext(updatedContext);
        const agentSuggestions = await getAgentSuggestions(agentContext);
        setSuggestions(agentSuggestions);
      }
    } catch (err) {
      console.error('Error al guardar el contexto MCP:', err);
      setSaveError(true);
    } finally {
      setSaving(false);
      
      // Ocultar el mensaje de éxito después de 3 segundos
      if (saveSuccess) {
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Detalle de Visita {visitId}</h1>
        
        {!loading && !error && context && (
          <div className="flex items-center space-x-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Editar Contexto
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar Edición
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Aquí irían otros detalles de la visita */}
      <div className="mb-8">
        {/* Detalles básicos como fecha, doctor, etc. */}
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Contexto Clínico (MCP)</h2>
        
        {saving && (
          <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded text-center">
            <p className="text-blue-600">Guardando cambios en la base de datos...</p>
          </div>
        )}
        
        {saveError && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-center">
            <p className="text-red-600">Error al guardar los cambios en la base de datos. Por favor, intente nuevamente.</p>
          </div>
        )}
        
        {saveSuccess && (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded text-center">
            <p className="text-green-600">¡Cambios guardados exitosamente en la base de datos!</p>
          </div>
        )}
        
        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-center">
            <p className="text-blue-600">Cargando contexto...</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
            <p className="text-red-600">No se pudo generar el contexto clínico</p>
          </div>
        )}
        
        {!loading && !error && context && (
          <MCPContextViewer 
            context={context} 
            editable={editMode}
            onSave={handleSaveContext}
          />
        )}
      </div>
      
      {/* Visor de sugerencias del agente */}
      {visitId && !loading && !error && (
        <AgentSuggestionsViewer 
          visitId={visitId}
          suggestions={suggestions}
        />
      )}
      
      {/* Visor de logs de auditoría */}
      {visitId && (
        <AuditLogViewer 
          visitId={visitId}
          logs={AuditLogger.getAuditLogs()}
        />
      )}
    </div>
  );
};

export default VisitDetailPage; 