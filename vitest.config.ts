import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  define: {
    'process.env.AIDUX_ENABLE_FIREBASE': JSON.stringify('0'),
    'import.meta.env.VITE_ENABLE_FIREBASE': JSON.stringify('0')
  },
test: {
    testTimeout: 20000,
    hookTimeout: 30000,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text','lcov','cobertura'],
      reportsDirectory: './coverage',
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
      exclude: ['**/*.spec.*','**/*.test.*','test/**','node_modules/**']
    },
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts", 'test/setupTests.ts'],
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
      '@/featureFlags/notes': '/test/stubs/featureFlags.notes.stub.ts',
      '@/core/notes/notesRepo': '/test/stubs/notesRepo.stub.ts',
      'src/featureFlags/firebase': '/test/stubs/firebaseEnabled.stub.ts',
      'src/lib/isFirebaseEnabled': '/test/stubs/firebaseEnabled.stub.ts',
      '@/lib/firebase.alias': '/test/stubs/firebaseEnabled.stub.ts',
      '@/featureFlags/firebase': '/test/stubs/firebaseEnabled.stub.ts',
      '@/lib/firebaseEnabled': '/test/stubs/firebaseEnabled.stub.ts',
      '@/lib/isFirebaseEnabled': '/test/stubs/firebaseEnabled.stub.ts',
      '/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2/src/lib/firebase.ts': '/test/stubs/firebase.stub.ts',
      'src/lib/firebase': '/test/stubs/firebase.stub.ts',
      '@/lib/firebase': '/test/stubs/firebase.stub.ts',
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