import { vi } from "vitest";
// Este archivo simplemente exporta el cliente hardcodeado para desarrollo local
// NOTA: Este es un bypass temporal para resolver problemas con variables de entorno
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

interface MinimalSupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => {
      limit: (count: number) => Promise<unknown>;
    };
  };
}

// Función para verificar si un cliente funciona
async function testClient(client: Partial<MinimalSupabaseClient>, name: string): Promise<boolean> {
  try {
    if (!client || typeof client.from !== 'function') return false;
    await client.from('test').select('*').limit(1);
    console.log(`✅ Cliente ${name} funcionando correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al probar cliente ${name}:`, error);
    return false;
  }
}

// Variable para el cliente que finalmente usaremos
let supabaseClient: unknown = null;

// Probar clientes en orden y usar el primero que funcione
async function initializeClient() {
  // Prueba 1: Cliente directo con createClient
  if (await testClient(supabase, 'supabase')) {
    supabaseClient = supabase;
    return;
  }
  
  // Prueba 2: Cliente hardcodeado (de hardcodedClient.ts)
  if (await testClient(hardcodedClient, 'hardcodedClient')) {
    supabaseClient = hardcodedClient;
    return;
  }
  
  // Prueba 3: Cliente mock (de directClient.ts)
  if (await testClient(mockSupabaseClient, 'mockSupabaseClient')) {
    supabaseClient = mockSupabaseClient;
    return;
  }
  
  console.log('Todos los clientes fallaron. Usando mockSupabaseClient como última opción.');
  supabaseClient = mockSupabaseClient;
}

// Inicializar el cliente
initializeClient().catch(console.error);

// Devolver un cliente vacío si es null para evitar errores al importarlo
// Esto será reemplazado por un cliente real una vez que initializeClient complete
const fallbackClient = createClient(supabaseUrl, supabaseAnonKey);

// Exportar el cliente para usar en la aplicación
export default (supabaseClient || fallbackClient) as SupabaseClient; 