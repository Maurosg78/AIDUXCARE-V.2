import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts"],
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.quarantine',
      'legacy',
      'QUARANTINE_*',
      'src/**/*.test.{js,ts,jsx,tsx}',
      'src/**/*.spec.{js,ts,jsx,tsx}',
      'tests/**/*',
      '__tests__/**/*'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/integrations/firebase": path.resolve(
        __dirname,
        process.env.AIDUX_ENABLE_FIREBASE === "1"
          ? "src/integrations/firebase/real.ts"
          : "src/integrations/firebase/stub.ts"
      ),
    },
  },
});
