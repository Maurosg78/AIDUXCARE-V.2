import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    },
    // Optimizar resolución de dependencias de Firebase
    dedupe: ['@firebase/util']
  },
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    port: 5174,
    host: true,
    strictPort: false,
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/.vite/**",
        "**/backups/**",
        "**/canonical_snapshots/**",
        "**/docs/**",
        "**/test/**",
        "**/tests/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/scripts/**",
        "**/.github/**",
        "**/functions/**",
        "**/emulator-data/**",
        "**/coverage/**",
      ],
      usePolling: false,
    },
    hmr: {
      overlay: true,
      // Forzar recarga completa en cambios de módulos críticos
      fullReload: true,
    },
    // Deshabilitar caché del servidor para desarrollo
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
    ],
    // No excluir @firebase/util - dejar que Vite lo optimice automáticamente
    // Forzar re-optimización cuando cambien los módulos
    force: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
  if (id.includes("node_modules")) {
    if (id.includes("firebase")) return "vendor-firebase";
    if (id.includes("react-router")) return "vendor-react-router";
    if (id.includes("react")) return "vendor-react";
    if (id.includes("dompurify") || id.includes("html2canvas")) return "vendor-utils";
    if (id.includes("jspdf") || id.includes("html2pdf")) return "vendor-pdf";
    return "vendor";
  }
},
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Mejorar manejo de errores en módulos dinámicos
    dynamicImportVarsOptions: {
      warnOnError: false,
    },
  },
  // Copiar archivos públicos (incluyendo sw.js)
  publicDir: 'public',
});

