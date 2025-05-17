import { createClient } from '@supabase/supabase-js';

// Valores de configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mchyxyuaegsbrwodengr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYnJ3b2RlbmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3OTE5ODcsImV4cCI6MjAzMTM2Nzk4N30.nPADTDUw7cKLsGI83tsDLmYxQWR1N7swPZWwrKoH-S4';

// Verificar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Las variables de entorno de Supabase no están configuradas correctamente');
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