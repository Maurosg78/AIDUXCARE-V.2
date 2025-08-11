import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      // Ignorar archivos que causan reinicios constantes
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
        '**/*.bak'
      ]
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: ['BP/**', 'reports/**', 'docs/**']
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
