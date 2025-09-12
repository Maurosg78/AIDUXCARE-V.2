/**
 * Sistema Bilingüe Integral AiDuxCare
 */

export class BilingualSystem {
  
  static detectTranscriptLanguage(text: string): 'en' | 'es' {
    const englishScore = (text.match(/\b(patient|years|old|pain|taking|with|from|she|he|they)\b/gi) || []).length;
    const spanishScore = (text.match(/\b(paciente|años|dolor|tomando|con|desde|ella|él)\b/gi) || []).length;
    return englishScore > spanishScore ? 'en' : 'es';
  }
  
  static generatePrompt(transcript: string): string {
    const lang = this.detectTranscriptLanguage(transcript);
    
    if (lang === 'en') {
      return `You are a physiotherapist analyzing a clinical case.
RESPOND ONLY IN ENGLISH with valid JSON.

Categorize correctly:
- RED FLAGS: Only serious medical emergencies
- SYMPTOMS: Physical complaints only
- YELLOW FLAGS: Psychosocial factors only
- MEDICATIONS: Drug names only

TRANSCRIPT: "${transcript}"

{
  "red_flags": [],
  "symptoms": [],
  "yellow_flags": [],
  "medications": [],
  "physical_tests": []
}`;
    }
    
    return `Eres un fisioterapeuta analizando un caso clínico.
RESPONDE SOLO EN ESPAÑOL con JSON válido.

Categoriza correctamente:
- RED FLAGS: Solo emergencias médicas
- SÍNTOMAS: Solo quejas físicas
- YELLOW FLAGS: Solo factores psicosociales
- MEDICAMENTOS: Solo nombres de fármacos

TRANSCRIPT: "${transcript}"

{
  "red_flags": [],
  "symptoms": [],
  "yellow_flags": [],
  "medications": [],
  "physical_tests": []
}`;
  }
  
  static processAIResponse(response: any, uiLanguage: 'en' | 'es'): any {
    return {
      redFlags: this.removeDuplicates(response.red_flags || []),
      symptoms: this.removeDuplicates(response.symptoms || []),
      yellowFlags: this.removeDuplicates(response.yellow_flags || []),
      medications: this.removeDuplicates(response.medications || []),
      physicalTests: response.physical_tests || []
    };
  }
  
  static removeDuplicates(items: string[]): string[] {
    return [...new Set(items)];
  }
}
