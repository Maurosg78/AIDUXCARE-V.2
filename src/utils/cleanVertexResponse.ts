// Clean Vertex response normalizer for Niagara demo
// Handles both Spanish and English field names

type MedInput = { name?: string; reason?: string; nombre?: string; motivo?: string }
type RedFlagInput = { finding?: string; rationale?: string; priority?: string; hallazgo?: string; justificacion?: string; prioridad?: string }
type TestInput = { test?: string; reason?: string; sensitivity?: number; specificity?: number }

function mapPriority(p?: string): string {
  const s = (p || "").toLowerCase()
  if (s.includes("er")) return "ER"
  if (s.includes("urgent")) return "Urgent"
  return "Medical"
}

function formatRedFlag(input: any): string {
  let text = "";
  
  if (typeof input === "string") {
    text = input;
  } else if (input && typeof input === "object") {
    const priority = mapPriority(input.priority || input.prioridad);
    const finding = input.finding || input.hallazgo || "";
    const rationale = input.rationale || input.justificacion || "";
    
    // Build the flag text
    text = finding;
    if (rationale) text += ` - ${rationale}`;
    if (priority) text = `[${priority}] ${text}`;
  }
  
  // Clean and limit to essential info
  text = text.replace(/^⚠️\s*/, "").trim();
  const words = text.split(/\s+/).slice(0, 15);
  return `⚠️ ${words.join(" ")}`;
}

export function normalizeVertexResponse(input: any): any {
  // Default safe structure
  const empty = {
    motivo_consulta: "",
    hallazgos_clinicos: [],
    hallazgos_relevantes: [],
    contexto_ocupacional: [],
    contexto_psicosocial: [],
    medicacion_actual: [],
    antecedentes_medicos: [],
    diagnosticos_probables: [],
    red_flags: [],
    yellow_flags: [],
    evaluaciones_fisicas_sugeridas: [],
    plan_tratamiento_sugerido: [],
    derivacion_recomendada: "",
    pronostico_estimado: "",
    notas_seguridad: "",
    riesgo_legal: "bajo"
  };

  try {
    // Parse if wrapped as {text: "json"}
    if (input && typeof input.text === "string") {
      try {
        input = JSON.parse(input.text);
      } catch {
        // If not JSON, use as is
      }
    }

    if (!input || typeof input !== "object") return empty;

    // Case 1: Already has Spanish field names
    if (input.motivo_consulta !== undefined || input.hallazgos_clinicos !== undefined) {
      return {
        ...empty,
        ...input,
        red_flags: Array.isArray(input.red_flags) 
          ? input.red_flags.map(formatRedFlag)
          : [],
        medicacion_actual: Array.isArray(input.medicacion_actual)
          ? input.medicacion_actual.map((m: any) => {
              if (typeof m === "string") return m;
              const name = m.nombre || m.name || "";
              const reason = m.motivo || m.reason || "";
              return reason ? `${name} - ${reason}` : name;
            })
          : []
      };
    }

    // Case 2: English field names from Vertex
    const meds = Array.isArray(input.medications) 
      ? input.medications.map((m: any) => {
          if (typeof m === "string") return m;
          const name = m.name || "";
          const reason = m.reason || "";
          return reason ? `${name} - ${reason}` : name;
        })
      : [];

    const redFlags = Array.isArray(input.red_flags)
      ? input.red_flags.map(formatRedFlag)
      : [];

    const tests = Array.isArray(input.suggested_tests)
      ? input.suggested_tests.map((t: any) => ({
          test: typeof t === "string" ? t : (t.test || ""),
          sensibilidad: typeof t === "object" && t.sensitivity ? t.sensitivity : 0.85,
          especificidad: typeof t === "object" && t.specificity ? t.specificity : 0.85,
          objetivo: typeof t === "object" ? (t.reason || "") : "",
          contraindicado_si: "",
          justificacion: ""
        }))
      : [];

    return {
      ...empty,
      motivo_consulta: input.chief_complaint || "",
      hallazgos_clinicos: Array.isArray(input.physical_findings) ? input.physical_findings : [],
      contexto_psicosocial: Array.isArray(input.social_context) ? input.social_context : [],
      medicacion_actual: meds,
      red_flags: redFlags,
      yellow_flags: Array.isArray(input.yellow_flags) ? input.yellow_flags : [],
      evaluaciones_fisicas_sugeridas: tests
    };

  } catch (error) {
    console.error("[cleanVertexResponse] Error:", error);
    return empty;
  }
}
