/**
 * Canadian Vertex → AiduxCare Schema Parser
 * Converts Vertex AI English-keyed response objects into AiduxCare's
 * internal Spanish-keyed schema, preserving value language (en-CA).
 *
 * Market: CA | Language: en-CA
 * COMPLIANCE_PARSING_RESTORED
 */

import type { ClinicalAnalysis } from "@/types/clinical";

/**
 * Maps a raw Vertex AI response to the internal AiduxCare schema.
 */
export function parseCanadianVertexResponse(raw: unknown): ClinicalAnalysis {
  console.log("[Canadian Parser] Processing response");

  if (raw == null) {
    console.warn("[Canadian Parser] Empty input received");
    return createEmptyClinicalAnalysis();
  }

  let data: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      console.error("[Canadian Parser] JSON parse error:", error);
      return createEmptyClinicalAnalysis();
    }
  } else if (typeof raw === "object") {
    data = { ...(raw as Record<string, unknown>) };
  } else {
    console.warn("[Canadian Parser] Unsupported input type");
    return createEmptyClinicalAnalysis();
  }

  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)) : [];

  const mapped: ClinicalAnalysis = {
    motivo_consulta: str(data["chief_complaint"] ?? data["reason_for_visit"]),
    hallazgos_clinicos: arr(data["clinical_findings"]),
    banderas_rojas: arr(data["red_flags"]),
    banderas_amarillas: arr(data["yellow_flags"]),
    evaluacion_fisica_propuesta: arr(data["proposed_tests"]),
    alertas_medico_legales: arr(data["medical_legal_alerts"]),
    plan_tratamiento: str(data["treatment_plan"]),
    contexto_psicosocial: arr(
      data["psychosocial_context"] ?? data["psychological_factors"]
    ),
    resumen: str(data["summary"]),
  };

  const frozen = Object.freeze(mapped);
  console.log("[Canadian Parser] Mapping complete:", frozen);
  return frozen;
}

function createEmptyClinicalAnalysis(): ClinicalAnalysis {
  return Object.freeze({
    motivo_consulta: "",
    hallazgos_clinicos: [],
    banderas_rojas: [],
    banderas_amarillas: [],
    evaluacion_fisica_propuesta: [],
    alertas_medico_legales: [],
    plan_tratamiento: "",
    contexto_psicosocial: [],
    resumen: "",
  });
}
