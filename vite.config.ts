import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Carga de .env.* si la necesitas en runtime
  loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    resolve: {
      // Asegura resolución para navegador en dev
      conditions: ["browser", "development"],
      // Blindajes + alias del proyecto
      alias: [
        // 🔒 Evita imports incorrectos como "react/index.js" o "/node_modules/react/index.js"
        { find: /^react\/index\.js$/, replacement: "react" },
        { find: /^\/?node_modules\/react\/index\.js$/, replacement: "react" },

        // Alias de tu código
        { find: "@", replacement: path.resolve(__dirname, "src") },
        {
          find: "@/integrations/firebase",
          replacement: path.resolve(__dirname, "src/integrations/firebase/firebase.ts"),
        },
      ],
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
    },

    server: {
      host: "localhost",
      port: 5177,
      hmr: { protocol: "ws", host: "localhost", port: 5177 },
    },

    preview: {
      host: "localhost",
      port: 5177,
    },

    // Fuerza el pre-empaquetado correcto de React en dev
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
      // En Vite 7 no se usa `disabled`; si hiciera falta minimizar descubrimiento:
      // noDiscovery: true,
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
