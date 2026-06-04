// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const appVersion = process.env.npm_package_version || "0.1.0";
const buildId = `${appVersion}-${new Date().toISOString()}`;

export default defineConfig({
  define: {
    __AIDUX_APP_VERSION__: JSON.stringify(appVersion),
    __AIDUX_BUILD_ID__: JSON.stringify(buildId),
  },
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
    {
      name: "aidux-build-meta",
      transformIndexHtml(html) {
        return html.replace(
          "<head>",
          `<head>\n    <meta name="aidux-app-version" content="${appVersion}" />\n    <meta name="aidux-build-id" content="${buildId}" />`
        );
      },
    },
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
    proxy: {
      "/vertexAIProxy": {
        target: "https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net",
        changeOrigin: true,
        secure: true,
      },
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
      "pdfjs-dist",  // ✅ Resolve dynamic import in pdfTextExtractor.ts (build + dev)
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
