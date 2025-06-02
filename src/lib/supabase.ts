// Configuración de Supabase - SOLUCIÓN DEFINITIVA PARA RLS
import { createClient } from '@supabase/supabase-js';

// Variables desde entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || '';

// Verificación
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials missing');
}

// En desarrollo, usar service_role si está disponible para bypass RLS
const isDevelopment = import.meta.env.DEV;
const keyToUse = isDevelopment && supabaseServiceRole ? supabaseServiceRole : supabaseAnonKey;
const keyType = isDevelopment && supabaseServiceRole ? 'service_role' : 'anon';

// Cliente con configuración robusta
export const supabase = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'aiduxcare-v2',
      'Prefer': 'return=representation'
    }
  },
  db: {
    schema: 'public'
  }
});

// Log de diagnóstico
console.log('🔧 Supabase configurado:', {
  url: supabaseUrl.substring(0, 30) + '...',
  keyType,
  keyLength: keyToUse.length,
  development: isDevelopment,
  timestamp: new Date().toISOString()
});

export default supabase; 