import { vi } from "vitest";
import { vi } from 'vitest';

/**
 * Configuración rápida de mock para Supabase en archivos de prueba
 * Este mock se puede usar al principio de cada archivo de prueba específico
 * para anular el mock global y proporcionar comportamientos personalizados
 * 
 * Ejemplo de uso:
 * 
 * ```ts
 * // Al inicio del archivo de prueba, antes de importar los componentes
 * vi.mock('@/core/auth/supabaseClient', () => ({
 *   default: configureSupabaseMock({
 *     data: { custom: 'data' },
 *     session: { user: { id: 'test-user-id' } }
 *   })
 * }));
 * ```
 */
export function configureSupabaseMock(options: {
  data?: any;
  error?: any;
  session?: any;
  user?: any;
} = {}) {
  const { data = {}, error = null, session = null, user = null } = options;
  
  return {
    // Auth methods
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error }),
      signOut: vi.fn().mockResolvedValue({ error }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
    
    // Database methods
    from: vi.fn().mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      overlap: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
      then: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data : [data], error }),
    })),
    
    // Storage methods
    storage: {
      from: vi.fn().mockImplementation((bucket) => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error }),
        download: vi.fn().mockResolvedValue({ data: {}, error }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.png' } }),
        list: vi.fn().mockResolvedValue({ data: [], error }),
        remove: vi.fn().mockResolvedValue({ data: {}, error }),
      })),
    },
    
    // RPC calls
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Crea una respuesta simulada de Supabase con datos y sin error
 */
export function mockSuccessResponse(data: any) {
  return { data, error: null };
}

/**
 * Crea una respuesta simulada de Supabase con error y sin datos
 */
export function mockErrorResponse(message: string) {
  return { data: null, error: { message } };
} 