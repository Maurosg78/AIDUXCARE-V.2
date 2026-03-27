# ADR-0002: Enforce direct writes through the persistence facade

- **Date:** 2026-03-27
- **Status:** Accepted
- **Context**
  The codebase has accumulated direct Firestore and Supabase write calls across multiple UI and service files. That makes auditability, invariants, retries, encryption, and future storage migrations harder to control. The immediate need is not to refactor all legacy writers at once, but to stop the problem from growing.

- **Decision**
  New direct datastore write calls in application runtime code must go through an approved persistence facade. CI will fail pull requests that add direct write primitives outside the allowlisted facade files.

  Initial enforcement scope:
  - Runtime app code under `src/**/*.{js,jsx,ts,tsx}`
  - Excludes tests (`__tests__`, `*.test.*`, `*.spec.*`)
  - Detects newly added direct write calls in PR diff only
  - Blocks direct Firestore writes such as `setDoc`, `addDoc`, `updateDoc`, `deleteDoc`, `writeBatch`, `runTransaction`
  - Blocks direct Supabase writes such as `.insert()`, `.update()`, `.upsert()`, `.delete()`
  - Allows writes only in the facade files declared in `.github/direct-write-facade-allowlist.json`
  - Changes to `.github/direct-write-facade-allowlist.json` require an ADR update in the same PR and architecture owner review

- **Consequences**
  - (+) Prevents further architectural drift without forcing a big-bang migration.
  - (+) Makes write-path review explicit and enforceable in PRs.
  - (+) Centralizes retries, encryption, validation, and audit hooks behind a smaller surface.
  - (-) Legacy direct writers remain until migrated; this ADR only freezes net-new spread.
  - (-) The allowlist becomes a governance artifact and must be updated deliberately when the facade evolves.
  - Follow-up: migrate existing direct writers into the facade in bounded batches, then tighten CI from diff-based enforcement to full-tree enforcement.
  - Phase 2 target: 2026-06-30, with domain-by-domain full-tree enforcement once high-volume legacy writers have been migrated.

- **Alternatives Considered**
  Full-repo blocking now: strongest purity, but unrealistic given current legacy footprint.
  Review guideline only: low effort, but non-enforceable and easy to bypass under delivery pressure.
  ESLint custom rule first: viable later, but a diff-based CI script is faster to land and easier to tune against current debt.

- **Links**
  - Docs: `/.github/direct-write-facade-allowlist.json`
  - Docs: `/docs/adr/README.md`
  - Runbook: `/docs/operations/BRANCH_PROTECTION_WRITE_FACADE_RUNBOOK.md`
  - Owner: `@Maurosg78`, `@AIDUXCARE`
