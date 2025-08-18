import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      // IGNORAR COMPLETAMENTE archivos que causan reinicios
      ignored: [
        '**/BP/**',
        '**/reports/**',
        '**/docs/**',
        '**/*.md',
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/*.log',
        '**/*.tmp',
        '**/*.bak',
        '**/tests/**',
        '**/__tests__/**',
        '**/__fixtures__/**',
        '**/__snapshots__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/tsconfig*.json',
        '**/tailwind.config.ts',
        '**/vite.config*.ts',
        '**/package*.json',
        '**/scripts/**',
        '**/tools/**',
        '**/coverage/**',
        '**/.nyc_output/**'
      ]
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: ['BP/**', 'reports/**', 'docs/**', 'tests/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@headlessui/react']
  }
})
