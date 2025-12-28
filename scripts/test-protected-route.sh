#!/bin/bash
# Script para ejecutar ProtectedRoute.test.tsx y verificar que termine limpiamente

set -e

cd "$(dirname "$0")/.."

echo "=== Iniciando test de ProtectedRoute ==="
echo "Comando: NODE_OPTIONS='--max-old-space-size=8192' ./node_modules/.bin/vitest run src/components/navigation/__tests__/ProtectedRoute.test.tsx --pool=threads --no-file-parallelism --maxWorkers=1 --reporter=verbose"
echo ""

START_TIME=$(date +%s)

# Ejecutar test con timeout de 60 segundos
timeout 60 bash -c "
  NODE_OPTIONS='--max-old-space-size=8192' ./node_modules/.bin/vitest run src/components/navigation/__tests__/ProtectedRoute.test.tsx --pool=threads --no-file-parallelism --maxWorkers=1 --reporter=verbose 2>&1
" &
TEST_PID=$!

# Esperar a que termine o timeout
wait $TEST_PID
EXIT_CODE=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=== Test finalizado ==="
echo "Código de salida: $EXIT_CODE"
echo "Duración: ${DURATION}s"

if [ $EXIT_CODE -eq 124 ]; then
  echo "❌ ERROR: Test se colgó (timeout de 60s)"
  exit 1
elif [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Test completado exitosamente"
  exit 0
else
  echo "❌ ERROR: Test falló con código $EXIT_CODE"
  exit $EXIT_CODE
fi


