import { MCPMemoryBlock } from "../mcp/schema";

/**
 * Tipo que representa el estado de un bloque comparado
 */
export type DiffState = 'igual' | 'modificado' | 'eliminado' | 'añadido';

/**
 * Interfaz para representar una entrada en la comparación de bloques MCP
 */
export interface DiffEntry {
  id: string;
  type: 'contextual' | 'persistent' | 'semantic';
  field: string;
  value_before?: string;
  value_after?: string;
  state: DiffState;
}

/**
 * Estructura con estadísticas de cambios por tipo
 */
export interface DiffStats {
  contextual: {
    total: number;
    modificados: number;
    eliminados: number;
    añadidos: number;
  };
  persistent: {
    total: number;
    modificados: number;
    eliminados: number;
    añadidos: number;
  };
  semantic: {
    total: number;
    modificados: number;
    eliminados: number;
    añadidos: number;
  };
}

/**
 * Interfaz para la comparación de contextos MCP
 */
export interface MCPContextDiff {
  previousVisitId: string;
  currentVisitId: string;
  entries: DiffEntry[];
  stats: DiffStats;
} 