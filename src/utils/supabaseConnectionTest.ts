// Test directo de conexión Supabase
import supabase from '@/core/auth/supabaseClient';

export async function testSupabaseConnection() {
  console.log('🔧 Iniciando test de conexión Supabase...');
  
  // Información de configuración
  console.log('NOTES: Configuración actual:');
  console.log('- URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('- Key (primeros 50 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 50) + '...');
  
  try {
    // Test 1: Verificar sesión
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('ERROR: Error de sesión:', sessionError);
    } else {
      console.log('SUCCESS: Sesión OK:', session?.session ? 'Activa' : 'Anónima');
    }

    // Test 2: Verificar acceso a tabla simple
    console.log('🔍 Probando acceso a tabla memory_blocks...');
    const { data, error } = await supabase
      .from('memory_blocks')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('ERROR: Error de consulta:', error);
      return false;
    } else {
      console.log('SUCCESS: Consulta exitosa. Registros encontrados:', data?.length || 0);
      return true;
    }
  } catch (err) {
    console.error('💥 Excepción:', err);
    return false;
  }
}

// Auto-ejecutar en desarrollo
if (import.meta.env.DEV) {
  console.log('LAUNCH: Auto-ejecutando test de conexión...');
  testSupabaseConnection();
} 