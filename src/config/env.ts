import logger from '@/shared/utils/logger';
/**
 * Variables de entorno para AiDuxCare V.2
 * Centraliza todas las configuraciones del sistema
 */

// Variables de Supabase
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Variables de APIs de IA
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
export const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
export const WHISPER_MODEL = import.meta.env.VITE_WHISPER_MODEL || 'gpt-4o-mini-transcribe';
export const OPENAI_TRANSCRIPT_URL = import.meta.env.VITE_OPENAI_TRANSCRIPT_URL || 'https://api.openai.com/v1/audio/transcriptions';

// Variables de entorno de la aplicación
export const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || 'development';

// ✅ REMOVED: Ollama configuration (not in use)
// Service in use: Google Vertex AI via Firebase Functions (northamerica-northeast1, Canada)

// Configuración del AiDux Assistant
// ✅ Using Vertex AI as primary service (Canadian region)
export const AIDUX_ASSISTANT_PROVIDER = import.meta.env.VITE_AIDUX_ASSISTANT_PROVIDER || 'vertex-ai';
export const AIDUX_ASSISTANT_BASE_URL = import.meta.env.VITE_AIDUX_ASSISTANT_BASE_URL || 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
export const AIDUX_ASSISTANT_MODEL = import.meta.env.VITE_AIDUX_ASSISTANT_MODEL || 'gemini-2.5-flash';
export const AIDUX_ASSISTANT_TIMEOUT = parseInt(import.meta.env.VITE_AIDUX_ASSISTANT_TIMEOUT || '30000'); // 30 segundos

/**
 * Configuración completa del entorno
 */
export const ENV_CONFIG = {
  // Base de datos
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  },
  
  // APIs de IA
  ai: {
    openai: {
      apiKey: OPENAI_API_KEY
    },
    huggingface: {
      apiKey: HUGGINGFACE_API_KEY
    },
    // ✅ REMOVED: Ollama (not in use)
    // Primary AI service: Vertex AI (Google Cloud, Canadian region)
    vertexAI: {
      region: 'northamerica-northeast1',
      model: 'gemini-2.5-flash',
      endpoint: 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy'
    }
  },

  // AiDux Assistant
  assistant: {
    provider: AIDUX_ASSISTANT_PROVIDER,
    baseUrl: AIDUX_ASSISTANT_BASE_URL,
    model: AIDUX_ASSISTANT_MODEL,
    timeout: AIDUX_ASSISTANT_TIMEOUT,
    isLocal: false, // ✅ Always cloud-based (Vertex AI)
    isCloud: true, // ✅ Using Vertex AI in Canadian region
    region: 'northamerica-northeast1' // ✅ Canada (Montreal)
  },
  
  // Configuración de la aplicación
  app: {
    environment: APP_ENVIRONMENT,
    isDevelopment: APP_ENVIRONMENT === 'development',
    isProduction: APP_ENVIRONMENT === 'production'
  }
};

/**
 * Validar que las variables de entorno críticas estén configuradas
 */
export function validateEnvironment(): {
  isValid: boolean;
  missingVars: string[];
} {
  const required = [
    { key: 'VITE_SUPABASE_URL', value: SUPABASE_URL },
    { key: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY }
  ];

  const missing = required
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  return {
    isValid: missing.length === 0,
    missingVars: missing
  };
}

// Log de diagnóstico en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('⚠️ Información de configuración (solo visible en desarrollo):');
  console.log(`- SUPABASE_URL: ${SUPABASE_URL ? 'OK ✅' : 'MISSING ❌'}`);
  console.log(`- SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? 'OK ✅' : 'MISSING ❌'}`);
  
  // Configuración del Assistant
  console.log(`- AIDUX_ASSISTANT_PROVIDER: ${AIDUX_ASSISTANT_PROVIDER}`);
  console.log(`- AIDUX_ASSISTANT_BASE_URL: ${AIDUX_ASSISTANT_BASE_URL}`);
  console.log(`- AIDUX_ASSISTANT_MODEL: ${AIDUX_ASSISTANT_MODEL}`);
  console.log(`- AIDUX_ASSISTANT_TIMEOUT: ${AIDUX_ASSISTANT_TIMEOUT}ms`);
  
  // Intentar validar la URL
  if (SUPABASE_URL) {
    try {
      new URL(SUPABASE_URL);
      console.log('- URL format: VALID ✅');
    } catch (_e) {
      console.error('- URL format: INVALID ❌ - La URL de Supabase no es válida');
    }
  }
}

export default ENV_CONFIG;
