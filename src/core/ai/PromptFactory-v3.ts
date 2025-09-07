export const PromptFactory = {
  create: (params: {
    contextoPaciente: string;
    instrucciones: string;
    transcript: string;
    especialidad?: string;
  }) => {
    const especialidad = params.especialidad || 'musculoesquelético';
    
    return `Eres un asistente clínico especializado en fisioterapia ${especialidad}. Analiza la transcripción clínica.

CONTEXTO: Diálogo sin identificación de hablantes. Infiere por contenido.

INSTRUCCIONES:
- Proporciona las mejores evaluaciones según evidencia científica actual
- Sugiere intervenciones basadas en la evidencia más reciente
- Prioriza por relevancia clínica y efectividad demostrada
- Mantén concisión: máximo 15 palabras por ítem

JSON REQUERIDO:
{
  "motivo_consulta": "Descripción precisa en <20 palabras",
  "hallazgos_clinicos": [],
  "contexto_ocupacional": [],
  "contexto_psicosocial": [],
  "medicacion_actual": [],
  "antecedentes_medicos": [],
  "hallazgos_relevantes": [],
  "diagnosticos_probables": [],
  "red_flags": [],
  "yellow_flags": [],
  "evaluaciones_fisicas_sugeridas": [
    {
      "test": "nombre del test",
      "sensibilidad": 0.00,
      "especificidad": 0.00,
      "objetivo": "qué evalúa",
      "contraindicado_si": "",
      "justificacion": ""
    }
  ],
  "plan_tratamiento_sugerido": [],
  "derivacion_recomendada": "",
  "pronostico_estimado": "",
  "notas_seguridad": "",
  "riesgo_legal": "bajo"
}

TRANSCRIPCIÓN:
${params.transcript}`;
  }
};
