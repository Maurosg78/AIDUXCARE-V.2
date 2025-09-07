// En la línea donde define fullPrompt, cambiar a:
const fullPrompt = prompt || `Analiza esta consulta de fisioterapia:

${text}

IMPORTANTE: Devuelve un JSON con esta estructura EXACTA:
{
  "entities": [...],
  "redFlags": [...],
  "yellowFlags": [...],
  "evaluaciones_fisicas_sugeridas": [
    "Test específico 1",
    "Test específico 2",
    "Test específico 3"
  ]
}`;
