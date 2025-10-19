#!/bin/bash

echo "🚀 INICIANDO SERVIDOR UAT OPTIMIZADO"
echo "====================================="
echo "🌐 URL: http://localhost:5173"
echo "🏗️  Entorno: UAT DEV (aiduxcare-v2-uat-dev)"
echo "🔧 Configuración: vite.config.uat.ts"
echo ""

# Limpiar cache de Vite
echo "🧹 Limpiando cache de Vite..."
rm -rf node_modules/.vite 2>/dev/null || true

# Verificar configuración
echo "✅ Configuración UAT verificada:"
echo "   VITE_ENV_TARGET: $(grep VITE_ENV_TARGET .env.local | cut -d'=' -f2)"
echo "   VITE_FIREBASE_PROJECT_ID: $(grep VITE_FIREBASE_PROJECT_ID .env.local | cut -d'=' -f2)"
echo ""

# Iniciar servidor optimizado
echo "🎯 Iniciando servidor con configuración optimizada..."
echo "   - Archivos BP/ ignorados"
echo "   - Archivos reports/ ignorados"
echo "   - Archivos docs/ ignorados"
echo "   - Solo cambios en src/ monitoreados"
echo ""

npx vite --config vite.config.uat.ts
