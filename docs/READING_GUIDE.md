---
Document: Guide
---

# AiduxCare — Reading Guide
Start here. This is the map of the repo and the “where to touch / where not to touch” guide.

## 1) Start here
- **Aidux North (Canada SoT):** `docs/north/READING_GUIDE.md`
- High-level docs index: `docs/README.md` (if present/kept)
- Architecture references (blueprints): `docs/blueprints/README.md` (if present)

## 2) What this repo does (one paragraph)
Clinical workflow (web/MVP): audio/text intake → analysis → suggested tests → SOAP note → save/export → Clinical Vault (Firestore).

## 3) Core runtime entrypoints
- App bootstrap: `src/main*.tsx`
- Routing: `src/router/router.tsx`
- Orchestration & prompts: `src/orchestration/**`
- Validation schemas: `src/validation/**`
- Audit / logging: `src/core/audit/**` and `docs/audit-trail/**`

## 4) Where to touch / where NOT to touch
### Safe to touch (day-to-day)
- UI pages/components: `src/pages/**`, `src/components/**`, `src/shared/**`
- Prompt shaping and schemas: `src/orchestration/prompts/**`, `src/validation/**`
- Non-breaking logging improvements (DEV-only): `src/core/**` (with care)

### High-risk / do not change casually
- Source of Truth: `docs/north/SOURCE_OF_TRUTH.md` (and SoT-related docs)
- Security / audit trail primitives: `src/core/audit/**`, `docs/audit-trail/**`
- Backend rules/indexes: `firestore.rules`, `firestore.indexes.json`, `firebase.json`
- Auth and encryption primitives (anything under `src/core/**` that touches PHI)

## 5) How we define “Done” (Canon baseline)
- Runs locally: `pnpm -s lint` and `pnpm -s build`
- Fixes are documented (short notes in docs if needed)
- Small commits with clear intent; no feature creep

## 6) Parking lot
Performance/chunking, CSS minify warnings, router v7 future flags, manualChunks tuning.
