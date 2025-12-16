# Contributing Guide

**Language:** English for *all* code, documentation, PR titles/bodies, commits.  
**Source of truth:** The Project Handbook → [`/docs/PROJECT_HANDBOOK.md`](docs/PROJECT_HANDBOOK.md).

## Branching & commits
- Branch: `area/short-purpose` (e.g., `feat/soap-validation`, `fix/ui-regression`).
- Commits: conventional style (e.g., `feat:`, `fix:`, `docs:`).
- Keep messages in **English** and scoped.

## Pull Requests
- Use the PR template.
- Link to specific doc sections (deep-link): e.g. `docs/processes/RELEASE_PROCESS.md#release-checklist`.
- Include a short **“Why”** and **“How”**.
- CI must pass. Docs-only PRs are allowed and **should not** fail code checks.

## Reviews & CODEOWNERS
- Follow `/CODEOWNERS`. Seek the listed owners for paths you modify.
- Two kinds of approvals:
  - **Technical** (owners of `/src/**`),
  - **Documentation/Process** (owners of `/docs/**`).

## Releases
- Tag semantic baselines (e.g., `v0.1.0`).
- Reference a tag when you need an immutable doc link (e.g., `blob/v0.1.0/...`).

## Python legacy tests
- Anything under `tests/_legacy_python` is **not** part of the Node/TS suite.
- Do not re-enable in CI unless an explicit RFC is approved.

## Security
- See `SECURITY.md` for reporting vulnerabilities and handling secrets.
