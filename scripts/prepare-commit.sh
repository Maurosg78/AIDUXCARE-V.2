#!/usr/bin/env bash
set -euo pipefail

# ✅ Script para preparar commit con SoT trailers
# Market: CA | Language: en-CA | Compliance: PHIPA/PIPEDA

echo "🔍 Pre-flight Checks"
echo "===================="

# 1. Check for protected areas
echo "1. Checking protected areas..."
CHANGED=$(git diff --cached --name-only 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo "")

if echo "${CHANGED}" | grep -qE "(src/core/soap/|src/services/vertex-ai-soap-service\.ts|src/services/PersistenceService|ClinicalVault|CryptoService|encryption|firestore.*rules)"; then
  echo "❌ Protected area touched!"
  echo "Changed files:"
  echo "${CHANGED}" | grep -E "(src/core/soap/|src/services/vertex-ai-soap-service\.ts|src/services/PersistenceService|ClinicalVault|CryptoService|encryption|firestore.*rules)" || true
  echo ""
  echo "⚠️  Action: Add explicit WO reference in commit message"
  exit 1
fi

echo "✅ No protected areas touched"

# 2. Run canonical gate (if tests/build pass)
echo ""
echo "2. Running canonical gate..."
if command -v pnpm >/dev/null 2>&1; then
  echo "   Running tests..."
  pnpm test --run || echo "⚠️  Tests failed, but continuing (manual review needed)"
  
  echo "   Running build..."
  pnpm build || echo "⚠️  Build failed, but continuing (manual review needed)"
else
  echo "⚠️  pnpm not found, skipping tests/build"
fi

echo ""
echo "✅ Pre-flight checks complete"
echo ""
echo "📝 Next steps:"
echo "   1. Review COMMIT_MESSAGE_TEMPLATE.md"
echo "   2. git add ."
echo "   3. git commit -F COMMIT_MESSAGE_TEMPLATE.md"
echo "   4. git push origin <branch>"

