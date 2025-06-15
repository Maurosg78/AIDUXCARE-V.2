require('dotenv').config({ path: '.env.test' });
require('@testing-library/jest-dom');

// Configuración global para los tests
global.console = {
  ...console,
  // Desactivar logs en los tests
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock de las variables de entorno
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.VITE_OPENAI_API_KEY = 'sk-test-key';
process.env.VITE_OPENAI_MODEL = 'gpt-4';
process.env.VITE_OPENAI_TEMPERATURE = '0.7';
process.env.VITE_OPENAI_MAX_TOKENS = '2000';
process.env.VITE_OPENAI_TOP_P = '1';
process.env.VITE_OPENAI_FREQUENCY_PENALTY = '0';
process.env.VITE_OPENAI_PRESENCE_PENALTY = '0';
