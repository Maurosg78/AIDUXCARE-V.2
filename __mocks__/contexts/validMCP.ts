import { MCPContext, MCPMemoryBlock } from "../../src/core/mcp/schema";

/**
 * Interfaz extendida para los bloques de memoria en el contexto de pruebas
 * que incluye las propiedades opcionales necesarias
 */
export interface TestMCPMemoryBlock extends MCPMemoryBlock {
  visit_id?: string;
  patient_id?: string;
  timestamp: string;
  created_at: string;
}

/**
 * Contexto válido y completo con datos clínicos representativos
 * Este contexto incluye información suficiente para que el agente genere
 * sugerencias relacionadas con dolor torácico, hipertensión y diabetes
 */
export const validMCP: MCPContext = {
  contextual: {
    source: "test-ehr",
    data: [
      {
        id: "ctx-1",
        type: "contextual",
        content: "Paciente masculino de 64 años acude a consulta de seguimiento. Refiere dolor torácico opresivo de intensidad 6/10 que se irradia al brazo izquierdo, inició hace 2 días durante actividad moderada.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        visit_id: "visit-20230501-01",
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock,
      {
        id: "ctx-2",
        type: "contextual",
        content: "Signos vitales: Tensión arterial 165/95 mmHg, FC 88 lpm, FR 18 rpm, T 36.8°C, SatO2 95%.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        visit_id: "visit-20230501-01",
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock,
      {
        id: "ctx-3",
        type: "contextual",
        content: "Examen físico: Soplo sistólico aórtico grado II/VI. Resto sin alteraciones significativas.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        visit_id: "visit-20230501-01",
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock,
      {
        id: "ctx-4",
        type: "contextual",
        content: "Últimos resultados: Hemoglobina glicosilada 8.2%, Colesterol total 245 mg/dL, HDL 38 mg/dL, LDL 165 mg/dL.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        visit_id: "visit-20230501-01",
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock
    ]
  },
  persistent: {
    source: "test-ehr",
    data: [
      {
        id: "per-1",
        type: "persistent",
        content: "Antecedentes patológicos: Diabetes mellitus tipo 2 diagnosticada hace 10 años, Hipertensión arterial desde hace 8 años, Dislipidemia.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock,
      {
        id: "per-2",
        type: "persistent",
        content: "Tratamiento actual: Metformina 850mg c/12h, Losartán 50mg c/24h, Aspirina 100mg c/24h.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock,
      {
        id: "per-3",
        type: "persistent",
        content: "Alergias: No conocidas.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock,
      {
        id: "per-4",
        type: "persistent",
        content: "Antecedentes quirúrgicos: Apendicectomía hace 20 años, sin complicaciones.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        patient_id: "patient-12345"
      } as TestMCPMemoryBlock
    ]
  },
  semantic: {
    source: "test-ehr",
    data: [
      {
        id: "sem-1",
        type: "semantic",
        content: "El dolor torácico con irradiación al brazo izquierdo puede ser indicativo de cardiopatía isquémica y requiere evaluación inmediata.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "sem-2",
        type: "semantic",
        content: "Los pacientes con diabetes tipo 2 y valores de hemoglobina glicosilada superiores a 8% tienen mayor riesgo de complicaciones micro y macrovasculares.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "sem-3",
        type: "semantic",
        content: "La hipertensión arterial no controlada (>140/90 mmHg) en pacientes diabéticos aumenta significativamente el riesgo cardiovascular.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  }
}; 