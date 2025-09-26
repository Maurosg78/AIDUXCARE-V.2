# Architecture Decision Records (ADR)

Lightweight records of consequential decisions. One file per decision.

## How to use
1. Copy `0000-template.md` into a numbered file (e.g. `0001-typescript-strict.md`).
2. Fill the sections, link related PR/issue.
3. Reference this ADR in your PR body and commit messages.

## Index
<!-- Add entries as they merge -->
<!-- Example:
- ADR-0001: Enable TypeScript strict mode — 2025-09-25 (status: Accepted)
-->

## Pre-push (bypass para cambios meta)
- Si el cambio incluye **solo** archivos dentro de `docs/adr/**` o el `.gitignore`,
  el hook **pre-push** omite TypeScript y ESLint.
- Para cualquier cambio de **código de app**, el pre-push ejecuta TS/Lint y bloquea si fallan.
