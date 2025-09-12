import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    resolve: {
      conditions: ["browser", "development"],
      alias: [
        { find: /^react\/index\.js$/, replacement: "react" },
        { find: /^\/?node_modules\/react\/index\.js$/, replacement: "react" },
        { find: "@", replacement: path.resolve(__dirname, "src") },
        {
          find: "@/integrations/firebase",
          replacement: path.resolve(__dirname, "src/integrations/firebase/firebase.ts"),
        },
      ],
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
    },

    server: {
      proxy: {
        '/api/vertexAIProxy': {
          target: 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => '/vertexAIProxy',
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxy request to:', proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Proxy response:', proxyRes.statusCode);
            });
          }
        },
        '/api/clinicalBrain': {
          target: 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace('/api', '')
        }
      },
      host: "localhost",
      port: 5177,
      hmr: { protocol: "ws", host: "localhost", port: 5177 },
    },

    preview: {
      host: "localhost",
      port: 5177,
    },

    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },

    build: {
      target: "es2020",
      modulePreload: { polyfill: true },
      sourcemap: false,
      outDir: "dist",
      assetsDir: "assets",
    },
  };
});
