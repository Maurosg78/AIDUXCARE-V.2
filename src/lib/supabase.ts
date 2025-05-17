import { vi } from "vitest";
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey, validateSupabaseEnv } from '@/config/env';

// Validar las credenciales de Supabase
const envValidation = validateSupabaseEnv();

// Si faltan las credenciales, lanzar un error explícito
if (!envValidation.success) {
  throw new Error(
    "Supabase credentials are missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment."
  );
}

// Crear cliente con manejo de errores
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Función para verificar la conexión a Supabase
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1);
    
    if (error) {
      console.error('Error al conectar con Supabase:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Excepción al conectar con Supabase:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};

export default supabase; 