# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
AiDuxCare V2 is a PHIPA/PIPEDA-compliant healthcare documentation SPA (React 18 + Vite + Firebase). See `docs/PROJECT_HANDBOOK.md` for full details.

### Node.js version
Requires Node.js **20.19.x** (pinned in `.nvmrc` as `20.19.3`). Use `nvm use` or install via nvm.

### Package management
- Root: **pnpm** (`pnpm-lock.yaml`). Run `pnpm install` to install.
- `functions/`: uses **npm** (`package-lock.json`). Run `cd functions && npm install` if working on Cloud Functions.
- The `pnpm.onlyBuiltDependencies` field in `package.json` whitelists build scripts for `esbuild`, `@swc/core`, `protobufjs`, `core-js`, and `@firebase/util` so `pnpm install` runs non-interactively.

### Environment variables
A `.env.local` file is required at the repo root. The `postinstall` hook runs `scripts/check-env.cjs` which validates `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_API_KEY` are set. Copy from `config/env/.env.local.template` and fill in real values, or use placeholder values for UI-only local dev.

### Key commands
| Action | Command |
|--------|---------|
| Dev server | `pnpm dev` (Vite on port 5174) |
| Lint | `pnpm lint` |
| Unit tests | `pnpm test` (Vitest) |
| Smoke test | `pnpm vitest run src/__tests__/smoke.test.ts` |
| Build | `pnpm build` |
| E2E tests | `pnpm test:e2e` (Playwright - requires browsers installed) |

### Caveats
- The `typecheck` script is intentionally stubbed out (`echo '...'`), so `pnpm typecheck` is a no-op.
- ESLint config (`eslint.config.js`) uses ESLint 9 flat config and requires `@eslint/js` as a dev dependency. If lint fails with `Cannot find package '@eslint/js'`, run `pnpm add -D @eslint/js@9`.
- Some unit tests (20 of 101 test files) have pre-existing failures related to locale JSON parsing and test expectation drift. The smoke test (`src/__tests__/smoke.test.ts`) and gate tests (`pnpm test:gate`) are the stable test targets.
- Git hooks (`.husky/`) are disabled (exit 0) for solo development.
- Full auth/login flow requires real Firebase credentials in `.env.local`. With placeholder values, the app loads and renders fully but login attempts return a credential error. The Firebase project is `aiduxcare-v2-uat-dev`; configuration values are available in `config/env/.env.local.template`.
