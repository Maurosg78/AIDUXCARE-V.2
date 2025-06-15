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
    }
  },
  // Mejorar la configuración de dependencias
  optimizeDeps: {
    include: [
      '@tanstack/react-virtual',
      '@supabase/supabase-js',
      'react',
      'react-dom',
      'react-router-dom'
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
    open: true,
    host: true,
    cors: true,
    proxy: {
      // Proxy para Ollama en desarrollo
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '/api'),
      },
      // Proxy para la Cloud Function de pacientes
      '/api': {
        target: 'https://createpatient-53031427369.us-central1.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
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
        drop_console: true,
        drop_debugger: true,
      },
    },
    target: 'esnext'
  },
  define: {
    // Eliminar referencias a service workers que causan errores
    'self': 'globalThis',
    'global': 'globalThis',
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  }
});
