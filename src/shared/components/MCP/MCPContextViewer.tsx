import React, { useState, useCallback, useEffect } from "react";
import { MCPContext } from "@/core/mcp/schema";

/**
 * Props para el componente MCPContextViewer
 */
interface MCPContextViewerProps {
  context: MCPContext;
  editable?: boolean;
  onSave?: (updatedContext: MCPContext) => Promise<void>;
}

/**
 * Interface simplificada para los bloques de memoria
 */
interface MemoryBlockDisplay {
  id: string;
  type: string;
  content: string;
  timestamp?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
  visit_id?: string;
  patient_id?: string;
  tags?: string[];
  validated?: boolean; // Estado de validación
}

/**
 * Componente para mostrar un bloque de memoria individual
 */
const MemoryBlockItem: React.FC<{
  block: MemoryBlockDisplay;
  editable: boolean;
  onValidate: (id: string, validated: boolean) => void;
  onEdit: (id: string, content: string) => void;
}> = ({ block, editable, onValidate, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);

  // Determinar la clase de color según el tipo de bloque
  const getBadgeColorClass = (type: string) => {
    switch (type) {
      case "contextual":
        return "bg-blue-100 text-blue-800";
      case "persistent":
        return "bg-green-100 text-green-800";
      case "semantic":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener la fecha formateada
  const getFormattedDate = () => {
    // Usar timestamp si está disponible, o created_at como fallback
    const dateString = block.timestamp || block.created_at;
    if (!dateString) return "Fecha no disponible";

    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Manejar el guardado del contenido editado
  const handleSaveEdit = () => {
    onEdit(block.id, editedContent);
    setEditing(false);
  };

  // Cancelar la edición
  const handleCancelEdit = () => {
    setEditedContent(block.content);
    setEditing(false);
  };

  // Color de fondo según estado de validación
  const validationBgColor = block.validated
    ? "border-green-300 bg-green-50"
    : "border-yellow-300 bg-yellow-50";

  // ID único para el textarea (necesario para el label)
  const textareaId = `edit-textarea-${block.id}`;

  return (
    <div
      className={`border rounded-md p-4 mb-3 ${editable ? validationBgColor : "bg-white"} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getBadgeColorClass(block.type)}`}
          >
            {block.type}
          </span>
          {editable && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${block.validated ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}
            >
              {block.validated ? "Validado" : "Pendiente"}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">ID: {block.id}</span>
      </div>

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-700">Contenido:</p>
        {editing ? (
          <div className="mt-1">
            <label htmlFor={textareaId} className="sr-only">
              Editar contenido del bloque
            </label>
            <textarea
              id={textareaId}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Escriba el contenido actualizado del bloque de memoria"
              aria-label="Contenido del bloque de memoria"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-200">
              {block.content}
            </p>
            {editable && (
              <button
                onClick={() => setEditing(true)}
                className="absolute top-2 right-2 p-1 text-xs text-blue-600 bg-white rounded-md border border-blue-200 hover:bg-blue-50"
                aria-label={`Editar bloque ${block.id}`}
              >
                Editar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        <div>
          <span className="font-medium">Fecha:</span> {getFormattedDate()}
        </div>

        {block.visit_id && (
          <div>
            <span className="font-medium">Visita:</span> {block.visit_id}
          </div>
        )}

        {block.patient_id && (
          <div>
            <span className="font-medium">Paciente:</span> {block.patient_id}
          </div>
        )}
      </div>

      {block.metadata && (
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-700 mb-1">Metadata:</p>
          <pre className="text-xs bg-slate-50 p-2 rounded border border-slate-200 overflow-auto max-h-24">
            {JSON.stringify(block.metadata, null, 2)}
          </pre>
        </div>
      )}

      {block.tags && block.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {block.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 bg-gray-100 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {editable && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onValidate(block.id, !block.validated)}
            className={`px-3 py-1 text-xs rounded-md ${
              block.validated
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            }`}
            aria-label={
              block.validated ? "Marcar como no validado" : "Validar bloque"
            }
          >
            {block.validated ? "Validado ✓" : "Validar"}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente para mostrar una sección de memoria (contextual, persistent o semantic)
 */
const MemorySection: React.FC<{
  title: string;
  source: string;
  data: unknown[];
  colorClass: string;
  editable: boolean;
  onValidateBlock: (id: string, validated: boolean) => void;
  onEditBlock: (id: string, content: string) => void;
}> = ({
  title,
  source,
  data,
  colorClass,
  editable,
  onValidateBlock,
  onEditBlock,
}) => {
  // Convertir los datos a un formato consistente para el componente
  const displayData = (data || []).map((item) => {
    const block = item as Record<string, unknown>;
    return {
      id: String(block.id || ""),
      type: String(block.type || ""),
      content: String(block.content || ""),
      timestamp: block.timestamp as string | undefined,
      created_at: block.created_at as string | undefined,
      metadata: block.metadata as Record<string, unknown> | undefined,
      visit_id: block.visit_id as string | undefined,
      patient_id: block.patient_id as string | undefined,
      tags: block.tags as string[] | undefined,
      validated: block.validated as boolean | undefined,
    };
  });

  return (
    <div className="mb-6">
      <div
        className={`px-4 py-2 rounded-t-md font-medium text-white ${colorClass}`}
      >
        {title}
        <span className="text-xs ml-2 opacity-75">Fuente: {source}</span>
      </div>

      <div className="border border-t-0 rounded-b-md p-4 bg-slate-50">
        {displayData.length > 0 ? (
          displayData.map((block) => (
            <MemoryBlockItem
              key={block.id}
              block={block}
              editable={editable}
              onValidate={onValidateBlock}
              onEdit={onEditBlock}
            />
          ))
        ) : (
          <div className="text-sm text-gray-500 italic p-4 text-center bg-white rounded border">
            Sin datos disponibles en esta sección
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Componente principal para visualizar el contexto MCP
 */
const MCPContextViewer: React.FC<MCPContextViewerProps> = ({
  context,
  editable = false,
  onSave,
}) => {
  // Estado interno para controlar las modificaciones al contexto
  const [workingContext, setWorkingContext] = useState<MCPContext>(context);
  const [allValidated, setAllValidated] = useState(false);

  // Actualizar el estado local cuando cambia el contexto externo
  useEffect(() => {
    setWorkingContext(context);
  }, [context]);

  // Verificar si todos los bloques están validados
  useEffect(() => {
    const allMemoryBlocks = [
      ...workingContext.contextual.data,
      ...workingContext.persistent.data,
      ...workingContext.semantic.data,
    ];

    const allBlocksValidated =
      allMemoryBlocks.length > 0 &&
      allMemoryBlocks.every((block) => block.validated === true);

    setAllValidated(allBlocksValidated);
  }, [workingContext]);

  // Función para validar un bloque
  const handleValidateBlock = useCallback((id: string, validated: boolean) => {
    setWorkingContext((prevContext) => {
      // Crear una copia profunda del contexto
      const newContext = JSON.parse(JSON.stringify(prevContext)) as MCPContext;

      // Buscar y actualizar el bloque en todas las secciones
      const updateBlockInSection = (section: typeof newContext.contextual) => {
        const blockIndex = section.data.findIndex((block) => block.id === id);
        if (blockIndex !== -1) {
          section.data[blockIndex] = {
            ...section.data[blockIndex],
            validated,
          };
        }
      };

      updateBlockInSection(newContext.contextual);
      updateBlockInSection(newContext.persistent);
      updateBlockInSection(newContext.semantic);

      return newContext;
    });
  }, []);

  // Función para editar el contenido de un bloque
  const handleEditBlock = useCallback((id: string, content: string) => {
    setWorkingContext((prevContext) => {
      // Crear una copia profunda del contexto
      const newContext = JSON.parse(JSON.stringify(prevContext)) as MCPContext;

      // Buscar y actualizar el bloque en todas las secciones
      const updateBlockInSection = (section: typeof newContext.contextual) => {
        const blockIndex = section.data.findIndex((block) => block.id === id);
        if (blockIndex !== -1) {
          section.data[blockIndex] = {
            ...section.data[blockIndex],
            content,
            // Al editar, se marca como no validado
            validated: false,
          };
        }
      };

      updateBlockInSection(newContext.contextual);
      updateBlockInSection(newContext.persistent);
      updateBlockInSection(newContext.semantic);

      return newContext;
    });
  }, []);

  // Guardar cambios en el contexto (solo enviar para validación, sin persistencia real)
  const handleSaveContext = async () => {
    if (onSave) {
      // En esta versión, solo se simula la validación sin persistencia real
      // La persistencia real se implementará en v2.2.1-persistence
      await onSave(workingContext);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {editable ? "Editor de Contexto MCP" : "Visor de Contexto MCP"}
        </h2>

        {editable && (
          <button
            onClick={handleSaveContext}
            disabled={!allValidated}
            className={`px-4 py-2 rounded-md text-white ${
              allValidated
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            aria-label="Confirmar incorporación al EMR"
          >
            Confirmar incorporación al EMR
          </button>
        )}
      </div>

      <MemorySection
        title="Memoria Contextual"
        source={workingContext.contextual.source}
        data={workingContext.contextual.data}
        colorClass="bg-blue-600"
        editable={editable}
        onValidateBlock={handleValidateBlock}
        onEditBlock={handleEditBlock}
      />

      <MemorySection
        title="Memoria Persistente"
        source={workingContext.persistent.source}
        data={workingContext.persistent.data}
        colorClass="bg-green-600"
        editable={editable}
        onValidateBlock={handleValidateBlock}
        onEditBlock={handleEditBlock}
      />

      <MemorySection
        title="Memoria Semántica"
        source={workingContext.semantic.source}
        data={workingContext.semantic.data}
        colorClass="bg-purple-600"
        editable={editable}
        onValidateBlock={handleValidateBlock}
        onEditBlock={handleEditBlock}
      />

      {editable && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h3 className="text-md font-semibold mb-2">Instrucciones:</h3>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Edite el contenido de los bloques según sea necesario</li>
            <li>Valide cada bloque individualmente</li>
            <li>Los bloques pendientes se muestran con fondo amarillo</li>
            <li>Los bloques validados se muestran con fondo verde</li>
            <li>
              El botón &quot;Confirmar incorporación al EMR&quot; se habilitará
              cuando todos los bloques estén validados
            </li>
            <li className="text-blue-600">
              Nota: La persistencia real estará disponible en v2.2.1-persistence
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MCPContextViewer;
