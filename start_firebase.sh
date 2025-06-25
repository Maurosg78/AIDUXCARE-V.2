#!/bin/bash

# Script para iniciar Firebase Functions correctamente
echo "🚀 Iniciando Firebase Functions..."

# Verificar que estamos en el directorio correcto
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: No se encontró firebase.json"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Verificar que el directorio functions existe
if [ ! -d "functions" ]; then
    echo "❌ Error: No se encontró el directorio functions"
    exit 1
fi

# Compilar functions
echo "🔨 Compilando functions..."
cd functions
npm run build
cd ..

# Iniciar emulador
echo "🔥 Iniciando emulador de Firebase Functions..."
firebase emulators:start --only functions --project aiduxcare-v2

echo "✅ Firebase Functions iniciado correctamente" 