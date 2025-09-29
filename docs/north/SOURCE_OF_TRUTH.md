---
Market: CA
Language: en-CA
Document: SoT
---

# Aidux North — Source of Truth (en-CA)

**Market:** CA  
**Language (default):** en-CA

This SoT defines the canonical expectations for code, CI, configuration, and review.

## Tech & Repo
- Repo root: this repository.
- Default branch policy: follow repo settings; PRs must target `develop` unless stated otherwise.
- CI: `.github/workflows/ci.yml`.
- Compliance tests: `test/ci/compliance/cpo/CpoCompliance.spec.ts`.

## i18n
- Default locale must be **en-CA**.
- Spanish (ES) is optional **only behind feature flags**; never default.

## PR DoD
- PR title/body contains `Market: CA` and `Language: en-CA`.
- No Spanish as default (locales, i18n init, date libs).
- If Spain pilot is touched: feature-flagged and off by default.
- All CI gates green, including **CPO Compliance**.
- CODEOWNERS approval required where applicable.

## Notes
This document is the canonical reference. See `LIMITS.md` for boundaries and non-goals.
