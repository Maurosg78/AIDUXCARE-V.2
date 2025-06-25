/**
 * 🔧 Supabase Client Singleton - Solución Definitiva
 * Patrón Singleton para evitar múltiples instancias del cliente Supabase
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variables de entorno con validación
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

// Validación crítica de variables de entorno
if (!supabaseUrl) {
  throw new Error('ERROR: VITE_SUPABASE_URL no está configurada en .env.local');
}

if (!supabaseAnonKey) {
  throw new Error('ERROR: VITE_SUPABASE_ANON_KEY no está configurada en .env.local');
}

// Validar que la URL tenga el formato correcto
if (!supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
  throw new Error(`ERROR: URL de Supabase inválida: ${supabaseUrl}`);
}

// Singleton instance holder
let supabaseInstance: SupabaseClient | null = null;

/**
 * Crea una única instancia del cliente Supabase
 */
function createSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    console.log('RELOAD: Reutilizando instancia existente de Supabase');
    return supabaseInstance;
  }

  console.log('LAUNCH: Creando nueva instancia de Supabase Singleton');

  // TEMPORAL MVP FIX: Usar service role en desarrollo para evitar problemas RLS
  const isDevelopment = import.meta.env.DEV;
  const useServiceRole = isDevelopment && supabaseServiceRole;
  const keyToUse = useServiceRole ? supabaseServiceRole : supabaseAnonKey;
  const keyType = useServiceRole ? 'service_role' : 'anon';
  
  console.log('🔧 MVP SUPABASE FIX: Usando', keyType, 'key para evitar problemas RLS');

  // Crear cliente con configuración optimizada
  supabaseInstance = createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'aiduxcare-v2-singleton',
        'X-Client-Version': '1.0.0'
      }
    },
    db: {
      schema: 'public'
    }
  });

  // Log de diagnóstico detallado
  console.log('SUCCESS: Supabase Singleton inicializado:', {
    url: `${supabaseUrl.substring(0, 30)}...`,
    keyType,
    keyLength: keyToUse.length,
    isDevelopment,
    timestamp: new Date().toISOString()
  });

  return supabaseInstance;
}

/**
 * Obtiene la instancia Singleton del cliente Supabase
 */
export function getSupabaseClient(): SupabaseClient {
  return createSupabaseClient();
}

/**
 * Resetea la instancia Singleton (solo para testing)
 */
export function resetSupabaseInstance(): void {
  console.log('RELOAD: Reseteando instancia de Supabase (testing mode)');
  supabaseInstance = null;
}

/**
 * Verifica si la instancia ya está creada
 */
export function isSupabaseInitialized(): boolean {
  return supabaseInstance !== null;
}

// Exportación principal - instancia singleton
export const supabase = createSupabaseClient();

// Export por defecto para compatibilidad con código existente
export default supabase; 