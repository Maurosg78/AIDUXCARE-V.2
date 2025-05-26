// Archivo de configuración para variables de entorno
import { z } from 'zod';

// Esquema de validación para variables de entorno Supabase
const supabaseEnvSchema = z.object({
  supabaseUrl: z.string().min(1, { message: "VITE_SUPABASE_URL is required" }),
  supabaseAnonKey: z.string().min(1, { message: "VITE_SUPABASE_ANON_KEY is required" }),
});

// Obtener variables de Supabase directamente desde import.meta.env
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Variables de Langfuse - mantener para compatibilidad
export const LANGFUSE_PUBLIC_KEY = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || '';
export const LANGFUSE_SECRET_KEY = import.meta.env.VITE_LANGFUSE_SECRET_KEY || '';

// Validar configuración de Supabase
export const validateSupabaseEnv = () => {
  const result = supabaseEnvSchema.safeParse({
    supabaseUrl,
    supabaseAnonKey
  });
  
  return result;
};

// Verificar si la configuración es válida
export const isSupabaseConfigValid = (): boolean => {
  const result = validateSupabaseEnv();
  return result.success;
};

// Exportar configuración para compatibilidad con código existente
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

// Función de validación general (mantener para compatibilidad)
export const validateEnv = validateSupabaseEnv;
export const isConfigValid = isSupabaseConfigValid;

// Log de diagnóstico en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('⚠️ Información de configuración (solo visible en desarrollo):');
  console.log(`- SUPABASE_URL: ${supabaseUrl ? 'OK ✅' : 'MISSING ❌'}`);
  console.log(`- SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'OK ✅' : 'MISSING ❌'}`);
  
  // Intentar validar la URL
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
      console.log('- URL format: VALID ✅');
    } catch (e) {
      console.error('- URL format: INVALID ❌ - La URL de Supabase no es válida');
    }
  }
}

// Exportar un objeto con toda la configuración
export const config = {
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  },
  langfuse: {
    publicKey: LANGFUSE_PUBLIC_KEY,
    secretKey: LANGFUSE_SECRET_KEY
  }
};

export default config;
