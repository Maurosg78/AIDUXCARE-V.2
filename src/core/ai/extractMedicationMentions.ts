const MEDICATION_EXTRACTION_PROMPT = `List all medications mentioned in this conversation.
Include specific medication names, both brand and generic, exactly as the patient said them.
Include dose and frequency if mentioned.
Return JSON: {"medications": [{"original_text": "...", "dose": "...", "frequency": "..."}]}

RULES:
- original_text: exactly as the patient said it (e.g., "Janumet 50/1000", "something for anxiety")
- dose: as mentioned, empty string if not mentioned
- frequency: as mentioned, empty string if not mentioned
- Include ALL mentions, even vague ones ("something for diabetes", "the white pill")
- If no medications mentioned, return {"medications": []}
- Return ONLY valid JSON, no extra text`;

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
