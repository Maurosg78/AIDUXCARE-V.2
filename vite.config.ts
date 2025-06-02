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
      '@tanstack/react-virtual',
      '@supabase/supabase-js'
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
  // Optimización del build
  build: {
    sourcemap: true,
    // Optimizaciones de bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para mejor caching
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react'],
          utils: ['date-fns', 'uuid']
        }
      }
    },
    // Configuraciones de optimización
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext'
  }
});
