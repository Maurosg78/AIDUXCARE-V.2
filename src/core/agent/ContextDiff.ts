import { MCPContext, MCPMemoryBlock } from "../mcp/schema";

/**
 * Tipos de estado de diferencia entre bloques de memoria
 */
export type DiffStatus = "unchanged" | "modified" | "added";

/**
 * Resultado de la comparación de un bloque de memoria
 */
export interface DiffResultBlock {
  id?: string;
  type: "contextual" | "persistent" | "semantic";
  status: DiffStatus;
  originalContent?: string;
  newContent: string;
  metadata?: Record<string, unknown>;
}

/**
 * Compara dos contextos MCP y genera un array de resultados de diferencia
 *
 * @param original Contexto MCP original
 * @param modified Contexto MCP modificado
 * @returns Array de bloques con las diferencias encontradas
 */
export function computeContextDiff(
  original: MCPContext,
  modified: MCPContext,
): DiffResultBlock[] {
  const result: DiffResultBlock[] = [];

  // Función auxiliar para procesar los bloques de memoria desde la estructura MCPContext
  const extractBlocks = (memoryData: {
    data: {
      id: string;
      type: "contextual" | "persistent" | "semantic";
      content: string;
      metadata?: Record<string, unknown>;
    }[];
  }): MCPMemoryBlock[] => {
    return memoryData.data.map(
      (item) =>
        ({
          id: item.id,
          type: item.type,
          content: item.content,
          metadata: item.metadata,
        }) as MCPMemoryBlock,
    );
  };

  // Función auxiliar para comparar arrays de bloques de memoria
  const compareBlocks = (
    type: "contextual" | "persistent" | "semantic",
    originalBlocks: MCPMemoryBlock[],
    modifiedBlocks: MCPMemoryBlock[],
  ) => {
    // Crear mapa de bloques originales para consulta rápida por ID
    const originalBlocksMap = new Map<string, MCPMemoryBlock>();
    originalBlocks.forEach((block) => {
      if (block.id) {
        originalBlocksMap.set(block.id, block);
      }
    });

    // Verificar cada bloque modificado
    modifiedBlocks.forEach((modifiedBlock) => {
      if (!modifiedBlock.id) {
        // Bloques sin ID se consideran nuevos
        result.push({
          type,
          status: "added",
          newContent: modifiedBlock.content,
          metadata: modifiedBlock.metadata,
        });
        return;
      }

      const originalBlock = originalBlocksMap.get(modifiedBlock.id);

      if (!originalBlock) {
        // Bloque no encontrado en el original, es nuevo
        result.push({
          id: modifiedBlock.id,
          type,
          status: "added",
          newContent: modifiedBlock.content,
          metadata: modifiedBlock.metadata,
        });
      } else {
        // Comparar contenido para determinar si ha cambiado
        if (originalBlock.content !== modifiedBlock.content) {
          result.push({
            id: modifiedBlock.id,
            type,
            status: "modified",
            originalContent: originalBlock.content,
            newContent: modifiedBlock.content,
            metadata: modifiedBlock.metadata,
          });
        } else {
          // El contenido no ha cambiado
          result.push({
            id: modifiedBlock.id,
            type,
            status: "unchanged",
            originalContent: originalBlock.content,
            newContent: modifiedBlock.content,
            metadata: modifiedBlock.metadata,
          });
        }

        // Marcar como procesado eliminándolo del mapa
        originalBlocksMap.delete(modifiedBlock.id);
      }
    });

    // Cualquier bloque restante en el mapa original no está en el modificado
    // No los incluimos en el resultado, ya que solo nos interesa lo que se mantiene o cambia
  };

  // Procesar y comparar bloques por tipo
  compareBlocks(
    "contextual",
    original.contextual ? extractBlocks(original.contextual) : [],
    modified.contextual ? extractBlocks(modified.contextual) : [],
  );

  compareBlocks(
    "persistent",
    original.persistent ? extractBlocks(original.persistent) : [],
    modified.persistent ? extractBlocks(modified.persistent) : [],
  );

  compareBlocks(
    "semantic",
    original.semantic ? extractBlocks(original.semantic) : [],
    modified.semantic ? extractBlocks(modified.semantic) : [],
  );

  return result;
}
