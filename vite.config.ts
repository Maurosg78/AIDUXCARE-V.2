import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    react({
      // Configuración SWC enterprise para evitar colgues
      swcOptions: {
        jsc: {
          target: 'es2020',
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
              development: false,
              refresh: false,
            },
          },
        },
        minify: false, // Deshabilitar minificación durante build para evitar colgues
      },
    }),
  ],
  
  // Configuración build enterprise MVP
  build: {
    target: 'es2020',
    minify: 'esbuild', // Usar esbuild en lugar de SWC para minificación
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    chunkSizeWarningLimit: 2000, // Aumentar límite para proyectos grandes
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  
  // Optimizaciones enterprise
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
  
  // Configuración TypeScript enterprise (sin build mode)
  esbuild: {
    target: 'es2020',
    supported: {
      'top-level-await': true
    }
  },
  
  // Configuración de desarrollo
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    hmr: { host: 'localhost', protocol: 'ws', port: 5175 },
  },
  
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  
  // Configuración de tests (mantener existente)
  test: {
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".{git,github}/**",
      "tests/e2e/**",
      "**/*emu*.spec.{ts,tsx}",
      "**/__snapshots__/**",
    ],
    environment: "jsdom",
    setupFiles: ["tests/setup/globals.ts"],
    globals: true,
    passWithNoTests: false,
  },
});
