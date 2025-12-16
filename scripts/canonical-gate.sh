#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-origin/canon/aidux-baseline-2025-12-15}"

echo "🔍 Canonical Gate v1"
echo "Base: ${BASE_BRANCH}"

echo "1) Tests"
pnpm -s test

echo "2) Build"
pnpm -s build

echo "3) Protected areas check"
# Try to get changed files, fallback to current branch if base doesn't exist
if git rev-parse --verify "${BASE_BRANCH}" >/dev/null 2>&1; then
  CHANGED="$(git diff --name-only "${BASE_BRANCH}"...HEAD 2>/dev/null || git diff --name-only HEAD || echo "")"
else
  echo "⚠️  Base branch ${BASE_BRANCH} not found locally, checking current changes"
  CHANGED="$(git diff --name-only HEAD || echo "")"
fi

# Patterns: tweak cautiously
if echo "${CHANGED}" | rg -n "(^src/core/soap/|^src/services/vertex-ai-soap-service\.ts$|^src/services/PersistenceService|ClinicalVault|CryptoService|encryption|firestore.*rules)" >/dev/null 2>&1; then
  echo "❌ Protected area touched."
  echo "Changed files:"
  echo "${CHANGED}" | rg -n "(^src/core/soap/|^src/services/vertex-ai-soap-service\.ts$|^src/services/PersistenceService|ClinicalVault|CryptoService|encryption|firestore.*rules)" || true
  echo ""
  echo "Action: Add explicit WO reference in PR + commit, or split changes."
  exit 1
fi

echo "✅ Gate passed — PR can be merged (single-engineer phase)."

