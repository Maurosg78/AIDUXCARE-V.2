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

// Variables de entorno de la aplicación
export const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || 'development';

// Configuración de Ollama (local)
const OLLAMA_DEFAULT_URL = 'http://localhost:11434';
const OLLAMA_DEFAULT_MODEL = 'llama3.2:3b';

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
    ollama: {
      url: OLLAMA_DEFAULT_URL,
      model: OLLAMA_DEFAULT_MODEL
    }
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
  
  // Intentar validar la URL
  if (SUPABASE_URL) {
    try {
      new URL(SUPABASE_URL);
      console.log('- URL format: VALID ✅');
    } catch (e) {
      console.error('- URL format: INVALID ❌ - La URL de Supabase no es válida');
    }
  }
}

export default ENV_CONFIG;
