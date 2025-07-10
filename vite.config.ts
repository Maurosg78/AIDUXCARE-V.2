import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    // Copiar archivos de configuración de Netlify
    copyPublicDir: true,
  },
  server: {
    https: {
      // Usar certificados autogenerados por basicSsl
      enabled: true
    },
    host: 'localhost',
    port: 5174,
  },
});
