// src/core/auth/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import hardcodedClient from './hardcodedClient';
import mockSupabaseClient from './directClient';

console.log('⚙️ Inicializando cliente Supabase...');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Función para verificar si un cliente es funcional.
 * En lugar de esperar un tipo exacto, validamos que la función `.from().select()` devuelva una promesa.
 */
async function testClient(client: any, name: string): Promise<boolean> {
  try {
    const result = client?.from?.('test')?.select?.('*')?.limit?.(1);

    if (result && typeof result.then === 'function') {
      await result;
      console.log(`✅ Cliente ${name} funcionando correctamente`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error al probar cliente ${name}:`, error);
  }

  return false;
}

// Variable global para el cliente elegido
let supabaseClient: SupabaseClient;

// Inicializar el cliente dinámicamente
async function initializeClient() {
  if (await testClient(supabase, 'supabase')) {
    supabaseClient = supabase;
    return;
  }

  if (await testClient(hardcodedClient, 'hardcodedClient')) {
    supabaseClient = hardcodedClient;
    return;
  }

  if (await testClient(mockSupabaseClient, 'mockSupabaseClient')) {
    supabaseClient = mockSupabaseClient as unknown as SupabaseClient;
    return;
  }

  console.warn('⚠️ Todos los clientes fallaron. Se usará supabase por defecto.');
  supabaseClient = supabase;
}

// Inicializar el cliente (sin esperar — no bloquea)
initializeClient().catch(console.error);

// Fallback: exporta supabase por si la inicialización no ha terminado aún
export default supabase;
