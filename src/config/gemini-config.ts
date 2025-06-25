/**
 * Configuración para Gemini Developer API (Gratuita)
 * Alternativa a Vertex AI para planes básicos de Google Cloud
 */

export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export const GEMINI_CONFIG: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-2.5-flash', // Modelo más rápido y eficiente
  maxTokens: 8192,
  temperature: 0.7
};

// Configuración para diferentes casos de uso médicos
export const MEDICAL_GEMINI_CONFIGS = {
  SOAP_CLASSIFICATION: {
    ...GEMINI_CONFIG,
    model: 'gemini-2.5-flash',
    temperature: 0.3, // Más determinístico para clasificación
    maxTokens: 4096
  },
  
  CLINICAL_ANALYSIS: {
    ...GEMINI_CONFIG,
    model: 'gemini-2.5-pro', // Modelo más potente para análisis complejo
    temperature: 0.5,
    maxTokens: 8192
  },
  
  TRANSCRIPTION_ENHANCEMENT: {
    ...GEMINI_CONFIG,
    model: 'gemini-2.5-flash',
    temperature: 0.2, // Muy determinístico para corrección de texto
    maxTokens: 2048
  }
};

// Verificar configuración
export function validateGeminiConfig(): boolean {
  if (!GEMINI_CONFIG.apiKey) {
    console.error('ERROR: GEMINI_API_KEY no configurada');
    console.log('INSTRUCCIONES:');
    console.log('1. Visita https://aistudio.google.com/apikey');
    console.log('2. Crea una API key gratuita');
    console.log('3. Configura: export VITE_GEMINI_API_KEY=tu_api_key');
    return false;
  }
  
  console.log('SUCCESS: Configuración Gemini válida');
  console.log(`Modelo: ${GEMINI_CONFIG.model}`);
  console.log(`Base URL: ${GEMINI_CONFIG.baseUrl}`);
  return true;
}

// Rate limits gratuitos de Gemini Developer API
export const GEMINI_RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 15,
  TOKENS_PER_MINUTE: 32000,
  REQUESTS_PER_DAY: 1500
}; 