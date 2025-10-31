/**
 * AiDuxCare — DeIdentificationService
 * Work Order: WO-2024-002
 * Scope: Replace identifiable terms (PHIPA/PIPEDA minimal compliance)
 */

const NAME_PATTERN = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g;
const DATE_PATTERN = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
const LOCATION_PATTERN = /\b(Toronto|Niagara|Hamilton|Ontario|Canada)\b/gi;
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const ID_PATTERN = /\b[A-Z0-9]{6,}\b/g;

/**
 * De-identifies sensitive info in <50ms
 */
export async function deIdentifyText(text: string): Promise<string> {
  if (!text) return "";
  return text
    .replace(NAME_PATTERN, "[PACIENTE]")
    .replace(DATE_PATTERN, "[FECHA]")
    .replace(LOCATION_PATTERN, "[UBICACIÓN]")
    .replace(PHONE_PATTERN, "[IDENTIFICADOR]")
    .replace(ID_PATTERN, "[IDENTIFICADOR]");
}
