# CANONICAL GATE v1 (Single-Engineer Phase)

Market: CA  
Language: en-CA

## Why
We do NOT simulate third-party approvals. A PR is mergeable if it passes objective, automated gates.

## Definition: "Gate passed"
A PR is considered mergeable when:
- pnpm test ✅
- pnpm build ✅
- no protected areas modified (or explicit WO reference provided)

## Protected areas
Changes touching these require explicit WO reference in PR body and commit:
- src/core/soap/**
- src/services/vertex-ai-soap-service.ts
- src/services/PersistenceService*
- ClinicalVault schema-related files
- Crypto/encryption services
- Firestore rules (if applicable)

## How to run locally
./scripts/canonical-gate.sh

You may override base branch:
BASE_BRANCH=origin/canon/aidux-baseline-2025-12-15 ./scripts/canonical-gate.sh

## PR checklist
- Gate passed ✅
- Market / Language trailers included ✅
- If protected areas touched: WO referenced ✅

## GitHub settings (manual)
In repo settings:
- Do NOT require human approvals (temporary)
- Require status checks: test, build

