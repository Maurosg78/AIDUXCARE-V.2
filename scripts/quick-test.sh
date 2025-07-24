#!/bin/bash

echo "🎯 AiDuxCare - Verificación Rápida del Sistema"
echo "=============================================="
echo ""

# Verificar emuladores Firebase
echo "1️⃣ Verificando Emuladores Firebase..."

AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9099)
FIRESTORE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

if [ "$AUTH_STATUS" = "200" ]; then
    echo "   ✅ Auth Emulator (puerto 9099)"
else
    echo "   ❌ Auth Emulator (puerto 9099)"
fi

if [ "$FIRESTORE_STATUS" = "200" ]; then
    echo "   ✅ Firestore Emulator (puerto 8080)"
else
    echo "   ❌ Firestore Emulator (puerto 8080)"
fi

echo ""

# Verificar dependencias
echo "2️⃣ Verificando Dependencias..."

if [ -d "node_modules" ]; then
    echo "   ✅ Dependencias instaladas"
else
    echo "   ❌ Dependencias NO instaladas"
    echo "   💡 Ejecuta: npm install"
fi

echo ""

# Verificar archivos clave
echo "3️⃣ Verificando Archivos de Configuración..."

if [ -f ".env.local" ]; then
    echo "   ✅ .env.local existe"
else
    echo "   ❌ .env.local NO existe"
fi

if [ -f "firebase.json" ]; then
    echo "   ✅ firebase.json existe"
else
    echo "   ❌ firebase.json NO existe"
fi

if [ -f ".firebaserc" ]; then
    echo "   ✅ .firebaserc existe"
else
    echo "   ❌ .firebaserc NO existe"
fi

echo ""

# Estado final
echo "🎯 ESTADO FINAL:"
echo "==============="

if [ "$AUTH_STATUS" = "200" ] && [ "$FIRESTORE_STATUS" = "200" ] && [ -d "node_modules" ]; then
    echo "✅ SISTEMA LISTO PARA TESTING"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "1. Ejecutar: npm run dev"
    echo "2. Abrir: http://localhost:5173"
    echo "3. Seguir: GUIA_TESTING_PIPELINE_BIENVENIDA.md"
else
    echo "❌ SISTEMA NO ESTÁ LISTO"
    echo ""
    echo "🔧 Pasos necesarios:"
    if [ "$AUTH_STATUS" != "200" ] || [ "$FIRESTORE_STATUS" != "200" ]; then
        echo "- Ejecutar: firebase emulators:start --only auth,firestore --project demo-project"
    fi
    if [ ! -d "node_modules" ]; then
        echo "- Ejecutar: npm install"
    fi
fi

echo ""