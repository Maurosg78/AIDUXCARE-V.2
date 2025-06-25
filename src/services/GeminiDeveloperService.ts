/**
 * Servicio para Gemini Developer API (Gratuita)
 * Reemplaza Vertex AI para usuarios con plan básico de Google Cloud
 */

import { GEMINI_CONFIG, MEDICAL_GEMINI_CONFIGS, validateGeminiConfig, GEMINI_RATE_LIMITS } from '../config/gemini-config';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface SOAPClassificationRequest {
  transcription: string;
  context?: string;
  speakerRoles?: { [key: string]: 'PATIENT' | 'THERAPIST' };
}

interface SOAPClassificationResponse {
  sections: {
    subjective: string[];
    objective: string[];
    assessment: string[];
    plan: string[];
  };
  confidence: number;
  reasoning: string;
  totalTokensUsed: number;
}

export class GeminiDeveloperService {
  private rateLimitTracker = {
    requestsThisMinute: 0,
    tokensThisMinute: 0,
    requestsToday: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: Date.now()
  };

  constructor() {
    if (!validateGeminiConfig()) {
      throw new Error('Configuración de Gemini inválida. Revisa la API key.');
    }
  }

  /**
   * Verificar y actualizar rate limits
   */
  private checkRateLimit(estimatedTokens: number = 1000): boolean {
    const now = Date.now();
    
    // Reset contadores por minuto
    if (now - this.rateLimitTracker.lastMinuteReset > 60000) {
      this.rateLimitTracker.requestsThisMinute = 0;
      this.rateLimitTracker.tokensThisMinute = 0;
      this.rateLimitTracker.lastMinuteReset = now;
    }
    
    // Reset contadores diarios
    if (now - this.rateLimitTracker.lastDayReset > 86400000) {
      this.rateLimitTracker.requestsToday = 0;
      this.rateLimitTracker.lastDayReset = now;
    }
    
    // Verificar límites
    if (this.rateLimitTracker.requestsThisMinute >= GEMINI_RATE_LIMITS.REQUESTS_PER_MINUTE) {
      throw new Error(`Rate limit excedido: ${GEMINI_RATE_LIMITS.REQUESTS_PER_MINUTE} requests/minuto`);
    }
    
    if (this.rateLimitTracker.tokensThisMinute + estimatedTokens > GEMINI_RATE_LIMITS.TOKENS_PER_MINUTE) {
      throw new Error(`Rate limit excedido: ${GEMINI_RATE_LIMITS.TOKENS_PER_MINUTE} tokens/minuto`);
    }
    
    if (this.rateLimitTracker.requestsToday >= GEMINI_RATE_LIMITS.REQUESTS_PER_DAY) {
      throw new Error(`Rate limit excedido: ${GEMINI_RATE_LIMITS.REQUESTS_PER_DAY} requests/día`);
    }
    
    return true;
  }

