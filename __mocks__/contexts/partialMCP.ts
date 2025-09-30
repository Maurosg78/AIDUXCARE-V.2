import { MCPContext } from "../../src/core/mcp/schema";

/**
 * Contexto parcialmente válido con información limitada y ambigua
 * Este mock sirve para probar cómo maneja el agente la información insuficiente
 * o parcialmente válida, evaluando su capacidad de limpieza y validación
 */
export const partialMCP: MCPContext = {
  contextual: {
    source: "test-ehr",
    data: [
      {
        id: "ctx-partial-1",
        type: "contextual",
        content: "Paciente acude por malestar general no específico de varios días de evolución.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-partial-2",
        type: "contextual",
        content: "Signos vitales dentro de parámetros normales.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  },
  persistent: {
    source: "test-ehr",
    data: [
      {
        id: "per-partial-1",
        type: "persistent",
        content: "Sin antecedentes médicos relevantes documentados.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  },
  semantic: {
    source: "test-ehr",
    data: [
      {
        id: "sem-partial-1",
        type: "semantic",
        content: "El malestar general puede ser causado por múltiples etiologías incluyendo procesos infecciosos, metabólicos o psicológicos.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  }
}; 