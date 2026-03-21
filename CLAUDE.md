# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AiDuxCare V2 is an AI-powered clinical documentation platform for healthcare professionals (primarily physiotherapists). It handles audio capture, SOAP note generation via Claude API, patient consent management, and PHIPA/PIPEDA compliance for Canada and Spain markets.

## Commands

```bash
# Development
npm run dev                  # Start dev server on port 5174
npm run dev:https            # Start with HTTPS (for mobile/audio testing)
npm run dev:test             # Copy test env and start dev server

# Build
npm run build                # Production build
npm run build:ci             # CI build with typecheck
npm run typecheck            # TypeScript type checking only

# Lint
npm run lint                 # ESLint all files
npm run lint:prod            # Strict lint (0 warnings allowed — used pre-deploy)
npm run lint:fix             # Auto-fix layout/suggestion issues

# Tests — run a single file
npm run test -- path/to/file.test.ts
npm run test:lowmem:file path/to/file.test.ts   # For heavy/memory-intensive tests

# Test suites
npm run test:gate            # Pre-commit gate (smoke + ProtectedRoute + CryptoService)
npm run test:stable          # Single-worker, memory-safe run for all tests
npm run test:baseline-backend # Clinical baseline service integration tests
npm run test:smoke:pilot     # Pilot market smoke tests
npm run test:e2e             # Playwright E2E tests
npm run test:e2e:local       # E2E with Firebase emulators

# Firebase emulators
npm run emulators:start
npm run emulators:stop

# Pre-deploy verification
npm run verify:deploy        # lint:prod + typecheck + build + e2e
```

Node version is pinned to `>=20.19 <21` via volta. Package manager is **pnpm** (CI uses npm).

## Architecture

### Directory Structure

```
src/
├── core/           # Domain logic, grouped by concern
│   ├── ai/         # Claude API integration, prompt engineering
│   ├── audio-pipeline/  # Audio capture, STT, retry logic
│   ├── clinical/   # Clinical domain models and logic
│   ├── soap/       # SOAP note generation
│   ├── firebase/   # Firebase client setup
│   ├── consent/    # Consent management
│   ├── audit/      # Audit logging (PHIPA compliance)
│   ├── mcp/        # Model Context Protocol integration
│   ├── pilotDetection.ts  # Spain vs. Canada market flags
│   └── ...
├── features/       # Self-contained feature modules
│   ├── command-center/   # Main clinical workspace (CommandCenterPageSprint3)
│   ├── patient-dashboard/
│   ├── auth/
│   └── ...
├── services/       # Business logic services (bridge between features and core)
├── pages/          # Route-level page components
├── components/     # Shared UI components
├── context/        # React Context providers (Auth, ProfessionalProfile, Session)
├── stores/         # Zustand stores (offline mode, pending uploads, transcriptions)
├── hooks/          # Custom React hooks
├── i18n/           # i18next translations (EN/ES/FR)
├── router/         # React Router config (router.tsx)
└── types/          # Global TypeScript types
```

### State Management

Three layers, each with distinct responsibility:

1. **React Context** (`src/context/`) — critical synchronous state:
   - `AuthContext`: Firebase user identity
   - `ProfessionalProfileContext`: Healthcare provider credentials/specialty
   - `SessionContext`: Active patient session
2. **Zustand stores** (`src/stores/`) — optional/offline state: pending uploads, local transcriptions, offline mode flag
3. **React Hook Form** — all form state

### Routing

`src/router/router.tsx` uses `createBrowserRouter`. Key route groups:
- `/` → `UnifiedLandingPage`
- `/login`, `/register`, `/forgot-password` → auth pages (no guard)
- `/command-center` → `CommandCenterPageSprint3` wrapped in `AuthGuard`
- `/professional-workflow` → main clinical flow
- `/consent-verification`, `/patient-consent-portal` → patient-facing consent flows
- All authenticated routes wrap children in `LayoutWrapper` which renders the persistent logout button

### Multi-Market (Pilot) System

`src/core/pilotDetection.ts` exports `isSpainPilot` flag. Feature gating for Spain vs. Canada is done throughout the app using this flag. The `typecheck:pilot` script validates the Spain-pilot TypeScript config separately.

### Compliance Architecture

PHIPA/PIPEDA compliance is structural, not bolted-on:
- Audit logging in `src/core/audit/` is triggered on all sensitive operations
- Consent must be verified before audio capture can start
- Cross-border AI data handling requires explicit consent flags
- Tests **must use real Firebase** (not mocks) per compliance requirement — mock-based auth tests are not acceptable

### Audio & AI Pipeline

Audio flow: `AudioCapture → audio-pipeline (retry/error classification) → STT (local or cloud) → SOAP generation via Claude API`

SOAP generation in `src/core/soap/` uses `src/core/ai/` which wraps the Anthropic SDK. Prompts live in `src/core/prompts/`. The pipeline includes latency tracking, error classification, and offline fallback via Zustand.

### Test Configuration

- Default runner: Vitest with jsdom
- For memory-intensive tests use `test:stable` or `test:lowmem:file`
- Vitest isolation is **disabled** (tests share state for performance)
- Test timeout: 10s for tests/hooks, 5s for teardown
- Firebase is initialized for real in tests — emulator env vars enable local runs
- Quarantined/deprecated tests live in `_deprecated`, `_experimental`, `_quarantine` dirs and are excluded from CI

### Path Aliases

`@/` maps to `src/` (configured in Vite and TypeScript). Use `@/core/...`, `@/features/...` etc. for imports.
