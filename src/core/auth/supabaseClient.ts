/**
 * 🔧 Supabase Client Mock - Migración a Firebase
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 * 
 * Mock temporal para evitar errores de compilación durante la migración completa a Firebase
 * TODO: Eliminar todas las referencias a Supabase y migrar a Firebase completamente
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
console.log('⚙️ Usando mock temporal de Supabase durante migración a Firebase...');

// Mock avanzado de Supabase con chaining profundo y resultados configurables
import { vi } from 'vitest';

// Utilidad para crear un mock de chain profundo
function createDeepChainMock(methods: string[] = []) {
  const handler = {
    get(target: any, prop: string) {
      if (prop === '__setResult') {
        return (result: any) => {
          target.__result = result;
        };
      }
      if (prop === 'then') {
        // Permite await/then en el chain final
        return (onFulfilled: any, onRejected: any) => Promise.resolve(target.__result).then(onFulfilled, onRejected);
      }
      if (prop === 'returns') {
        // Permite sobrescribir el resultado final
        return (result: any) => {
          target.__result = result;
          return target;
        };
      }
      if (prop === 'mockImplementation') {
        // Permite sobrescribir la implementación de un método
        return (fn: any) => {
          target.__mockImpl = fn;
          return target;
        };
      }
      // Si el método existe, retorna un nuevo proxy para chaining
      if (methods.includes(prop)) {
        const next = createDeepChainMock(methods);
        return (...args: any[]) => {
          if (target.__mockImpl) {
            return target.__mockImpl(prop, ...args);
          }
          return next;
        };
      }
      // Si es una propiedad especial
      if (prop === '__result') return target.__result;
      // Permitir await chain
      if (prop === 'toPrimitive' || prop === 'valueOf') {
        return () => target.__result;
      }
      if (prop === 'asyncIterator') {
        // Para compatibilidad con for-await (no usado, pero por robustez)
        return async function* () {
          yield target.__result;
        };
      }
      return undefined;
    },
    // Permitir await chain
    getPrototypeOf() {
      return Promise.prototype;
    },
    apply(target: any, thisArg: any, argArray?: any) {
      return target.__result;
    }
  };
  // Permitir await chain
  const proxy = new Proxy({ __result: undefined }, handler);
  proxy.then = (onFulfilled: any, onRejected: any) => Promise.resolve(proxy.__result).then(onFulfilled, onRejected);
  return proxy;
}

function createChainableMock(methods: string[] = []) {
  // Estado compartido entre todos los chains de un mismo flujo
  const createState = () => ({ result: undefined });
  const makeChain = (state?: any) => {
    const __state = state || createState();
    const chain: any = {};
    methods.forEach((method) => {
      chain[method] = (..._args: any[]) => makeChain(__state);
    });
    chain.returns = (result: any) => {
      __state.result = result;
      return chain;
    };
    chain.then = (onFulfilled: any, onRejected: any) => Promise.resolve(__state.result).then(onFulfilled, onRejected);
    chain.catch = (onRejected: any) => Promise.resolve(__state.result).catch(onRejected);
    chain.finally = (onFinally: any) => Promise.resolve(__state.result).finally(onFinally);
    chain[Symbol.toStringTag] = 'Promise';
    chain[Symbol.toPrimitive] = () => __state.result;
    chain.valueOf = () => __state.result;
    chain[Symbol.asyncIterator] = async function* () { yield __state.result; };
    return chain;
  };
  // Map para almacenar un chain por tabla
  const tableChains = new Map<string, any>();
  const from = (table: string) => {
    if (!tableChains.has(table)) {
      tableChains.set(table, makeChain());
    }
    return tableChains.get(table);
  };
  return { from };
}

const chainMethods = [
  'select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'limit', 'in',
];

const supabaseChainMock = createChainableMock(chainMethods);

const mockSupabase = {
  ...supabaseChainMock,
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: null } })),
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
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  schema: 'public',
  serviceKey: 'mock-service-key',
};

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
