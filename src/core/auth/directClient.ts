import { supabaseUrl, supabaseAnonKey } from '@/config/env';

/**
 * Función para probar la conexión a Supabase directamente sin usar el cliente
 * Esto es útil para diagnosticar problemas de conexión o como fallback
 */
export async function testDirectConnection() {
  try {
    console.log('Probando conexión directa a Supabase...');
    
    if (!supabaseUrl) {
      return { 
        success: false, 
        error: { 
          message: 'URL de Supabase no configurada',
          hint: 'Verifique las variables de entorno',
          code: 'CONFIG_ERROR'
        } 
      };
    }
    
    // Construir URL para health check
    const url = `${supabaseUrl}/rest/v1/health_check?select=*&limit=1`;
    
    // Intentar conexión con fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Si la respuesta no es exitosa
      let errorMessage = `Error HTTP: ${response.status}`;
      let errorHint = '';
      let errorCode = `HTTP_${response.status}`;
      
      // Detectar errores comunes
      if (response.status === 401) {
        errorCode = 'AUTH_ERROR';
        errorMessage = 'Error de autenticación con Supabase';
        errorHint = 'La API key puede ser inválida o estar expirada';
      } else if (response.status === 404) {
        errorCode = 'ENDPOINT_ERROR';
        errorMessage = 'Endpoint no encontrado';
        errorHint = 'La URL de Supabase puede ser incorrecta';
      }
      
      // Intentar obtener más detalles del error
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorHint = errorData.hint || errorHint;
      } catch (e) {
        // Si no podemos parsear el JSON, usar el texto de la respuesta
        errorHint = await response.text();
      }
      
      return { success: false, error: { message: errorMessage, hint: errorHint, code: errorCode } };
    }
    
    // Respuesta exitosa
    return { success: true };
  } catch (err) {
    // Error de red u otro error
    return { 
      success: false, 
      error: { 
        message: err instanceof Error ? err.message : 'Error de conexión desconocido',
        hint: 'Verifique su conexión a internet y la URL de Supabase',
        code: 'NETWORK_ERROR'
      } 
    };
  }
}

/**
 * Función de fallback para realizar operaciones básicas cuando Supabase no está disponible
 * Esta función simula un cliente mínimo para evitar errores en la aplicación
 */
export function createFallbackClient() {
  // Cliente mínimo que no hace nada pero evita errores
  return {
    // Auth methods
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      // Añadir más métodos según se necesiten
    },
    // Database methods
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: string | number | boolean) => ({
          single: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } }),
        }),
        limit: (limitNum: number) => ({
          range: (from: number, to: number) => ({
            order: (column: string, options: { ascending?: boolean }) => ({
              execute: async () => ({ data: [], error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } })
            })
          })
        }),
        execute: async () => ({ data: [], error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } })
      }),
      insert: () => ({
        execute: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } })
      }),
      update: () => ({
        eq: () => ({
          execute: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } })
        })
      }),
      delete: () => ({
        eq: () => ({
          execute: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } })
        })
      })
    }),
    // Storage methods
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } }),
        list: async () => ({ data: [], error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } }),
        download: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } }),
        remove: async () => ({ data: null, error: { message: 'Supabase no disponible', code: 'FALLBACK_MODE' } })
      })
    }
  };
}

export default { testDirectConnection, createFallbackClient }; 