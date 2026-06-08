const MEDICATION_EXTRACTION_PROMPT = `
Eres un extractor clínico especializado. Tu única tarea es identificar los medicamentos que el paciente USA o HA USADO.

INCLUYE:
- Medicamentos que el paciente toma actualmente ("tomo Voltaren", "me pongo crema")
- Medicamentos que tomó en el pasado o suspendió ("tomaba antiinflamatorios pero me hicieron daño")
- Descripciones genéricas de medicación propia ("unas pastillas para la diabetes", "algo para la ansiedad")
- Suplementos que el paciente menciona tomar

EXCLUYE SIEMPRE:
- Tratamientos o procedimientos que el médico está CONSIDERANDO o PLANIFICANDO para el futuro ("van a infiltrarle", "el médico considera", "podría recetarle", "está pensando en")
- Cualquier cosa que aún no ha ocurrido
- Diagnósticos, pruebas o evaluaciones físicas
- Partes del cuerpo, síntomas o condiciones

CRITERIO CLAVE: ¿El paciente lo está tomando o lo tomó? → incluir. ¿Es una propuesta del médico para el futuro? → excluir.

REGLAS DE FORMATO:
- original_text: exactamente como lo dijo el paciente, sin modificar.
- dose: dosis mencionada, cadena vacía si no se mencionó.
- frequency: frecuencia mencionada, cadena vacía si no se mencionó.
- Si no hay medicación real del paciente, devuelve array vacío.
- NO inventes ni infieras medicación no mencionada explícitamente.

CORRECCIÓN ORTOGRÁFICA (solo cuando sea evidente):
Si original_text parece un error fonético de transcripción de un medicamento conocido
(ej. "llanumet" → "Janumet 50/1000", "omeprazon" → "omeprazol", "orfidal" → "Orfidal"),
añade "suggested_name" con el nombre correcto.
Requisito: similitud fonética alta Y el contexto clínico confirma ese medicamento.
Si hay cualquier duda, omite "suggested_name" completamente.

Devuelve SOLO un JSON válido con este formato exacto:
{"medications": [{"original_text": "nombre exacto", "dose": "dosis", "frequency": "frecuencia", "suggested_name": ""}]}
`;

export type MedicationMention = {
  original_text: string;
  dose: string;
  frequency: string;
  suggested_name?: string;
};

type MedicationExtractionResponse = {
  medications?: unknown;
};

const extractJsonObject = (raw: string): string => {
  const trimmed = raw.trim();
  const withoutJsonFence = trimmed.replace(/^```json\s*/i, '');
  const withoutFenceStart = withoutJsonFence.replace(/^```\s*/i, '');
  const withoutFenceEnd = withoutFenceStart.replace(/```$/i, '');
  const withoutFence = withoutFenceEnd.trim();
  const firstBraceIndex = withoutFence.indexOf('{');
  const lastBraceIndex = withoutFence.lastIndexOf('}');

  if (firstBraceIndex < 0 || lastBraceIndex <= firstBraceIndex) {
    return withoutFence;
  }

  return withoutFence.slice(firstBraceIndex, lastBraceIndex + 1);
};

const toMedicationArray = (value: unknown): MedicationMention[] => {
  if (!Array.isArray(value)) return [];

  const items: MedicationMention[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const originalText = String(record.original_text || '').trim();
    if (!originalText) continue;
    const suggestedName = String(record.suggested_name || '').trim();
    items.push({
      original_text: originalText,
      dose: String(record.dose || '').trim(),
      frequency: String(record.frequency || '').trim(),
      ...(suggestedName ? { suggested_name: suggestedName } : {}),
    });
  }
  return items;
};

export const extractMedicationMentions = async (
  transcript: string,
  callVertex: (prompt: string) => Promise<string>
): Promise<MedicationMention[]> => {
  const prompt = `${MEDICATION_EXTRACTION_PROMPT}\n\nConversación:\n${transcript}`;
  const raw = await callVertex(prompt);
  console.log('[MedicationMentions] Raw response preview:', raw?.slice(0, 300));
  const jsonText = extractJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText) as MedicationExtractionResponse;
    const result = toMedicationArray(parsed.medications);
    console.log('[MedicationMentions] Parsed medications:', result.length, result);
    return result;
  } catch (e) {
    console.error('[MedicationMentions] JSON.parse failed. jsonText:', jsonText?.slice(0, 300), 'error:', e);
    throw e;
  }
};
