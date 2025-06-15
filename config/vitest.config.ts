import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// NOTA: El setup de dotenv se mueve al archivo jest.setup.cjs
// para asegurar que se ejecute en el entorno de test antes que nada.

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Este archivo de setup es crucial. Se ejecuta antes que todos los tests.
    setupFiles: './config/jest.setup.cjs', 
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      // Configuración del alias '@' para que las importaciones funcionen en los tests
      '@': path.resolve(__dirname, '../src'), 
    },
  },
});
