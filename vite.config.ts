import { defineConfig, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => ({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@headlessui/react": path.resolve(__dirname, "./src/lib/headless-ui.tsx"),
      "use-sync-external-store": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts"),
      "use-sync-external-store/with-selector": path.resolve(__dirname, "./src/lib/use-sync-external-store-mock.ts")
    }
  },
  optimizeDeps: {
    include: [
      '@tanstack/react-virtual',
      '@supabase/supabase-js',
      'react',
      'react-dom',
      '@headlessui/react',
      '@heroicons/react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
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
  server: {
    port: 5174,
    strictPort: false,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'utils-vendor': ['@tanstack/react-virtual']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext',
    assetsInlineLimit: 4096,
    cssCodeSplit: true
  },
  define: {
    'self': 'globalThis',
    'global': 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  esbuild: {
    define: {
      'crypto.hash': 'undefined',
      'global': 'globalThis'
    }
  }
}));