  /**
   * Realizar petición a Gemini Developer API
   */
  private async makeGeminiRequest(
    prompt: string, 
    config: typeof GEMINI_CONFIG = GEMINI_CONFIG
  ): Promise<GeminiResponse> {
    // Estimar tokens (aproximadamente 4 caracteres por token)
    const estimatedTokens = Math.ceil(prompt.length / 4) + config.maxTokens;
    
    this.checkRateLimit(estimatedTokens);
    
    const request: GeminiRequest = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topK: 40,
        topP: 0.95
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;
    
    try {
      console.log(`LAUNCH: Llamada a Gemini ${config.model}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      
      // Actualizar contadores de rate limit
      this.rateLimitTracker.requestsThisMinute++;
      this.rateLimitTracker.requestsToday++;
      this.rateLimitTracker.tokensThisMinute += data.usageMetadata.totalTokenCount;
      
      console.log(`SUCCESS: Respuesta recibida. Tokens usados: ${data.usageMetadata.totalTokenCount}`);
      
      return data;
      
    } catch (error) {
      console.error('ERROR: Fallo en llamada a Gemini API:', error);
      throw error;
    }
  }

  /**
   * Clasificar transcripción médica en formato SOAP
   */
  async classifySOAP(request: SOAPClassificationRequest): Promise<SOAPClassificationResponse> {
    const prompt = `
Eres un asistente médico especializado en clasificación SOAP. Tu tarea es analizar la siguiente transcripción médica y organizarla en las secciones SOAP apropiadas.

TRANSCRIPCIÓN:
${request.transcription}

${request.context ? `CONTEXTO ADICIONAL: ${request.context}` : ''}

INSTRUCCIONES:
1. Clasifica cada segmento de la transcripción en una de estas categorías:
   - SUBJECTIVE (S): Síntomas reportados por el paciente, historia clínica, quejas
   - OBJECTIVE (O): Observaciones del terapeuta, examen físico, mediciones
   - ASSESSMENT (A): Diagnóstico, evaluación clínica, interpretación
   - PLAN (P): Tratamiento propuesto, recomendaciones, seguimiento

2. Si un segmento no encaja claramente, usa tu mejor criterio médico
3. Mantén el texto original tanto como sea posible
4. Proporciona una puntuación de confianza (0-100)

FORMATO DE RESPUESTA (JSON):
{
  "sections": {
    "subjective": ["texto1", "texto2"],
    "objective": ["texto1", "texto2"], 
    "assessment": ["texto1", "texto2"],
    "plan": ["texto1", "texto2"]
  },
  "confidence": 85,
  "reasoning": "Explicación breve del razonamiento de clasificación"
}

Responde SOLO con el JSON, sin texto adicional.
`;

    try {
      const response = await this.makeGeminiRequest(prompt, MEDICAL_GEMINI_CONFIGS.SOAP_CLASSIFICATION);
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No se recibió respuesta válida de Gemini');
      }

      const responseText = response.candidates[0].content.parts[0].text;
      
      // Intentar parsear JSON
      try {
        const parsed = JSON.parse(responseText);
        return {
          ...parsed,
          totalTokensUsed: response.usageMetadata.totalTokenCount
        };
      } catch (parseError) {
        console.error('ERROR: No se pudo parsear respuesta JSON:', responseText);
        
        // Fallback: respuesta estructurada básica
        return {
          sections: {
            subjective: [request.transcription],
            objective: [],
            assessment: [],
            plan: []
          },
          confidence: 50,
          reasoning: 'Clasificación automática fallida, se asignó todo a Subjective',
          totalTokensUsed: response.usageMetadata.totalTokenCount
        };
      }
      
    } catch (error) {
      console.error('ERROR: Fallo en clasificación SOAP:', error);
      throw error;
    }
  }

  /**
   * Mejorar calidad de transcripción
   */
  async enhanceTranscription(rawTranscription: string): Promise<string> {
    const prompt = `
Eres un asistente médico especializado en corrección de transcripciones. Tu tarea es mejorar la siguiente transcripción médica manteniendo el significado original pero corrigiendo errores comunes.

TRANSCRIPCIÓN ORIGINAL:
${rawTranscription}

INSTRUCCIONES:
1. Corrige errores de ortografía y gramática
2. Mejora la puntuación para mayor claridad
3. Mantén toda la terminología médica original
4. NO añadas información que no esté en el texto original
5. NO cambies el significado de las frases
6. Mantén el estilo conversacional si es apropiado

Responde SOLO con la transcripción mejorada, sin comentarios adicionales.
`;

    try {
      const response = await this.makeGeminiRequest(prompt, MEDICAL_GEMINI_CONFIGS.TRANSCRIPTION_ENHANCEMENT);
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No se recibió respuesta válida de Gemini');
      }

      return response.candidates[0].content.parts[0].text.trim();
      
    } catch (error) {
      console.error('ERROR: Fallo en mejora de transcripción:', error);
      // Fallback: devolver transcripción original
      return rawTranscription;
    }
  }

  /**
   * Obtener estadísticas de uso
   */
  getUsageStats() {
    return {
      requestsThisMinute: this.rateLimitTracker.requestsThisMinute,
      tokensThisMinute: this.rateLimitTracker.tokensThisMinute,
      requestsToday: this.rateLimitTracker.requestsToday,
      limits: GEMINI_RATE_LIMITS,
      remainingRequestsToday: GEMINI_RATE_LIMITS.REQUESTS_PER_DAY - this.rateLimitTracker.requestsToday
    };
  }

  /**
   * Test de conectividad
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeGeminiRequest(
        "Responde con 'OK' si puedes procesar esta petición.",
        { ...GEMINI_CONFIG, maxTokens: 10 }
      );
      
      return response.candidates?.[0]?.content?.parts?.[0]?.text?.includes('OK') || false;
      
    } catch (error) {
      console.error('ERROR: Test de conexión fallido:', error);
      return false;
    }
  }
}

// Instancia singleton
export const geminiService = new GeminiDeveloperService(); 