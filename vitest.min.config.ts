/// <reference types="node" />
import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM-compatible __dirname
const __filename = fileURLToPath(typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : `file://${process.cwd()}/vitest.min.config.ts`);
const __dirname = dirname(__filename);

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@/shared/utils/logger": path.resolve(__dirname, "./src/test/mocks/logger.ts"),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/components/navigation/__tests__/ProtectedRoute.test.tsx'],
        globals: false,
        isolate: false,
    },
})

