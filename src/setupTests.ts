
vi.mock('@/core/auth/supabaseClient');
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach } from 'vitest';

// Mock global para Supabase que se aplicará en todos los tests
vi.mock('./core/auth/supabaseClient', () => {
  return {
    default: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: {}, error: null }),
            order: () => ({ data: [], error: null }),
          }),
        }),
        insert: () => ({ data: {}, error: null }),
        update: () => ({ data: {}, error: null }),
        delete: () => ({ data: {}, error: null }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    },
  };
});

// Suprimir advertencias de consola durante las pruebas
beforeAll(() => {
  // Almacenar los métodos originales de console
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Sobrescribir console.error y console.warn para filtrar mensajes específicos
  console.error = (...args) => {
    // Filtrar mensajes específicos de React relacionados con testing
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Warning: ReactDOM.render') || 
       args[0].includes('React.createFactory') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: Failed prop type') ||
       args[0].includes('Invalid prop'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
  
  console.warn = (...args) => {
    // Filtrar advertencias específicas que no son relevantes para las pruebas
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Warning: useLayoutEffect') || 
       args[0].includes('Warning: React does not recognize'))
    ) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

// Limpiar los mocks después de cada prueba
afterEach(() => {
  vi.clearAllMocks();
}); 