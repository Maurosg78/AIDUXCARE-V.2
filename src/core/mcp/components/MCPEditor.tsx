import { vi } from "vitest";
import React, { useState } from 'react';
import { MCPContext } from '../schema';

interface MCPEditorProps {
  initialContext: MCPContext;
  onSave: (context: MCPContext) => Promise<void>;
  saving?: boolean;
}

const MCPEditor: React.FC<MCPEditorProps> = ({ 
  initialContext, 
  onSave,
  saving = false 
}) => {
  const [context, setContext] = useState<MCPContext>(initialContext);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      await onSave(context);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  // Función para manejar cambios en el editor (en una versión simplificada)
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      // Simplemente analizar el JSON ingresado
      const updatedContext = JSON.parse(e.target.value);
      setContext(updatedContext);
    } catch (error) {
      console.error('Error al parsear JSON:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-900">Contexto Clínico</h2>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        {isEditing ? (
          <textarea
            className="w-full h-64 font-mono text-sm p-2 border rounded"
            value={JSON.stringify(context, null, 2)}
            onChange={handleContentChange}
            aria-label="Editor de contexto MCP"
          />
        ) : (
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(context, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default MCPEditor; 