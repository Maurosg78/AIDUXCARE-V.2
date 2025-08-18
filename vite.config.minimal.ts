import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración ultra-simple de Vite
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  }
});
