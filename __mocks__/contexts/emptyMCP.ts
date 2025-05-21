import { MCPContext } from "../../src/core/mcp/schema";

/**
 * Contexto MCP vacío para probar el manejo de casos donde no hay datos disponibles
 * Este mock es útil para verificar que el agente maneje correctamente la ausencia de información
 */
export const emptyMCP: MCPContext = {
  contextual: {
    source: "test-ehr",
    data: []
  },
  persistent: {
    source: "test-ehr",
    data: []
  },
  semantic: {
    source: "test-ehr",
    data: []
  }
}; 