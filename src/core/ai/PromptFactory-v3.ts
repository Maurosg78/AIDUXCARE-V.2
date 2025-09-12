export class PromptFactory {
  static create(config: any): string {
    const { transcript } = config;
    
    return `ANÁLISIS CLÍNICO - INSTRUCCIONES CRÍTICAS:

1. Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks, sin texto extra)
2. Extrae LITERALMENTE lo que menciona el paciente, NO inventes datos
3. CAMPOS OBLIGATORIOS a extraer del transcript:
   - medicacion_actual: nombres exactos mencionados (ej: "Lyrica", "Nolotil", "Paracetamol")
   - antecedentes_medicos: incluir edad si se menciona (ej: "84 años")
   - contexto_psicosocial: caídas, miedo, fatiga si se mencionan (ej: "tres caídas recientes")
   - motivo_consulta: duración REAL mencionada (ej: "desde junio", NO inventar "3 días")
4. Si algo no se menciona, usar [] para arrays o "" para strings
5. Incluir mínimo 3 tests físicos con sensibilidad/especificidad reales de literatura

TRANSCRIPT DEL PACIENTE:
"${transcript}"

RESPUESTA JSON EXACTA REQUERIDA:
{
  "motivo_consulta": "[extraer motivo y duración real del transcript]",
  "hallazgos_clinicos": ["[hallazgos mencionados literalmente]"],
  "hallazgos_relevantes": ["[información relevante del caso]"],
  "medicacion_actual": ["[medicamentos exactos mencionados]"],
  "antecedentes_medicos": ["[edad, condiciones previas mencionadas]"],
  "contexto_ocupacional": ["[trabajo o actividades mencionadas]"],
  "contexto_psicosocial": ["[caídas, miedo, estado emocional si se menciona]"],
  "diagnosticos_probables": ["[basado en síntomas descritos]"],
  "diagnosticos_diferenciales": ["[alternativas a considerar]"],
  "red_flags": ["[signos de alarma: caídas en anciano, pérdida de fuerza, etc]"],
  "yellow_flags": ["[factores psicosociales]"],
  "evaluaciones_fisicas_sugeridas": [
    {
      "test": "[nombre del test apropiado para el caso]",
      "sensibilidad": [valor decimal 0-1],
      "especificidad": [valor decimal 0-1],
      "tecnica": "[descripción breve]",
      "interpretacion": "[qué evalúa]"
    }
  ],
  "plan_tratamiento": {
    "inmediato": ["[acciones urgentes basadas en el caso]"],
    "corto_plazo": ["[2-4 semanas]"],
    "largo_plazo": ["[objetivos a largo plazo]"],
    "seguimiento": "[frecuencia recomendada]"
  },
  "recomendaciones": ["[específicas para el caso]"],
  "educacion_paciente": ["[información relevante]"]
}`;
  }
}

export default PromptFactory;
