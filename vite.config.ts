import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// Configuración simplificada de Vite para Phoenix MVP
export default defineConfig({
  plugins: [
    react()
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5174,
    strictPort: false,
    open: true,
    host: true
  },
  // Optimización del build
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext'
  }
});
