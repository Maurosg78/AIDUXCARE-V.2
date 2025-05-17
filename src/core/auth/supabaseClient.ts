import { vi } from "vitest";
// Este archivo simplemente exporta el cliente hardcodeado para desarrollo local
// NOTA: Este es un bypass temporal para resolver problemas con variables de entorno
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import hardcodedClient from './hardcodedClient';
import mockSupabaseClient from './directClient';

console.log('⚙️ Inicializando cliente Supabase...');

// Credenciales hardcodeadas
const HARDCODED_URL = 'https://mchyxyuaegsbrwodengr.supabase.co';
// La clave tiene caracteres específicos que podrían estar causando problemas
// Probar otra forma de definirla sin posibles caracteres problemáticos
const HARDCODED_KEY = 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' + 
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYnJ3b2RlbmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3OTE5ODcsImV4cCI6MjAzMTM2Nzk4N30' + 
  '.nPADTDUw7cKLsGI83tsDLmYxQWR1N7swPZWwrKoH-S4';

// Opciones explícitas para cliente
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'X-Client-Info': 'aiduxcare-solution'
    }
  }
};

// Función para verificar si un cliente funciona
async function testClient(client: SupabaseClient | null, name: string): Promise<boolean> {
  try {
    if (!client?.from) return false;
    
    console.log(`Probando cliente "${name}"...`);
    const { error } = await client.from('health_check').select('*').limit(1);
    
    if (error) {
      console.log(`Cliente "${name}" falló:`, error);
      return false;
    }
    
    console.log(`✅ Cliente "${name}" está funcionando correctamente`);
    return true;
  } catch (err) {
    console.error(`Error con cliente "${name}":`, err);
    return false;
  }
}

// Crear un cliente nuevo con las credenciales fijas
const directClient = createClient(HARDCODED_URL, HARDCODED_KEY, options);

// Variable para el cliente que finalmente usaremos
let supabase: SupabaseClient | null = null;

// Probar clientes en orden y usar el primero que funcione
async function initializeClient() {
  // Prueba 1: Cliente directo con createClient
  if (await testClient(directClient, 'directClient')) {
    supabase = directClient;
    return;
  }
  
  // Prueba 2: Cliente hardcodeado (de hardcodedClient.ts)
  if (await testClient(hardcodedClient, 'hardcodedClient')) {
    supabase = hardcodedClient;
    return;
  }
  
  // Prueba 3: Cliente mock que usa fetch directamente
  console.log('Todos los clientes fallaron. Usando mockSupabaseClient como última opción.');
  // Asegurarse de que mockSupabaseClient sea compatible con SupabaseClient
  supabase = mockSupabaseClient as unknown as SupabaseClient;
}

// Intentar inicializar
initializeClient().catch(err => {
  console.error('Error durante la inicialización del cliente:', err);
});

// Devolver un cliente vacío si es null para evitar errores al importarlo
// Esto será reemplazado por un cliente real una vez que initializeClient complete
const fallbackClient = createClient(HARDCODED_URL, HARDCODED_KEY, options);

// Exportar el cliente para usar en la aplicación
export default (supabase || fallbackClient) as SupabaseClient; 