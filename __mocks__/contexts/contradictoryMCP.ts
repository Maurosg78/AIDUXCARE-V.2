import { MCPContext } from "../../src/core/mcp/schema";

/**
 * Contexto con datos clínicos contradictorios o inconsistentes
 * Diseñado para probar cómo el agente maneja la información ambigua
 */
export const contradictoryMCP: MCPContext = {
  contextual: {
    source: "test-ehr",
    data: [
      {
        id: "ctx-1",
        type: "contextual",
        content: "Paciente refiere no tener antecedentes de hipertensión arterial ni diabetes. Sin tratamiento farmacológico previo.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-2",
        type: "contextual",
        content: "Signos vitales: Tensión arterial 110/70 mmHg, FC 72 lpm, FR 16 rpm, T 36.5°C, SatO2 98%",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-3",
        type: "contextual",
        content: "Paciente en tratamiento con Metformina 500mg c/8h y Enalapril 10mg c/24h desde hace 3 años.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-4",
        type: "contextual",
        content: "Último control de presión arterial: HTA no controlada (175/95 mmHg).",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-5", 
        type: "contextual",
        content: "Glucemia en ayunas: 65 mg/dL (hipoglucemia). Hemoglobina glicosilada: 9.7% (mal control).",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  },
  persistent: {
    source: "test-ehr",
    data: [
      {
        id: "per-1",
        type: "persistent",
        content: "No presenta alergias conocidas a medicamentos.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "per-2",
        type: "persistent",
        content: "Presenta reacciones alérgicas severas documentadas a la Aspirina y Paracetamol.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  },
  semantic: {
    source: "test-knowledge",
    data: [
      {
        id: "sem-1",
        type: "semantic",
        content: "La hipoglucemia severa (<70 mg/dL) es incompatible con una hemoglobina glicosilada elevada, excepto en casos donde existe variabilidad glucémica extrema.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "sem-2",
        type: "semantic",
        content: "El patrón normal de presión arterial en adultos es menor a 120/80 mmHg. Valores superiores a 140/90 mmHg indican hipertensión.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  }
}; 