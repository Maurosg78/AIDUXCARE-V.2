export const buildClinicalPrompt = ({
  contextoPaciente,
  instrucciones,
  transcript
}: {
  contextoPaciente: string;
  instrucciones: string;
  transcript: string;
}): string => `
Eres un asistente clínico de fisioterapia. Devuelve SIEMPRE JSON estricto con este esquema:

{
  "motivo_consulta": string,
  "hallazgos_relevantes": string[],
  "diagnosticos_probables": string[],
  "red_flags": string[],
  "evaluaciones_fisicas_sugeridas": string[],
  "plan_tratamiento_sugerido": string[],
  "riesgo_legal": "bajo" | "medio" | "alto"
}

Reglas:
- No inventes datos ausentes.
- Si un campo no aplica, usa "" o [].
- Prioriza seguridad y red flags.
- La salida debe ser SOLO el JSON, sin texto adicional.

[Contexto paciente]
${contextoPaciente}

[Instrucciones]
${instrucciones}

[Transcripción]
${transcript}
`.trim();

console.log("[OK] PromptFactory.ts integrated");

export const PromptFactory = {
  create: (params: {
    contextoPaciente: string;
    instrucciones: string;
    transcript: string;
  }) => {
    return `Eres un asistente clínico de fisioterapia. Devuelve SIEMPRE JSON estricto con este esquema:
{
  "motivo_consulta": string,
  "hallazgos_relevantes": string[],
  "diagnosticos_probables": string[],
  "red_flags": string[],
  "evaluaciones_fisicas_sugeridas": string[],
  "plan_tratamiento_sugerido": string[],
  "riesgo_legal": "bajo" | "medio" | "alto"
}

Reglas:
- No inventes datos ausentes.
- Si un campo no aplica, usa "" o [].
- Prioriza seguridad y red flags.
- La salida debe ser SOLO el JSON, sin texto adicional.

[Contexto paciente]
${params.contextoPaciente}

[Instrucciones]
${params.instrucciones}

[Transcripción]
${params.transcript}`.trim();
  }
};
