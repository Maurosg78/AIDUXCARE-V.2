#!/bin/bash

echo "🔍 DEBUG LINT - Verificando configuración ESLint"
echo "================================================"

echo "1. Node.js version:"
node --version

echo "2. npm version:"
npm --version

echo "3. ESLint version:"
npx eslint --version

echo "4. Verificando archivo supabaseClient.ts:"
npx eslint src/core/auth/supabaseClient.ts --format=compact

echo "5. Verificando configuración ESLint:"
npx eslint --print-config src/core/auth/supabaseClient.ts | head -20

echo "6. Ejecutando lint completo:"
npm run lint

echo "7. Verificando TypeScript:"
npx tsc --noEmit

echo "✅ Debug completado" 