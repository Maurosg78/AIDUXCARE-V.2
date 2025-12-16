#!/bin/bash

# Script rápido de deploy sin linting (evita cuelgues)
# Ejecuta solo build y deploy

set -e

PROJECT_ID="${FIREBASE_PROJECT_ID:-aiduxcare-v2-uat-dev}"

echo "🚀 QUICK DEPLOY - SIN LINTING"
echo "=============================="
echo ""

# Verificar Firebase
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado"
    exit 1
fi

echo "✅ Firebase CLI: $(firebase --version)"
echo "✅ Proyecto: $PROJECT_ID"
firebase use "$PROJECT_ID" > /dev/null 2>&1 || firebase use "$PROJECT_ID"
echo ""

# Build
echo "📦 Ejecutando build..."
npm run build

# Verificar dist
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Build falló - dist/index.html no existe"
    exit 1
fi

echo "✅ Build completado"
echo "   Tamaño: $(du -sh dist | cut -f1)"
echo ""

# Deploy
echo "🚀 Desplegando a Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deploy completado!"
echo ""
echo "📋 URLs disponibles:"
echo "   - https://$PROJECT_ID.web.app"
echo "   - https://$PROJECT_ID.firebaseapp.com"
echo "   - https://aiduxcare.com (después de configurar DNS)"
echo ""


