import { MCPContext } from "../../src/core/mcp/schema";

/**
 * Contexto con datos de un paciente con condiciones crónicas
 * Diseñado para probar si el agente propone seguimiento o intervención adecuada
 */
export const chronicMCP: MCPContext = {
  contextual: {
    source: "test-ehr",
    data: [
      {
        id: "ctx-1",
        type: "contextual",
        content: "Paciente femenina de 72 años acude a control programado. Refiere buen cumplimiento del tratamiento farmacológico sin efectos adversos. Continúa con disnea a moderados esfuerzos (mMRC grado 2).",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-2",
        type: "contextual",
        content: "Signos vitales: TA 135/85 mmHg, FC 78 lpm, FR 20 rpm, T 36.7°C, SatO2 92% basal.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-3",
        type: "contextual",
        content: "Espirometría reciente: FEV1 65% del predicho, FEV1/FVC 0.68, compatible con obstrucción moderada.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-4",
        type: "contextual",
        content: "Examen físico: Edema maleolar bilateral +/+++. Crepitantes bibasales. Uso de musculatura accesoria con esfuerzos.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "ctx-5",
        type: "contextual",
        content: "Última exacerbación hace 2 meses que requirió ciclo corto de prednisona oral sin hospitalización.",
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
        content: "Diagnósticos: EPOC GOLD grupo D (diagnosticado hace 12 años), Hipertensión arterial controlada, Insuficiencia cardíaca NYHA II-III.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "per-2",
        type: "persistent",
        content: "Medicación actual: Salmeterol/Fluticasona 50/500 mcg c/12h, Tiotropio 18 mcg c/24h, Furosemida 40 mg c/día, Ramipril 5 mg c/día, Atorvastatina 20 mg c/noche.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "per-3",
        type: "persistent",
        content: "Factores de riesgo: Ex-fumadora 45 paquetes-año (cesación hace 8 años). Exposición a biomasa (estufas de leña) durante 25 años.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "per-4",
        type: "persistent",
        content: "Hospitalizaciones previas: 3 en los últimos 2 años por exacerbaciones de EPOC.",
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
        content: "EPOC GOLD grupo D requiere tratamiento con triple terapia (LAMA + LABA + ICS). Se debe considerar roflumilast si hay exacerbaciones frecuentes y FEV1<50%.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "sem-2",
        type: "semantic",
        content: "Las exacerbaciones frecuentes (≥2/año) en EPOC aumentan mortalidad y empeoran calidad de vida. La rehabilitación pulmonar reduce hospitalizaciones.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "sem-3",
        type: "semantic",
        content: "En EPOC con insuficiencia cardíaca concomitante, los beta-bloqueantes cardioselectivos a dosis bajas pueden ser utilizados con monitorización estrecha.",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  }
}; 