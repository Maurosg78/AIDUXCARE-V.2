/**
 * 🔧 Supabase Test Client - Para Testing en Node.js
 * Solo para scripts de testing que no pueden usar import.meta.env
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// DEBUG: Verificar qué se está cargando exactamente
console.log('🔍 DEBUG - Variables de entorno cargadas:');
console.log('- supabaseUrl length:', supabaseUrl?.length);
console.log('- supabaseUrl value:', supabaseUrl);
console.log('- supabaseAnonKey length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('ERROR: Variables de entorno de Supabase no encontradas en .env.local');
}

// Cliente para testing
export const testSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export async function testSupabaseConnection() {
  console.log('🔧 Iniciando test de conexión Supabase...');
  
  // Información de configuración
  console.log('NOTES: Configuración actual:');
  console.log('- URL:', supabaseUrl);
  console.log('- Key (primeros 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
  
  try {
    // Test 1: Verificar sesión
    const { data: session, error: sessionError } = await testSupabaseClient.auth.getSession();
    if (sessionError) {
      console.error('ERROR: Error de sesión:', sessionError);
    } else {
      console.log('SUCCESS: Sesión OK:', session?.session ? 'Activa' : 'Anónima');
    }

    // Test 2: Verificar acceso a tabla simple
    console.log('🔍 Probando acceso a tabla patients...');
    const { data, error } = await testSupabaseClient
      .from('patients')
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

// Auto-ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabaseConnection();
}