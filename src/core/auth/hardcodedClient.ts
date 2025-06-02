import { createClient } from '@supabase/supabase-js';

// ATENCIÓN: Este archivo solo debe usarse para desarrollo local
// Contiene credenciales hardcodeadas que NO deben usarse en producción
// Es una solución temporal para resolver problemas con el entorno

// Credenciales directas sin depender de variables de entorno
const HARDCODED_URL = 'https://mchyxyuaegsbrwodengr.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYnJ3b2RlbmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3OTE5ODcsImV4cCI6MjAzMTM2Nzk4N30.nPADTDUw7cKLsGI83tsDLmYxQWR1N7swPZWwrKoH-S4';

// Opciones específicas para evitar problemas comunes
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'aiduxcare-development'
    },
  },
};

// Crear y exportar el cliente
const hardcodedClient = createClient(HARDCODED_URL, HARDCODED_KEY, options);

console.log('🔧 Usando cliente Supabase hardcodeado para desarrollo');

export default hardcodedClient; 