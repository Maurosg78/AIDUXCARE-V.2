// Archivo de configuración para variables de entorno

// Detectar si estamos en un entorno browser o Node.js
const isBrowser = typeof window !== 'undefined';

// Función para obtener variables de entorno de manera segura
function getEnvVar(key: string): string {
  if (isBrowser) {
    // En el navegador, usar import.meta.env (Vite)
    return (import.meta.env && import.meta.env[key]) || '';
  } else {
    // En Node.js, usar process.env
    return process.env[key] || '';
  }
}

// Supabase
export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Langfuse
export const LANGFUSE_PUBLIC_KEY = getEnvVar('VITE_LANGFUSE_PUBLIC_KEY');
export const LANGFUSE_SECRET_KEY = getEnvVar('VITE_LANGFUSE_SECRET_KEY');

// Verificar configuración
export const isConfigValid = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Advertencia si faltan credenciales
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Env] Supabase credentials are missing or malformed.');
  
  // En desarrollo, mostrar un mensaje de error más detallado
  if (isBrowser && import.meta.env.DEV) {
    console.error(`
      [ENV ERROR] 🚨 Faltan credenciales de Supabase. Asegúrate de:
      1. Tener un archivo .env.local con las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
      2. O configurar las variables en el panel de Vercel
    `);
  }
}

// Log de diagnóstico en desarrollo
if (isBrowser) {
  console.log('[ENV] Supabase URL en runtime:', SUPABASE_URL);
  
  if (import.meta.env.DEV) {
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
}

// Exportar un objeto con toda la configuración
export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  },
  langfuse: {
    publicKey: LANGFUSE_PUBLIC_KEY,
    secretKey: LANGFUSE_SECRET_KEY
  }
};

export default config; 