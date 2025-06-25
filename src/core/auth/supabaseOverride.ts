import { vi } from "vitest";
import { createClient } from '@supabase/supabase-js';

// Credenciales hardcodeadas para desarrollo local
// NO HAGAS ESTO EN PRODUCCIÓN - Solo se usa para desarrollo local por problemas con las variables de entorno
const SUPABASE_URL = 'https://mchyxyuaegsbrwodengr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYnJ3b2RlbmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3OTE5ODcsImV4cCI6MjAzMTM2Nzk4N30.nPADTDUw7cKLsGI83tsDLmYxQWR1N7swPZWwrKoH-S4';

// Esta función crea un cliente de Supabase que se puede usar durante el desarrollo
// Esta solución es temporal para evitar problemas con las variables de entorno
export function createDevClient() {
  console.log('[ENV] Usando cliente Supabase de desarrollo con credenciales hardcodeadas');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Exportar el cliente para usar en desarrollo
export const supabaseDevClient = createDevClient();

export default supabaseDevClient; 