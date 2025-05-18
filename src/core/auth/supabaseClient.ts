import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey, validateSupabaseEnv } from '@/config/env';
import { createFallbackClient, testDirectConnection } from './directClient';

// Validar las credenciales de Supabase
const envValidation = validateSupabaseEnv();

// Verificar si las credenciales están disponibles
if (!envValidation.success) {
  console.warn("⚠️ Supabase no configurado correctamente. Utilizando valores de fallback.");
  console.error("❌ Detalle del error:", envValidation.error?.errors);
}

// Opciones para el cliente de Supabase
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'aiduxcare_auth_token' // Añadir nombre específico para el token
  },
  global: {
    headers: {
      'X-Client-Info': 'aiduxcare-v2'
    }
  }
};

// Crear el cliente de Supabase o utilizar el fallback si no está configurado
const supabase = envValidation.success 
  ? createClient(supabaseUrl, supabaseAnonKey, options)
  : createFallbackClient();

// Imprimir información de diagnóstico en modo desarrollo
if (import.meta.env.DEV) {
  console.log('📌 Información de conexión Supabase:');
  console.log(`- URL: ${supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'FALTA ❌'}`);
  console.log(`- API Key válida: ${supabaseAnonKey ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`- Modo: ${envValidation.success ? 'PRODUCCIÓN ✅' : 'FALLBACK ⚠️'}`);
}

// Exportar una bandera para saber si se está usando el modo fallback
export const isSupabaseConfigured = envValidation.success;

// Función para verificar la conexión a Supabase
export async function checkSupabaseConnection() {
  // Si estamos en modo fallback, usar testDirectConnection para verificación
  if (!isSupabaseConfigured) {
    console.log('🔍 Verificando conexión utilizando método directo (modo fallback)...');
    return await testDirectConnection();
  }

  try {
    console.log('🔍 Verificando conexión a Supabase...');
    
    // Intentar una petición de prueba
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error);
      
      // Diagnosticar tipo de error para dar mejor feedback
      if (error.code === 'PGRST301') {
        return { 
          success: false, 
          error: 'Error de autenticación. API key inválida o expirada.', 
          code: 'AUTH_ERROR' 
        };
      } else if (error.code === '20000') {
        return { 
          success: false, 
          error: 'No se pudo contactar al servidor. Verifique su conexión a internet.', 
          code: 'NETWORK_ERROR' 
        };
      } else {
        return { 
          success: false, 
          error: error.message, 
          code: error.code 
        };
      }
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    return { success: true };
  } catch (err) {
    console.error('❌ Error inesperado conectando a Supabase:', err);
    return { 
      success: false, 
      error: String(err),
      code: 'UNKNOWN_ERROR'
    };
  }
}

// Exportar el cliente como default
export default supabase; 