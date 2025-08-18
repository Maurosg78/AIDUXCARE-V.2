#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Despliegue UAT - AiDuxCare V.2 Functions"

# Verificar que estamos en el proyecto correcto
PROJECT_ID=$(firebase use | grep "Active Project:" | awk '{print $3}')
if [ "$PROJECT_ID" != "aiduxcare-v2-uat-dev" ]; then
    echo "❌ Project ID incorrecto: $PROJECT_ID"
    echo "   Debe ser: aiduxcare-v2-uat-dev"
    exit 1
fi

echo "✅ Project ID correcto: $PROJECT_ID"

# Build functions
echo "🔨 Compilando functions..."
cd functions
npm run build
cd ..

# Verificar que el build fue exitoso
if [ ! -d "functions/lib" ]; then
    echo "❌ Build falló - directorio lib no existe"
    exit 1
fi

echo "✅ Build exitoso"

# Deploy
echo "🚀 Desplegando functions..."
firebase deploy --only functions --project aiduxcare-v2-uat-dev

echo "✅ Despliegue UAT completado"
echo "   Functions disponibles en: https://europe-west1-aiduxcare-v2-uat-dev.cloudfunctions.net/"
