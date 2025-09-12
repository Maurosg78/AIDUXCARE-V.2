export class ControlledReasoningSystem {
  // Configuración de límites
  private static readonly CONFIG = {
    MAX_INPUT_TOKENS: 1500,    // Límite para el transcript
    MAX_OUTPUT_TOKENS: 1000,   // Espacio para respuesta
    MAX_TOTAL_TOKENS: 3000,    // Total permitido
    CRITICAL_PATTERNS: [
      /doesn't see the point/i,
      /suicid/i,
      /fall/i,
      /confus/i,
      /dizz/i
    ]
  };

  /**
   * Genera prompt que permite razonamiento pero con límites claros
   */
  static generateControlledPrompt(transcript: string): string {
    // Truncar si es necesario pero preservando información crítica
    const processedTranscript = this.preserveCriticalInfo(transcript);
    
    // Prompt que pide razonamiento pero con formato controlado
    return `You are a physiotherapist. Analyze this patient encounter.

PATIENT ENCOUNTER:
"${processedTranscript}"

INSTRUCTIONS:
1. Think step-by-step about safety risks
2. Identify what could harm this patient
3. Explain your clinical reasoning briefly
4. Be concise but thorough

REQUIRED OUTPUT FORMAT:
{
  "reasoning": "Your clinical thinking in 2-3 sentences",
  "redFlags": ["critical conditions with brief explanation"],
  "entities": [{"type": "medication/symptom", "name": "...", "significance": "why it matters"}],
  "yellowFlags": ["psychosocial factors"],
  "physicalTests": [{"name": "test", "rationale": "why needed", "sensitivity": 0.X, "specificity": 0.X}]
}

Focus on patient safety. Keep responses concise.`;
  }

  /**
   * Preserva información crítica incluso al truncar
   */
  private static preserveCriticalInfo(transcript: string): string {
    const maxChars = this.CONFIG.MAX_INPUT_TOKENS * 4; // ~4 chars per token
    
    if (transcript.length <= maxChars) {
      return transcript;
    }
    
    // Extraer oraciones con información crítica
    const sentences = transcript.split(/[.!?]+/);
    const critical: string[] = [];
    const normal: string[] = [];
    
    sentences.forEach(sentence => {
      const isCritical = this.CONFIG.CRITICAL_PATTERNS.some(pattern => 
        pattern.test(sentence)
      );
      
      if (isCritical) {
        critical.push(sentence.trim());
      } else {
        normal.push(sentence.trim());
      }
    });
    
    // Construir transcript preservando lo crítico
    let result = critical.join('. ') + '. ';
    let remainingChars = maxChars - result.length;
    
    // Agregar contexto normal hasta llenar el límite
    for (const sentence of normal) {
      if (sentence.length < remainingChars) {
        result += sentence + '. ';
        remainingChars -= sentence.length + 2;
      } else {
        break;
      }
    }
    
    return result.trim();
  }

  /**
   * Valida que la respuesta tenga razonamiento real
   */
  static validateReasoning(response: any): {
    hasReasoning: boolean;
    quality: 'good' | 'basic' | 'poor';
    feedback: string;
  } {
    if (!response.reasoning || response.reasoning.length < 20) {
      return {
        hasReasoning: false,
        quality: 'poor',
        feedback: 'No clinical reasoning provided'
      };
    }
    
    // Verificar que el razonamiento conecte con los hallazgos
    const reasoning = response.reasoning.toLowerCase();
    const mentionsRisk = /risk|danger|concern|critical|urgent/i.test(reasoning);
    const explainsClinically = /because|due to|indicates|suggests|could lead/i.test(reasoning);
    
    if (mentionsRisk && explainsClinically) {
      return {
        hasReasoning: true,
        quality: 'good',
        feedback: 'Good clinical reasoning provided'
      };
    } else if (mentionsRisk || explainsClinically) {
      return {
        hasReasoning: true,
        quality: 'basic',
        feedback: 'Basic reasoning, could be more thorough'
      };
    }
    
    return {
      hasReasoning: true,
      quality: 'poor',
      feedback: 'Reasoning lacks clinical depth'
    };
  }
}
