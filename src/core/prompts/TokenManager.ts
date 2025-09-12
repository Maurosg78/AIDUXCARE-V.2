export class TokenManager {
  // Aproximación: 1 token ≈ 4 caracteres en inglés, 2-3 en español
  private static readonly CHARS_PER_TOKEN = 4;
  private static readonly MAX_TRANSCRIPT_TOKENS = 2000; // Dejar espacio para respuesta
  private static readonly MAX_PROMPT_TOKENS = 3000; // Límite seguro total
  
  /**
   * Procesa transcripciones largas dividiéndolas en segmentos
   */
  static processLongTranscript(transcript: string): {
    segments: string[];
    summary: string;
    criticalFindings: string[];
  } {
    const estimatedTokens = this.estimateTokens(transcript);
    
    if (estimatedTokens <= this.MAX_TRANSCRIPT_TOKENS) {
      // Transcripción corta, procesar completa
      return {
        segments: [transcript],
        summary: '',
        criticalFindings: []
      };
    }
    
    // Transcripción larga, necesita segmentación inteligente
    console.log(`⚠️ Transcripción larga: ~${estimatedTokens} tokens`);
    
    // 1. Extraer información crítica primero
    const criticalFindings = this.extractCriticalPhrases(transcript);
    
    // 2. Crear resumen de contexto
    const summary = this.createContextSummary(transcript);
    
    // 3. Dividir en segmentos manejables
    const segments = this.smartSegmentation(transcript);
    
    return { segments, summary, criticalFindings };
  }
  
  /**
   * Extrae frases críticas que SIEMPRE deben analizarse
   */
  private static extractCriticalPhrases(transcript: string): string[] {
    const criticalPatterns = [
      /doesn't see the point/gi,
      /suicid\w*/gi,
      /want to die/gi,
      /fallen\s+(twice|three|multiple)/gi,
      /chest pain/gi,
      /can't breathe/gi,
      /losing consciousness/gi,
      /severe pain/gi,
      /emergency/gi,
      /blood/gi,
      /fracture/gi,
      /confused about/gi,
      /can't remember/gi,
      /dizzy when standing/gi
    ];
    
    const findings: string[] = [];
    const sentences = transcript.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      criticalPatterns.forEach(pattern => {
        if (pattern.test(sentence)) {
          findings.push(sentence.trim());
        }
      });
    });
    
    return [...new Set(findings)]; // Eliminar duplicados
  }
  
  /**
   * Crea un resumen del contexto del paciente
   */
  private static createContextSummary(transcript: string): string {
    // Extraer información clave
    const age = transcript.match(/(\d{1,3})\s*years?\s*old/i)?.[1];
    const gender = transcript.match(/\b(he|she|male|female)\b/i)?.[0];
    const mainComplaint = transcript.split('.')[0]; // Primera oración suele tener queja principal
    
    const medications = this.extractMedications(transcript);
    const duration = transcript.match(/(\d+\s*(days?|weeks?|months?))/i)?.[0];
    
    let summary = `Patient`;
    if (age) summary += ` ${age}yo`;
    if (gender) summary += ` ${gender}`;
    summary += `. Main: ${mainComplaint.substring(0, 100)}`;
    if (duration) summary += `. Duration: ${duration}`;
    if (medications.length) summary += `. Meds: ${medications.join(', ')}`;
    
    return summary;
  }
  
  /**
   * Extrae medicamentos mencionados
   */
  private static extractMedications(transcript: string): string[] {
    const commonMeds = [
      'gabapentin', 'pregabalin', 'lyrica',
      'metformin', 'insulin',
      'lisinopril', 'amlodipine', 'atenolol',
      'zolpidem', 'alprazolam', 'diazepam',
      'ibuprofen', 'paracetamol', 'acetaminophen',
      'aspirin', 'warfarin',
      'omeprazole', 'pantoprazole'
    ];
    
    const found: string[] = [];
    const lowerTranscript = transcript.toLowerCase();
    
    commonMeds.forEach(med => {
      if (lowerTranscript.includes(med)) {
        found.push(med);
      }
    });
    
    return found;
  }
  
  /**
   * Divide la transcripción en segmentos inteligentes
   */
  private static smartSegmentation(transcript: string): string[] {
    const maxCharsPerSegment = this.MAX_TRANSCRIPT_TOKENS * this.CHARS_PER_TOKEN;
    const segments: string[] = [];
    
    // Dividir por párrafos primero
    const paragraphs = transcript.split(/\n\n+/);
    let currentSegment = '';
    
    paragraphs.forEach(para => {
      if ((currentSegment + para).length < maxCharsPerSegment) {
        currentSegment += para + '\n\n';
      } else {
        if (currentSegment) segments.push(currentSegment.trim());
        currentSegment = para + '\n\n';
      }
    });
    
    if (currentSegment) segments.push(currentSegment.trim());
    
    return segments;
  }
  
  /**
   * Estima tokens de un texto
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }
  
  /**
   * Genera prompt optimizado para tokens
   */
  static generateOptimizedPrompt(
    transcript: string,
    previousFindings?: any
  ): string {
    const processed = this.processLongTranscript(transcript);
    
    if (processed.segments.length === 1) {
      // Transcripción corta, prompt normal
      return this.standardPrompt(transcript);
    }
    
    // Transcripción larga, prompt condensado con contexto
    return this.condensedPrompt(processed, previousFindings);
  }
  
  private static standardPrompt(transcript: string): string {
    return `Physiotherapist assessment. Identify critical safety issues.

"${transcript}"

Return JSON with:
- redFlags: urgent medical conditions
- entities: medications and symptoms
- yellowFlags: psychosocial factors
- physicalTests: relevant tests with evidence`;
  }
  
  private static condensedPrompt(
    processed: any,
    previousFindings?: any
  ): string {
    let prompt = 'CRITICAL FINDINGS FROM LONG SESSION:\n\n';
    
    if (processed.summary) {
      prompt += `CONTEXT: ${processed.summary}\n\n`;
    }
    
    if (processed.criticalFindings.length > 0) {
      prompt += 'CRITICAL PHRASES FOUND:\n';
      processed.criticalFindings.forEach((finding, i) => {
        prompt += `${i + 1}. "${finding}"\n`;
      });
      prompt += '\n';
    }
    
    if (previousFindings) {
      prompt += `ALREADY IDENTIFIED: ${JSON.stringify(previousFindings)}\n\n`;
    }
    
    prompt += `CURRENT SEGMENT (${processed.segments.length} total):\n`;
    prompt += `"${processed.segments[0].substring(0, 3000)}"\n\n`;
    
    prompt += 'Focus on NEW critical findings. Return JSON format.';
    
    return prompt;
  }
}
