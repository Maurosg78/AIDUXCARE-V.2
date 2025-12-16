#!/bin/bash
# Script para ejecutar tests de compliance DÍA 1-2
# Evita problemas con PostCSS/Tailwind

echo "🧪 Ejecutando Tests de Compliance DÍA 1-2"
echo ""

# Configurar NODE_ENV para evitar carga de PostCSS
export NODE_ENV=test

# Ejecutar tests con configuración mínima
npx vitest run test/compliance/compliance-logic.test.ts --config vitest.config.ts 2>&1 | grep -A 200 -E "(PASS|FAIL|Test Files|✓|✗)" || true

echo ""
echo "✅ Tests completados"

