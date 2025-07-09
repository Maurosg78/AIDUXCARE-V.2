import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from 'path';

// Configuración HTTPS para acceso al micrófono
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Plugin SSL para contexto seguro
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configuración del servidor de desarrollo
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
  // Optimización del build
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext'
  }
});
