#!/bin/bash

# ✅ DÍA 3: Transparency Report UI - Test Suite
# Ejecuta todos los tests de DÍA 3

echo "🧪 Ejecutando suite de tests DÍA 3: Transparency Report UI..."
echo ""

npm run test:run -- \
  src/components/transparency/__tests__/DataSovereigntyBadge.test.tsx \
  src/components/transparency/__tests__/TransparencyReport.test.tsx \
  test/compliance/transparency-report.test.tsx \
  --reporter=verbose

echo ""
echo "✅ Tests DÍA 3 completados"

