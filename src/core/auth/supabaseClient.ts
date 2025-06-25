/**
 * 🔧 Supabase Client - Re-exportación del Singleton
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 * 
 * Este archivo mantiene compatibilidad con el código existente
 * pero delega toda la lógica al singleton en src/lib/supabaseClient.ts
 */

import { supabase, getSupabaseClient, isSupabaseInitialized } from '@/lib/supabaseClient';

// Log de compatibilidad
console.log('⚙️ Usando cliente Supabase centralizado (vía singleton)...');

// Verificar que el singleton esté inicializado
if (!isSupabaseInitialized()) {
  console.warn('WARNING: Cliente Supabase no inicializado correctamente');
}

// Re-exportar el cliente único para compatibilidad total
export default supabase;
export { supabase, getSupabaseClient };

// Función de diagnóstico para verificar la instancia
export function diagnosticSupabaseClient() {
  return {
    isInitialized: isSupabaseInitialized(),
    clientReference: supabase,
    timestamp: new Date().toISOString()
  };
}
