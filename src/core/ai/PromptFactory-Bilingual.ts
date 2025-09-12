/**
 * PromptFactory-Bilingual
 * 
 * Sistema inteligente de generación de prompts que:
 * 1. Detecta automáticamente el idioma del transcript
 * 2. Genera prompts en el idioma correcto
 * 3. Evita mezcla de idiomas en las respuestas
 * 
 * @author AiDuxCare Team
 * @version 2.0.0
 * @date 2024-09-10
 */

export class PromptFactory {
  /**
   * Crea un prompt basado en el idioma detectado del transcript
   * @param config - Configuración con transcript y idioma opcional
   * @returns Prompt formateado en el idioma correcto
   */
  static create(config: any): string {
    const { transcript } = config;
    const transcriptLang = this.detectLanguage(transcript);
    
    console.log(`[PromptFactory] Idioma detectado: ${transcriptLang}`);
    
    return transcriptLang === 'en' 
      ? this.createEnglishPrompt(transcript)
      : this.createSpanishPrompt(transcript);
  }
  
  /**
   * Detecta el idioma del transcript basándose en palabras clave
   * @param text - Texto a analizar
   * @returns 'en' para inglés, 'es' para español
   */
  static detectLanguage(text: string): 'en' | 'es' {
    const englishKeywords = ['patient', 'years old', 'pain', 'she', 'he', 'with', 'taking'];
    const spanishKeywords = ['paciente', 'años', 'dolor', 'ella', 'él', 'con', 'tomando'];
    
    const lowerText = text.toLowerCase();
    let englishCount = 0;
    let spanishCount = 0;
    
    englishKeywords.forEach(word => {
      if (lowerText.includes(word)) englishCount++;
    });
    
    spanishKeywords.forEach(word => {
      if (lowerText.includes(word)) spanishCount++;
    });
    
    return englishCount > spanishCount ? 'en' : 'es';
  }
  
  // Prompts en inglés y español...
  static createEnglishPrompt(transcript: string): string {
    // Implementación del prompt en inglés
    return `[Prompt en inglés...]`;
  }
  
  static createSpanishPrompt(transcript: string): string {
    // Implementación del prompt en español
    return `[Prompt en español...]`;
  }
}
