import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// Configuración optimizada de Vite
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  // Mejorar la configuración de dependencias
  optimizeDeps: {
    exclude: ['@headlessui/react'] // Excluir biblioteca problemática
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    host: true
  },
  // Mejorar el manejo de errores
  build: {
    sourcemap: true
  }
});
