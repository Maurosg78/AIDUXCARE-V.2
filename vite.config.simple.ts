import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// Configuración simplificada de Vite para desarrollo
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  server: {
    port: 5174,
    host: true,
    open: false
  },
  define: {
    'process.env.NODE_ENV': '"development"'
  }
});
