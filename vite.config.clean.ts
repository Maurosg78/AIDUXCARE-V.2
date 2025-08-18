import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // Forzar variables de entorno para PROD
    'import.meta.env.VITE_USE_EMULATORS': JSON.stringify('false'),
    'import.meta.env.VITE_ENV_TARGET': JSON.stringify('PROD'),
    'import.meta.env.VITE_ALLOW_SEED': JSON.stringify('false')
  }
});

