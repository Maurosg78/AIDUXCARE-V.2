#!/bin/bash

echo "🚀 INICIANDO SERVIDOR UAT ULTRA-OPTIMIZADO"
echo "============================================"
echo "🌐 URL: http://localhost:5173"
echo "🏗️  Entorno: UAT DEV (aiduxcare-v2-uat-dev)"
echo "🔧 Configuración: vite.config.uat.ts (ULTRA-OPTIMIZADA)"
echo ""

# Limpiar cache de Vite COMPLETAMENTE
echo "🧹 LIMPIEZA COMPLETA DE CACHE:"
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true
echo "✅ Cache completamente limpiado"

# Verificar configuración
echo ""
echo "✅ CONFIGURACIÓN UAT VERIFICADA:"
echo "   VITE_ENV_TARGET: $(grep VITE_ENV_TARGET .env.local | cut -d'=' -f2)"
echo "   VITE_FIREBASE_PROJECT_ID: $(grep VITE_FIREBASE_PROJECT_ID .env.local | cut -d'=' -f2)"
echo ""

# Crear directorio temporal para archivos ignorados
echo "📁 CREANDO ESTRUCTURA TEMPORAL:"
mkdir -p .vite-ignore 2>/dev/null || true
echo "✅ Directorio temporal creado"

echo ""
echo "🎯 INICIANDO SERVIDOR ULTRA-OPTIMIZADO:"
echo "   - SOLO cambios en src/ monitoreados"
echo "   - TODOS los demás archivos IGNORADOS"
echo "   - Sin reinicios por tests, configs, docs, etc."
echo "   - Solo HMR para componentes React"
echo ""

# Iniciar servidor con configuración ultra-optimizada
npx vite --config vite.config.uat.ts --force
