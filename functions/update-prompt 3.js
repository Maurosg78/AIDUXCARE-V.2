// Actualizar el prompt en functions/index.js para ser genérico

const GENERIC_PROMPT = `
Analiza esta transcripción de consulta médica/fisioterapia.
Extrae TODA la información clínicamente relevante.

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.

Estructura requerida:
{
  "entities": [
    {
      "text": "descripción",
      "type": "symptom|medication|condition|finding|procedure",
      "clinicalRelevance": "critical|high|medium|low"
    }
  ],
  "redFlags": [
    {
      "pattern": "descripción del problema",
      "action": "acción requerida",
      "urgency": "critical|high|medium"
    }
  ],
  "yellowFlags": ["factores psicosociales o contextuales"],
  "evaluaciones_fisicas_sugeridas": [
    "Evaluación 1: descripción",
    "Evaluación 2: descripción"
  ],
  "compliance_issues": [
    {
      "type": "legal|ethical|professional",
      "description": "descripción",
      "severity": "critical|high|medium|low"
    }
  ]
}

REGLAS:
1. Detecta CUALQUIER patrón de riesgo médico o legal
2. Clasifica por severidad objetiva
3. Sugiere evaluaciones basadas en hallazgos
4. Identifica problemas de cumplimiento profesional
5. Arrays vacíos [] si no hay elementos
`;

console.log('Prompt genérico para backend:', GENERIC_PROMPT.length, 'caracteres');
