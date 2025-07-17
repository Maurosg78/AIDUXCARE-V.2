#!/bin/bash

echo "🚀 Ejecutando test de backend..."
echo "📅 $(date)"
echo ""

# Ejecutar el test y guardar la salida
npx tsx backend-pipeline-test.ts > backend-output.log 2>&1

# Mostrar la salida
cat backend-output.log

echo ""
echo "📁 Log guardado en: backend-output.log" 