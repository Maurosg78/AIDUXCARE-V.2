const MEDICAL_HISTORY_EXTRACTION_PROMPT = `
Eres un extractor clínico especializado. Tu única tarea es identificar antecedentes médicos mayores mencionados en la conversación.

Extrae SOLO condiciones sistémicas relevantes mencionadas por el paciente, aunque no sean el motivo de consulta:
- Enfermedades cardiovasculares (infartos, stents, capacidad cardíaca reducida)
- Condiciones neurológicas, oncológicas, metabólicas
- Cirugías mayores previas
- Tabaquismo activo o pasivo
- Anticoagulación o antiagregación
- Cualquier comorbilidad que pueda afectar la seguridad del tratamiento fisioterapéutico

REGLAS:
- Cita exactamente lo que dijo el paciente, no lo que el modelo infiere.
- Si el paciente dijo "tuve dos infartos en 2003 y 2020", escribe "Infarto agudo de miocardio x2 (2003 y 2020, referido por el paciente)".
- Si no hay antecedentes mencionados, devuelve array vacío.
- NO incluyas medicación en este campo — solo condiciones y antecedentes.
- NO inventes ni infieras condiciones no mencionadas.

Devuelve SOLO un JSON válido con este formato exacto:
{"major_medical_history": ["antecedente 1", "antecedente 2"]}
`;
const extractJsonObject = (raw) => {
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
    const jsonObject = withoutFence.slice(firstBraceIndex, lastBraceIndex + 1);
    return jsonObject;
};
const toStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    const items = [];
    for (const item of value) {
        const text = String(item);
        const trimmed = text.trim();
        if (trimmed.length > 0) {
            items.push(trimmed);
        }
    }
    return items;
};
export const extractMajorMedicalHistory = async (transcript, callVertex) => {
    const prompt = `${MEDICAL_HISTORY_EXTRACTION_PROMPT}\n\nTranscripción:\n${transcript}`;
    const raw = await callVertex(prompt);
    const jsonText = extractJsonObject(raw);
    const parsed = JSON.parse(jsonText);
    const majorMedicalHistory = toStringArray(parsed.major_medical_history);
    return majorMedicalHistory;
};
