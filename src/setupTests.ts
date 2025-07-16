import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import { initializeApp, getApps } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Configurar Chai con plugins (sin chai-as-promised para evitar conflictos)
chai.use(sinonChai);

// Configurar jest globalmente
global.jest = vi as unknown as typeof jest;

// Configuración optimizada para performance
const setupStartTime = Date.now();

// Configuración Firebase para testing local con emulador
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'test-project',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
  connectFirestoreEmulator(getFirestore(), 'localhost', 8080);
}

// Mock completo para las variables de entorno
vi.mock('./config/env', () => ({
  SUPABASE_URL: 'https://mock-supabase-url.co',
  SUPABASE_ANON_KEY: 'mock-anon-key',
  ENV_TYPE: 'test',
  API_BASE_URL: 'https://mock-api-base-url.co',
  OPENAI_API_KEY: 'mock-openai-key',
  ANTHROPIC_API_KEY: 'mock-anthropic-key',
  __esModule: true,
  default: {
    SUPABASE_URL: 'https://mock-supabase-url.co',
    SUPABASE_ANON_KEY: 'mock-anon-key',
    ENV_TYPE: 'test',
    API_BASE_URL: 'https://mock-api-base-url.co',
    OPENAI_API_KEY: 'mock-openai-key',
    ANTHROPIC_API_KEY: 'mock-anthropic-key',
  }
}));

// Definir un mock global de cliente Supabase para evitar duplicación
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { professional_id: 'prof-mock-123' }, 
          error: null 
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          then: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        then: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      then: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    }))
  })),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-mock-123' } } }, error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-mock-123' } }, error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-mock-123' } }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null }))
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock-public-url.co' } }))
    }))
  }
};

// Mock completo para @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Mock para el cliente de Supabase que se usa a través de supabaseClient
vi.mock('./core/auth/supabaseClient', () => {
  return {
    default: mockSupabaseClient,
    __esModule: true
  };
});

// Mock para formDataSourceSupabase que muchos tests podrían usar
vi.mock('./core/dataSources/formDataSourceSupabase', () => ({
  formDataSourceSupabase: {
    getFormsByVisitId: vi.fn().mockResolvedValue([{
      id: 'form-mock-123',
      visit_id: 'visit-mock-123',
      patient_id: 'patient-mock-123',
      professional_id: 'prof-mock-123',
      form_type: 'SOAP',
      content: JSON.stringify({
        subjective: 'Datos de prueba subjetivos',
        objective: 'Datos de prueba objetivos',
        assessment: 'Datos de prueba diagnóstico',
        plan: 'Datos de prueba plan',
        notes: 'Datos de prueba notas'
      }),
      status: 'draft',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z'
    }]),
    getFormById: vi.fn().mockResolvedValue({
      id: 'form-mock-123',
      visit_id: 'visit-mock-123',
      patient_id: 'patient-mock-123',
      professional_id: 'prof-mock-123',
      form_type: 'SOAP',
      content: JSON.stringify({
        subjective: 'Datos de prueba subjetivos',
        objective: 'Datos de prueba objetivos',
        assessment: 'Datos de prueba diagnóstico',
        plan: 'Datos de prueba plan',
        notes: 'Datos de prueba notas'
      }),
      status: 'draft',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z'
    }),
    updateForm: vi.fn().mockResolvedValue({ id: 'form-mock-123' }),
    createForm: vi.fn().mockResolvedValue({ id: 'new-form-mock-123' })
  }
}));

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
       args[0].includes('Invalid prop') ||
       args[0].includes('supabaseUrl is required') ||
       args[0].includes('Cannot read properties of null') ||
       args[0].includes('createClient requires a valid supabase URL'))
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
       args[0].includes('Warning: React does not recognize') ||
       args[0].includes('Missing Supabase client') ||
       args[0].includes('Invalid Supabase configuration'))
    ) {
      return;
    }
    originalConsoleWarn(...args);
  };
  
  // Log de performance del setup
  const setupTime = Date.now() - setupStartTime;
  if (setupTime > 1000) {
    console.log(`⚡ Setup time: ${setupTime}ms`);
  }
});

// Limpiar los mocks después de cada prueba
afterEach(() => {
  vi.clearAllMocks();
}); 