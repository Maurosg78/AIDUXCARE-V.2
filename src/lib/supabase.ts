import supabase, { checkSupabaseConnection, isSupabaseConfigured } from '@/core/auth/supabaseClient';

// Reexportar el cliente unificado y sus funciones auxiliares
export { supabase, checkSupabaseConnection, isSupabaseConfigured };

// Exportar también como default para mantener compatibilidad
export default supabase; 