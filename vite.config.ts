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
      "@tanstack/react-virtual": path.resolve(__dirname, "./src/lib/tanstack-virtual-mock.ts"),
      "use-sync-external-store": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts"),
      "use-sync-external-store/with-selector": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/core": path.resolve(__dirname, "./src/core"),
      // POLYFILLS PARA WINSTON Y NODE.JS MODULES
      "util": "util",
      "os": "os-browserify/browser",
      "path": "path-browserify",
      "fs": "browserify-fs",
      "http": "stream-http",
      "https": "https-browserify",
      "zlib": "browserify-zlib",
      "events": "events",
      "buffer": "buffer",
      "stream": "stream-browserify"
    }
  },
  // Mejorar la configuración de dependencias
  optimizeDeps: {
    include: [
      '@tanstack/react-virtual',
      '@supabase/supabase-js',
      'react',
      'react-dom',
      'react-router-dom',
      // INCLUIR POLYFILLS
      'util',
      'events',
      'buffer'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    strictPort: false,
    open: false,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        // Apuntamos directamente a la función desplegada en Google Cloud
        target: 'https://us-central1-aiduxcare-mvp-prod.cloudfunctions.net',
        changeOrigin: true,
        // No necesitamos reescribir la ruta, ya que la estructura coincide
      },
    },
  },
  // Optimización del build
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimizaciones de bundle
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['clsx', 'tailwind-merge'],
        },
      }
    },
    // Configuraciones de optimización
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // MANTENER CONSOLE PARA UAT
        drop_debugger: true,
      },
    },
    target: 'esnext'
  },
  define: {
    // POLYFILLS PARA COMPATIBILIDAD NAVEGADOR
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"v18.0.0"',
    'process.versions': '{}',
    'process.browser': 'true',
    'self': 'globalThis',
    'global': 'globalThis',
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  }
});
