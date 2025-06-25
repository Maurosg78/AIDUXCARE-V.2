/**
 * Variables de entorno para AiDuxCare V.2
 * Centraliza todas las configuraciones del sistema
 */

// Función auxiliar para obtener variables de entorno
function getEnvVar(key: string, defaultValue: string = ''): string {
  // En navegador (Vite)
  if (typeof window !== 'undefined' && import.meta?.env) {
    return import.meta.env[key] || defaultValue;
  }
  
  // En Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
}

// Variables de Supabase
export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Variables de APIs de IA
export const OPENAI_API_KEY = getEnvVar('VITE_OPENAI_API_KEY');
export const HUGGINGFACE_API_KEY = getEnvVar('VITE_HUGGINGFACE_API_KEY');

// Variables de Google Cloud AI (Configuración principal)
export const GOOGLE_CLOUD_PROJECT_ID = getEnvVar('VITE_GOOGLE_CLOUD_PROJECT_ID');
export const GOOGLE_CLOUD_LOCATION = getEnvVar('VITE_GOOGLE_CLOUD_LOCATION', 'us-central1');
export const GOOGLE_CLOUD_CREDENTIALS = getEnvVar('VITE_GOOGLE_CLOUD_CREDENTIALS');

// Variables de entorno de la aplicación
export const APP_ENVIRONMENT = getEnvVar('VITE_APP_ENVIRONMENT', 'development');

// Configuración de Google Cloud AI
const GOOGLE_CLOUD_DEFAULT_MODEL = 'gemini-1.5-pro';

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
    google: {
      projectId: GOOGLE_CLOUD_PROJECT_ID,
      location: GOOGLE_CLOUD_LOCATION,
      credentials: GOOGLE_CLOUD_CREDENTIALS,
      model: GOOGLE_CLOUD_DEFAULT_MODEL
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
    { key: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { key: 'VITE_GOOGLE_CLOUD_PROJECT_ID', value: GOOGLE_CLOUD_PROJECT_ID },
    { key: 'VITE_GOOGLE_CLOUD_CREDENTIALS', value: GOOGLE_CLOUD_CREDENTIALS }
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
if (typeof window !== 'undefined' && ENV_CONFIG.app.isDevelopment) {
  console.log('WARNING: Información de configuración (solo visible en desarrollo):');
  console.log(`- SUPABASE_URL: ${SUPABASE_URL ? 'OK SUCCESS:' : 'MISSING ERROR:'}`);
  console.log(`- SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? 'OK SUCCESS:' : 'MISSING ERROR:'}`);
  console.log(`- GOOGLE_CLOUD_PROJECT_ID: ${GOOGLE_CLOUD_PROJECT_ID ? 'OK SUCCESS:' : 'MISSING ERROR:'}`);
  console.log(`- GOOGLE_CLOUD_CREDENTIALS: ${GOOGLE_CLOUD_CREDENTIALS ? 'OK SUCCESS:' : 'MISSING ERROR:'}`);
  
  // Intentar validar la URL
  if (SUPABASE_URL) {
    try {
      new URL(SUPABASE_URL);
      console.log('- URL format: VALID SUCCESS:');
    } catch (e) {
      console.error('- URL format: INVALID ERROR: - La URL de Supabase no es válida');
    }
  }
}

export default ENV_CONFIG;
