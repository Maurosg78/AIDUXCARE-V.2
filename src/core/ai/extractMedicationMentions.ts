const MEDICATION_EXTRACTION_PROMPT = `
Eres un extractor clínico especializado. Tu única tarea es identificar todos los medicamentos mencionados en la conversación.

Extrae TODO lo que el paciente mencione como medicación, incluyendo:
- Nombres comerciales exactos con dosis ("Janumet 50/1000", "Voltaren")
- Descripciones genéricas ("pastillas para la diabetes", "algo para la ansiedad")
- Medicamentos suspendidos o con intolerancia ("antiinflamatorios que me hicieron daño")
- Inyecciones, infiltraciones, suplementos mencionados de pasada

REGLAS:
- original_text: exactamente como lo dijo el paciente, sin modificar.
- dose: dosis mencionada, cadena vacía si no se mencionó.
- frequency: frecuencia mencionada, cadena vacía si no se mencionó.
- Si no se menciona ningún medicamento, devuelve array vacío.
- NO inventes ni infieras medicación no mencionada explícitamente.

Devuelve SOLO un JSON válido con este formato exacto:
{"medications": [{"original_text": "nombre exacto", "dose": "dosis", "frequency": "frecuencia"}]}
`;

export type MedicationMention = {
  original_text: string;
  dose: string;
  frequency: string;
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
    items.push({
      original_text: originalText,
      dose: String(record.dose || '').trim(),
      frequency: String(record.frequency || '').trim(),
    });
  }
  return items;
};

export const extractMedicationMentions = async (
  transcript: string,
  callVertex: (prompt: string) => Promise<string>
): Promise<MedicationMention[]> => {
  const prompt = `${MEDICATION_EXTRACTION_PROMPT}\n\nConversation:\n${transcript}`;
  const raw = await callVertex(prompt);
  const jsonText = extractJsonObject(raw);
  const parsed = JSON.parse(jsonText) as MedicationExtractionResponse;
  return toMedicationArray(parsed.medications);
};
