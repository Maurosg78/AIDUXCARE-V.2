export const PromptFactory = {
  create: (params: {
    contextoPaciente: string;
    instrucciones: string;
    transcript: string;
  }) => {
    return `Eres un asistente clínico especializado en fisioterapia. Analiza la transcripción clínica.

REGLAS DE FORMATO:
- Hallazgos: máximo 15 palabras por ítem
- Tests: nombre corto, objetivo en 5-8 palabras
- Plan: intervenciones concretas, máximo 15 palabras
- Evitar redundancia y verbosidad excesiva

JSON REQUERIDO:
{
  "motivo_consulta": "Descripción precisa en <20 palabras",
  "hallazgos_clinicos": [
    "Dolor: localización, intensidad, tipo (máx 15 palabras)",
    "Temporalidad y desencadenante (máx 15 palabras)",
    "Síntomas relevantes (máx 15 palabras)"
  ],
  "contexto_ocupacional": [
    "Profesión y riesgos laborales en una línea"
  ],
  "contexto_psicosocial": [
    "Hábitos relevantes para recuperación"
  ],
  "medicacion_actual": [
    "Fármaco + dosis"
  ],
  "antecedentes_medicos": [
    "Solo relevantes al caso"
  ],
  "diagnosticos_probables": [
    "Principal más probable",
    "Diferencial si es relevante"
  ],
  "red_flags": [],
  "yellow_flags": [
    "Kinesiofobia o creencias limitantes sobre dolor",
    "Factores psicosociales que afecten pronóstico"
  ],
  "evaluaciones_fisicas_sugeridas": [
    {
      "test": "Nombre del test",
      "objetivo": "Evalúa X (máx 8 palabras)",
      "sensibilidad": 0.75,
      "especificidad": 0.80,
      "contraindicado_si": "Condición específica"
    }
  ],
  "plan_tratamiento_sugerido": [
    "Terapia manual: técnica específica (máx 12 palabras)",
    "Ejercicios: tipo y objetivo (máx 12 palabras)",
    "Educación: tema principal (máx 10 palabras)",
    "Modificaciones: actividad específica (máx 10 palabras)"
  ],
  "derivacion_recomendada": "",
  "pronostico_estimado": "X-Y semanas con adherencia",
  "notas_seguridad": "Precauciones específicas si aplican",
  "riesgo_legal": "bajo"
}

IMPORTANTE:
- Detectar SIEMPRE yellow flags psicosociales
- Incluir 3-5 tests específicos para la región
- Objetivos de tests en 5-8 palabras máximo
- Plan en 4 puntos concretos y breves

TRANSCRIPCIÓN:
${params.transcript}`;
  }
};
