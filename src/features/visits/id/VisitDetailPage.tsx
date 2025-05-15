import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MCPContextViewer from '@/shared/components/MCP/MCPContextViewer';
import { MCPContext } from '@/core/mcp/schema';
import { MCPManager } from '@/core/mcp/MCPManager';

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
      } catch (err) {
        console.error('Error al cargar el contexto MCP:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMCPContext();
  }, [visitId]);

  // Función para simular guardado del contexto (sin persistencia real)
  const handleSaveContext = async (updatedContext: MCPContext): Promise<void> => {
    try {
      setSaving(true);
      setSaveError(false);
      setSaveSuccess(false);
      
      // NOTA: En esta versión, solo simulamos el guardado con un console.log
      // La persistencia real estará disponible en v2.2.1-persistence
      console.log("✅ Contexto validado y listo para guardar");
      
      // Utilizamos saveContext solo para logging (no hay persistencia real)
      await mcpManager.saveContext(updatedContext);
      
      // Actualizamos el estado local para reflejar los cambios
      setContext(updatedContext);
      setSaveSuccess(true);
      setEditMode(false);
    } catch (err) {
      console.error('Error al simular guardado del contexto MCP:', err);
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
            <p className="text-blue-600">Simulando guardado...</p>
          </div>
        )}
        
        {saveError && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-center">
            <p className="text-red-600">Error al procesar los cambios. Por favor, intente nuevamente.</p>
          </div>
        )}
        
        {saveSuccess && (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded text-center">
            <p className="text-green-600">¡Cambios validados correctamente! (Guardado simulado)</p>
            <p className="text-xs text-gray-600 mt-1">Nota: La persistencia real estará disponible en v2.2.1-persistence</p>
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
    </div>
  );
};

export default VisitDetailPage; 