import { vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * 🔧 Supabase Client Mock - Migración a Firebase
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 * 
 * Mock temporal para evitar errores de compilación durante la migración completa a Firebase
 * TODO: Eliminar todas las referencias a Supabase y migrar a Firebase completamente
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
console.log('⚙️ Usando mock temporal de Supabase durante migración a Firebase...');

// Mock avanzado de Supabase compatible con todos los chains y métodos
function createQueryMock(result: unknown = { data: [], error: null }): Record<string, unknown> {
  // Métodos encadenables
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    catch: vi.fn(() => Promise.resolve(result)),
    finally: vi.fn(() => Promise.resolve(result)),
    then: vi.fn((cb: (v: unknown) => unknown) => Promise.resolve(result).then(cb)),
    returns: vi.fn((r: unknown) => { result = r; return chain; }),
  };
  return chain;
}

const mockSupabase = {
  from: vi.fn((table: string) => createQueryMock()),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    })),
  },
  // Propiedades dummy requeridas por SupabaseClient
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
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  schema: 'public',
  serviceKey: 'mock-service-key',
  storageKey: 'mock-storage-key',
  headers: {},
  channel: vi.fn(),
  getChannels: vi.fn(),
  removeAllChannels: vi.fn(),
  removeChannel: vi.fn(),
  setAuth: vi.fn(),
  setSession: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  // Métodos dummy adicionales para compatibilidad
  restUrl: 'mock-rest-url',
  authStorageKey: 'mock-auth-storage-key',
  getAuthSession: vi.fn(),
  getUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOutUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
  // ... puedes agregar más si el tipado lo requiere ...
} as unknown as SupabaseClient;

export default mockSupabase;
export const supabase = mockSupabase;

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
    note: 'Mock temporal durante migración a Firebase',
  };
} // Force update: Mon Jul 14 20:15:00 CEST 2025 - Enhanced mock with full SupabaseClient compatibility
