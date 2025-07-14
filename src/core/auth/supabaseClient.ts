/**
 * 🔧 Supabase Client Mock - Migración a Firebase
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 * 
 * Mock temporal para evitar errores de compilación durante la migración completa a Firebase
 * TODO: Eliminar todas las referencias a Supabase y migrar a Firebase completamente
 */

console.log('⚙️ Usando mock temporal de Supabase durante migración a Firebase...');

// Mock del cliente Supabase con operaciones encadenadas completas
const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: { professional_id: 'mock-professional-id' }, error: null }),
        order: (column: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          then: (callback: any) => Promise.resolve({ data: [], error: null })
        }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        then: (callback: any) => Promise.resolve({ data: { professional_id: 'mock-professional-id' }, error: null })
      }),
      in: (column: string, values: any[]) => ({
        then: (callback: any) => Promise.resolve({ data: [], error: null })
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        then: (callback: any) => Promise.resolve({ data: [], error: null })
      }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      then: (callback: any) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data: any) => ({
      then: (callback: any) => Promise.resolve({ data: null, error: null })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: (callback: any) => Promise.resolve({ data: null, error: null })
      }),
      then: (callback: any) => Promise.resolve({ data: null, error: null })
    }),
    upsert: (data: any) => ({
      then: (callback: any) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: (callback: any) => Promise.resolve({ data: null, error: null })
      }),
      then: (callback: any) => Promise.resolve({ data: null, error: null })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Mock de suscripción
      return { data: { subscription: null } };
    }
  },
  // Propiedades requeridas por el tipo SupabaseClient
  supabaseUrl: 'mock-url',
  supabaseKey: 'mock-key',
  realtime: {} as any,
  realtimeUrl: 'mock-realtime-url'
};

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
} 