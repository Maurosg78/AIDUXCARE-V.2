import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: { port: 5174, strictPort: true },
  plugins: [react()],
  optimizeDeps: { include: ['react', 'react-dom'] },
  test: { 
    exclude: ['tests/e2e/**'],
    environment: 'jsdom',
    setupFiles: ['tests/setup/globals.ts']
  }
});
