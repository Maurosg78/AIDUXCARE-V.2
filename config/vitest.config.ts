import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    reporters: ['default'],
    coverage: { reporter: ['text', 'lcov'] },
    pool: 'threads', // <– default
    poolOptions: {
      threads: {
        singleThread: true, // fuerza ejecución sin workers
      },
    },
  },
})

