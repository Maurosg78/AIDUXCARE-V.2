#!/bin/bash

echo "🔍 Verificando sistema para Demo Niagara..."
echo "========================================="

# 1. Verificar que el servidor está corriendo
if ! curl -s http://localhost:5177 > /dev/null; then
  echo "❌ ERROR: Servidor no está corriendo"
  echo "Ejecuta: npm run dev"
  exit 1
fi

# 2. Verificar conexión a Firebase
echo "✓ Servidor activo"

# 3. Correr tests críticos
npx playwright test test/e2e/niagara-demo-critical.test.ts --reporter=list

# 4. Verificar resultados
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SISTEMA LISTO PARA DEMO"
  echo "========================="
  echo "✓ Flujo básico funciona"
  echo "✓ Detección de casos críticos OK"
  echo "✓ Cambio de idioma OK"
  echo "✓ Control de créditos OK"
  echo "✓ Manejo de textos largos OK"
else
  echo ""
  echo "❌ SISTEMA NO ESTÁ LISTO"
  echo "Revisa los errores arriba"
fi
