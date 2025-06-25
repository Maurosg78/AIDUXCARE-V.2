#!/bin/bash

echo "🧪 Iniciando diagnóstico completo de warnings..."

# Crear carpeta logs si no existe
mkdir -p logs

# 1. ESLint
echo "🔍 Ejecutando ESLint..."
npx eslint src/**/*.ts src/**/*.tsx --max-warnings=999 --quiet > logs/warnings-eslint.log || echo "✔ ESLint terminado con advertencias."

# 2. TypeScript
echo "🧠 Ejecutando verificación de tipos TypeScript..."
npx tsc --noEmit --pretty false > logs/warnings-tsc.log || echo "✔ TSC terminado con advertencias."

# 3. Vite build
echo "⚙️ Ejecutando build con Vite..."
npm run build > logs/warnings-build.log || echo "✔ Build terminado con advertencias."

# 4. Resumen
echo -e "\n✅ Diagnóstico completo guardado en carpeta ./logs/"
echo "📄 Archivos generados:"
echo " - logs/warnings-eslint.log"
echo " - logs/warnings-tsc.log"
echo " - logs/warnings-build.log"

