/**
 * 🔧 Supabase Test con Service Role - Para Testing Avanzado
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.VITE_SUPABASE_SERVICE_ROLE;

console.log('🔍 DEBUG - Service Role Test:');
console.log('- supabaseUrl:', supabaseUrl);
console.log('- serviceRole length:', supabaseServiceRole?.length);

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('❌ Variables de entorno de Supabase Service Role no encontradas');
}

// Cliente con service role
const testServiceClient = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export async function testSupabaseServiceRole() {
  console.log('🔧 Iniciando test con Service Role...');
  
  try {
    // Test: Verificar acceso a tabla con service role
    console.log('🔍 Probando acceso a tabla patients con service role...');
    const { data, error } = await testServiceClient
      .from('patients')
      .select('id, name')
      .limit(3);
    
    if (error) {
      console.error('❌ Error con service role:', error);
      return false;
    } else {
      console.log('✅ Service role OK. Registros encontrados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📊 Muestra de datos:', data[0]);
      }
      return true;
    }
  } catch (err) {
    console.error('💥 Excepción con service role:', err);
    return false;
  }
}

// Auto-ejecutar
testSupabaseServiceRole(); 