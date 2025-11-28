#!/bin/bash

# 🔧 Script para iniciar solo el Auth Emulator de Firebase
# Útil cuando Firestore ya está corriendo pero Auth no

set -e

echo "🔧 Iniciando Firebase Auth Emulator..."
echo ""

# Verificar si Auth emulator ya está corriendo
if lsof -ti:9099 >/dev/null 2>&1; then
    echo "✅ Auth Emulator ya está corriendo en puerto 9099"
    exit 0
fi

# Verificar si Firestore está corriendo
if lsof -ti:8080 >/dev/null 2>&1; then
    echo "⚠️  Firestore Emulator ya está corriendo en puerto 8080"
    echo "   Iniciando solo Auth Emulator..."
    echo ""
    firebase emulators:start --only auth --project aiduxcare-v2-uat-dev
else
    echo "ℹ️  Firestore Emulator no está corriendo"
    echo "   Iniciando todos los emuladores..."
    echo ""
    npm run emulators:start
fi


