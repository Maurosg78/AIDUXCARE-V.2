export class PromptFactory {
  static create(params: {
    transcript: string;
    specialty?: string;
    region?: string;
  }): string {
    const { transcript } = params;
    
    return `Eres un asistente clínico especializado. Analiza el siguiente caso y devuelve ÚNICAMENTE un JSON válido.

TRANSCRIPT DEL PACIENTE:
${transcript}

INSTRUCCIONES CRÍTICAS:
1. NO repitas información entre secciones
2. NO incluyas información redundante
3. Extrae SOLO lo que el paciente menciona explícitamente
4. Si no hay información para un campo, usa array vacío [] o string vacío ""

ESTRUCTURA JSON REQUERIDA (sin comentarios, sin markdown):
{
  "motivo_consulta": "razón principal de consulta en una frase",
  "edad": "edad si se menciona",
  "hallazgos_clinicos": [
    "SOLO hallazgos únicos y relevantes",
    "NO repetir información"
  ],
  "sintomas_principales": {
    "dolor": {
      "ubicacion": "donde duele",
      "intensidad": "leve/moderado/severo",
      "patron": "constante/intermitente",
      "agravantes": ["factores que empeoran"],
      "aliviantes": ["factores que mejoran"]
    },
    "funcionalidad": "limitaciones funcionales específicas"
  },
  "medicacion_actual": [
    "SOLO nombres de medicamentos mencionados"
  ],
  "antecedentes_relevantes": [
    "cirugías, condiciones previas, etc"
  ],
  "red_flags": [
    "SOLO banderas rojas reales y graves"
  ],
  "evaluaciones_sugeridas": [
    {
      "test": "nombre del test",
      "justificacion": "por qué este test"
    }
  ],
  "diagnosticos_probables": [
    "máximo 3, los más probables"
  ],
  "plan_tratamiento": {
    "inmediato": ["1-2 acciones prioritarias"],
    "corto_plazo": ["objetivos a 2-4 semanas"],
    "educacion": ["información clave para el paciente"]
  }
}

REGLAS ESTRICTAS:
- NO repitas "dolor" en cada hallazgo
- NO repitas la misma información en diferentes secciones
- CONSOLIDA información similar
- SÉ CONCISO y ESPECÍFICO
- MÁXIMO 3 items por array (excepto hallazgos: máximo 5)

Responde SOLO con el JSON, sin texto adicional.`;
  }
}

export default PromptFactory;
