export const PromptFactory = {
  create: (params: {
    contextoPaciente: string;
    instrucciones: string;
    transcript: string;
  }) => {
    return `Eres un asistente clínico. Analiza la transcripción y EXTRAE TODA la información relevante.

IMPORTANTE: Todos los campos son obligatorios. Si no hay información explícita, deduce del contexto.

Devuelve JSON con TODOS estos campos llenos:

{
  "motivo_consulta": "Descripción clara del problema principal del paciente",
  "hallazgos_relevantes": [
    "Cada hallazgo clínico importante",
    "Ocupación y actividades relevantes", 
    "Factores agravantes/aliviantes",
    "Antecedentes mencionados"
  ],
  "diagnosticos_probables": [
    "Diagnóstico más probable basado en la evidencia",
    "Diagnósticos diferenciales a considerar"
  ],
  "red_flags": [
    "Solo si hay signos de alarma reales"
  ],
  "evaluaciones_fisicas_sugeridas": [
    {
      "test": "Nombre del test específico para la región afectada",
      "sensibilidad": 0.00,
      "especificidad": 0.00,
      "score": 0.00,
      "indicacion": "Qué patología evalúa",
      "justificacion": "Por qué este test para este caso"
    }
  ],
  "plan_tratamiento_sugerido": [
    "Intervención terapéutica específica",
    "Educación al paciente",
    "Modificaciones de actividad",
    "Plan de seguimiento"
  ],
  "riesgo_legal": "bajo"
}

REGLAS CRÍTICAS:
1. NINGÚN campo puede estar vacío
2. Usa la información MÁS RECIENTE si hay correcciones
3. Los tests deben ser específicos para la región afectada
4. Si el paciente dice "NO es lumbar, es interescapular", usa tests para región torácica

[Transcripción]
${params.transcript}`;
  }
};
