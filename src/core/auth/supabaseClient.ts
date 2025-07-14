/**
 * 🔧 Supabase Client Mock - Migración a Firebase
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 * 
 * Mock temporal para evitar errores de compilación durante la migración completa a Firebase
 * TODO: Eliminar todas las referencias a Supabase y migrar a Firebase completamente
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
console.log('⚙️ Usando mock temporal de Supabase durante migración a Firebase...');

// Mock del cliente Supabase con operaciones encadenadas completas y compatibilidad de tipos
const mockSupabase = {
  from: (_table: string) => ({
    select: (_columns?: string) => ({
      eq: (_column: string, _value: unknown) => ({
        single: () => Promise.resolve({ data: { professional_id: 'mock-professional-id' }, error: null }),
        order: (_column: string, _options?: unknown) => ({
          limit: (_count: number) => Promise.resolve({ data: [], error: null }),
          then: (_callback: unknown) => Promise.resolve({ data: [], error: null })
        }),
        limit: (_count: number) => Promise.resolve({ data: [], error: null }),
        then: (_callback: unknown) => Promise.resolve({ data: { professional_id: 'mock-professional-id' }, error: null })
      }),
      in: (_column: string, _values: unknown[]) => ({
        then: (_callback: unknown) => Promise.resolve({ data: [], error: null })
      }),
      order: (_column: string, _options?: unknown) => ({
        limit: (_count: number) => Promise.resolve({ data: [], error: null }),
        then: (_callback: unknown) => Promise.resolve({ data: [], error: null })
      }),
      limit: (_count: number) => Promise.resolve({ data: [], error: null }),
      then: (_callback: unknown) => Promise.resolve({ data: [], error: null })
    }),
    insert: (_data: unknown) => ({
      then: (_callback: unknown) => Promise.resolve({ data: null, error: null })
    }),
    update: (_data: unknown) => ({
      eq: (_column: string, _value: unknown) => ({
        then: (_callback: unknown) => Promise.resolve({ data: null, error: null })
      }),
      then: (_callback: unknown) => Promise.resolve({ data: null, error: null })
    }),
    upsert: (_data: unknown) => ({
      then: (_callback: unknown) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (_column: string, _value: unknown) => ({
        then: (_callback: unknown) => Promise.resolve({ data: null, error: null })
      }),
      then: (_callback: unknown) => Promise.resolve({ data: null, error: null })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (_callback: unknown) => {
      // Mock de suscripción
      return { data: { subscription: null } };
    }
  },
  // Propiedades requeridas por el tipo SupabaseClient
  supabaseUrl: 'mock-url',
  supabaseKey: 'mock-key',
  authUrl: 'mock-auth-url',
  storageUrl: 'mock-storage-url',
  functionsUrl: 'mock-functions-url',
  realtime: {} as unknown,
  realtimeUrl: 'mock-realtime-url',
  rest: {} as unknown,
  storage: {} as unknown,
  functions: {} as unknown,
  rpc: () => Promise.resolve({ data: null, error: null }),
  schema: 'public',
  serviceKey: 'mock-service-key'
} as unknown;

// Exportar mock para compatibilidad temporal
export default mockSupabase;
export const supabase = mockSupabase;

// Funciones mock para compatibilidad
export function getSupabaseClient() {
  return mockSupabase;
}

export function isSupabaseInitialized() {
  return true;
}

export function diagnosticSupabaseClient() {
  return {
    isInitialized: true,
    clientReference: mockSupabase,
    timestamp: new Date().toISOString(),
    note: 'Mock temporal durante migración a Firebase'
  };
} // Force update: Mon Jul 14 20:15:00 CEST 2025 - Enhanced mock with full SupabaseClient compatibility
