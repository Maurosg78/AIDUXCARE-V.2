/**
 * Variables de entorno para AiDuxCare V.2
 * Centraliza todas las configuraciones del sistema
 */

// Supabase
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Firebase
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Vertex AI configuration
export const VERTEX_AI_URL = import.meta.env.VITE_VERTEX_AI_URL || '';
export const VERTEX_AI_API_KEY = import.meta.env.VITE_VERTEX_AI_API_KEY || '';
export const VERTEX_AI_REGION = import.meta.env.VITE_VERTEX_AI_REGION || 'us-central1';
export const VERTEX_AI_FUNCTION = import.meta.env.VITE_VERTEX_AI_FUNCTION || 'vertexAIProxy';

// Whisper (OpenAI) configuration
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
export const WHISPER_MODEL = import.meta.env.VITE_WHISPER_MODEL || 'whisper-1';

// App environment
export const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || 'development';

/**
 * Configuración completa del entorno
 */
export const ENV_CONFIG = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  },
  firebase: FIREBASE_CONFIG,
  ai: {
    vertex: {
      url: VERTEX_AI_URL,
      apiKey: VERTEX_AI_API_KEY,
      region: VERTEX_AI_REGION,
      functionName: VERTEX_AI_FUNCTION
    },
    whisper: {
      apiKey: OPENAI_API_KEY,
      model: WHISPER_MODEL
    }
  },
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
    { key: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { key: 'VITE_FIREBASE_API_KEY', value: FIREBASE_CONFIG.apiKey },
    { key: 'VITE_FIREBASE_AUTH_DOMAIN', value: FIREBASE_CONFIG.authDomain },
    { key: 'VITE_FIREBASE_PROJECT_ID', value: FIREBASE_CONFIG.projectId },
    { key: 'VITE_VERTEX_AI_URL', value: VERTEX_AI_URL },
    { key: 'VITE_VERTEX_AI_API_KEY', value: VERTEX_AI_API_KEY },
    { key: 'VITE_OPENAI_API_KEY', value: OPENAI_API_KEY }
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
  console.log(`- FIREBASE_PROJECT_ID: ${FIREBASE_CONFIG.projectId ? 'OK ✅' : 'MISSING ❌'}`);
  console.log(`- VERTEX_AI_URL: ${VERTEX_AI_URL ? 'OK ✅' : 'MISSING ❌'}`);
  console.log(`- VERTEX_AI_API_KEY: ${VERTEX_AI_API_KEY ? 'OK ✅' : 'MISSING ❌'}`);
  console.log(`- WHISPER_MODEL: ${WHISPER_MODEL}`);

  if (SUPABASE_URL) {
    try {
      new URL(SUPABASE_URL);
      console.log('- SUPABASE_URL format: VALID ✅');
    } catch (_e) {
      console.error('- SUPABASE_URL format: INVALID ❌');
    }
  }
}

export default ENV_CONFIG;
