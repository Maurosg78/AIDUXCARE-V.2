import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// Configuración optimizada de Vite
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@headlessui/react": path.resolve(__dirname, "./src/lib/headless-ui.tsx"),
      "@tanstack/react-virtual": path.resolve(__dirname, "./src/lib/tanstack-virtual-mock.ts"),
      "use-sync-external-store": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts"),
      "use-sync-external-store/with-selector": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts")
    }
  },
  // Mejorar la configuración de dependencias
  optimizeDeps: {
    include: [
      '@tanstack/react-virtual'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
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
