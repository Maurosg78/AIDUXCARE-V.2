import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  server: { port: 5174, strictPort: true },
  plugins: [react()],
  optimizeDeps: { include: ["react", "react-dom"] },
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
