#!/bin/bash
# Script para hacer build y deploy con la configuración corregida

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 Verificando configuración..."
echo ""

# Verificar que firebase.json tiene hosting configurado
if grep -q '"hosting"' firebase.json; then
    echo "✅ Firebase Hosting configurado"
else
    echo "❌ ERROR: Firebase Hosting no configurado"
    exit 1
fi

# Verificar que vite.config.ts tiene build configurado
if grep -q '"build"' vite.config.ts; then
    echo "✅ Vite build configurado"
else
    echo "❌ ERROR: Vite build no configurado"
    exit 1
fi

echo ""
echo "🔨 Haciendo build..."
node node_modules/vite/bin/vite.js build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completado exitosamente"
    echo ""
    echo "📦 Verificando archivos generados..."
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        echo "✅ dist/index.html existe"
        echo "✅ Listo para deploy"
        echo ""
        echo "🚀 Para hacer deploy ejecuta:"
        echo "   firebase deploy --only hosting"
    else
        echo "❌ ERROR: dist/index.html no encontrado"
        exit 1
    fi
else
    echo "❌ ERROR: Build falló"
    exit 1
fi

