import { vi } from "vitest";
/**
 * Cliente directo de Supabase que usa fetch para diagnóstico y como último recurso
 * Este archivo evita usar la biblioteca oficial para descartar problemas con ella
 */

// Credenciales directas
const SUPABASE_URL = 'https://mchyxyuaegsbrwodengr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYnJ3b2RlbmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3OTE5ODcsImV4cCI6MjAzMTM2Nzk4N30.nPADTDUw7cKLsGI83tsDLmYxQWR1N7swPZWwrKoH-S4';

// Función para prueba de diagnóstico
export async function testDirectConnection() {
  try {
    console.log('🔍 Probando conexión directa a Supabase con fetch...');
    
    // Intentar una petición directa a la API REST
    const response = await fetch(`${SUPABASE_URL}/rest/v1/health_check?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Verificar respuesta
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión directa exitosa:', data);
      return { success: true, data };
    } else {
      const error = await response.json();
      console.error('❌ Error en conexión directa:', error);
      return { success: false, error, status: response.status };
    }
  } catch (err) {
    console.error('❌ Error en petición fetch:', err);
    return { success: false, error: err };
  }
}

// Función para hacer un select simple
export async function directQuery(table: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true, data: await response.json() };
    } else {
      return { 
        success: false, 
        error: await response.json(),
        status: response.status
      };
    }
  } catch (err) {
    return { success: false, error: err };
  }
}

// Mock de cliente Supabase para reemplazar completamente el original si es necesario
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (query: string = '*') => ({
      limit: async (limit: number = 10) => {
        const result = await directQuery(table);
        return result.success 
          ? { data: result.data, error: null } 
          : { data: null, error: result.error };
      },
      eq: (column: string, value: string) => ({
        order: async (orderColumn: string, { ascending = true } = {}) => {
          const result = await directQuery(table);
          return result.success 
            ? { data: result.data, error: null } 
            : { data: null, error: result.error };
        }
      }),
      order: async (column: string, { ascending = true } = {}) => {
        const result = await directQuery(table);
        return result.success 
          ? { data: result.data, error: null } 
          : { data: null, error: result.error };
      }
    })
  })
};

export default mockSupabaseClient; 