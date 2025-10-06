# AiduxCare — Code Standards
**Market:** CA · **Language:** en-CA

## General
- TypeScript strict mode ON
- ESLint: strict local / relaxed CI
- No `any` or implicit `:string` types
- Components pure and typed

## UI
- en-CA copy only
- Role-based aria attributes (`button`, `status`, `alert`)
- Tailwind + shadcn/ui only

## Testing
- Unit: vitest + React Testing Library
- Compliance: CI must run `test/compliance/**`
- No skipped tests in main

## Commits
- Conventional commits
- Must include:  
Market: CA
Language: en-CA
COMPLIANCE_CHECKED
Signed-off-by: ROADMAP_READ

