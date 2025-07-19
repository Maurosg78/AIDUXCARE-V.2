import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Configuración optimizada de Vite
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - genera stats.html después del build
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@headlessui/react": path.resolve(__dirname, "./src/lib/headless-ui.tsx"),
      // "@tanstack/react-virtual": path.resolve(__dirname, "./src/lib/tanstack-virtual-mock.ts"),
      "use-sync-external-store": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts"),
      "use-sync-external-store/with-selector": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts")
    }
  },
  // Mejorar la configuración de dependencias
  optimizeDeps: {
    include: [
      '@tanstack/react-virtual',
      '@supabase/supabase-js'
    ],
    exclude: [
      'vitest',
      '@vitest/ui',
      'vitest/config'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
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
    // Optimizaciones de bundle
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    // Configuraciones de optimización
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext'
  },
  define: {
    // Eliminar referencias a service workers que causan errores
    'self': 'globalThis',
    'global': 'globalThis',
    // Prevenir carga de Vitest en el navegador
    'process.env.NODE_ENV': '"development"'
  }
});
