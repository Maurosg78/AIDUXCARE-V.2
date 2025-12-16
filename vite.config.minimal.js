// Configuración MÍNIMA de Vite - Sin optimizaciones que puedan causar problemas
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    strictPort: false,
    // Desactivar watch completamente para evitar colgues
    watch: null,
    hmr: false,
  },
  // Desactivar optimizaciones que puedan causar problemas
  optimizeDeps: {
    disabled: true,
  },
});

