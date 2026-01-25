// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react({
      jsxRuntime: "automatic",
      // fastRefresh: true, // ❌ no existe en @vitejs/plugin-react v4
    }),
  ],
  css: {
    postcss: "./postcss.config.cjs",
  },
  server: {
    port: 5174,
    host: true,
    allowedHosts: ["pilot.aiduxcare.com"],
    strictPort: false,
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/.pnpm-store/**",
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
      // fullReload: false, // ❌ no existe en Vite 5
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    fs: {
      strict: false,
      allow: [".."],
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
      "firebase/functions",  // ✅ CRITICAL: Include Functions SDK to prevent tree-shaking
    ],
    exclude: ["@firebase/util"],
    force: false,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: [
            "firebase/app", 
            "firebase/auth", 
            "firebase/firestore",
            "firebase/functions",  // ✅ CRITICAL: Include Functions SDK in bundle
          ],
          "react-router": ["react-router-dom"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    target: "es2020",
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    dynamicImportVarsOptions: {
      warnOnError: false,
    },
  },
  publicDir: "public",
});
