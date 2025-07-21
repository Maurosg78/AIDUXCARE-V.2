import { defineConfig, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => ({
  plugins: [
    react()
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    copyPublicDir: true
  },
  server: {
    host: 'localhost',
    port: 5174
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}));
