export class PromptFactory {
  static create(config: { transcript: string }): string {
    const { transcript } = config;
    
    // Detectar idioma
    const isEnglish = /\b(patient|years|old|pain|she|he|with|taking)\b/i.test(transcript);
    console.log('[PromptFactory] Language detected:', isEnglish ? 'English' : 'Spanish');
    
    if (isEnglish) {
      return `You are a physiotherapist. Analyze this case and respond with ONLY valid JSON.

TRANSCRIPT: "${transcript}"

Respond with EXACTLY this structure:
{
  "redFlags": ["Fall with injury", "Dizziness", "Confusion"],
  "entities": [
    {"id": "s1", "text": "Hip pain", "type": "symptom"},
    {"id": "m1", "text": "Lisinopril", "type": "medication"}
  ],
  "yellowFlags": ["Social isolation", "Depression"],
  "physicalTests": [
    {"name": "Timed Up and Go", "sensitivity": 0.87, "specificity": 0.87}
  ]
}`;
    } else {
      return `Eres fisioterapeuta. Analiza este caso y responde SOLO con JSON válido.

TRANSCRIPT: "${transcript}"

Responde con EXACTAMENTE esta estructura:
{
  "redFlags": ["Caída con lesión", "Mareos", "Confusión"],
  "entities": [
    {"id": "s1", "text": "Dolor de cadera", "type": "symptom"},
    {"id": "m1", "text": "Lisinopril", "type": "medication"}
  ],
  "yellowFlags": ["Aislamiento social", "Depresión"],
  "physicalTests": [
    {"name": "Levántate y Anda", "sensitivity": 0.87, "specificity": 0.87}
  ]
}`;
    }
  }
}

export default PromptFactory;
