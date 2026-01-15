#!/bin/bash

# Script para configurar y desplegar whisperProxy
# Fecha: 2026-01-12

set -e

echo "🔧 Configurando whisperProxy para resolver CORS..."

# 1. Configurar API Key en Firebase Secrets
echo ""
echo "📝 Paso 1: Configurar API Key en Firebase Secrets"
echo "Ejecutando: firebase functions:secrets:set OPENAI_API_KEY"
echo ""
echo "Cuando pida el valor, ingresar:"
echo "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"
echo ""
read -p "Presiona Enter para continuar..."

cd functions
firebase functions:secrets:set OPENAI_API_KEY

# 2. Desplegar Cloud Function
echo ""
echo "🚀 Paso 2: Desplegar Cloud Function whisperProxy"
echo "Ejecutando: firebase deploy --only functions:whisperProxy"
echo ""
read -p "Presiona Enter para continuar..."

firebase deploy --only functions:whisperProxy

# 3. Verificar despliegue
echo ""
echo "✅ Paso 3: Verificar despliegue"
echo "Ejecutando: firebase functions:list | grep whisperProxy"
echo ""

firebase functions:list | grep -i whisper || echo "⚠️  whisperProxy no encontrado en funciones desplegadas"

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Reiniciar servidor de desarrollo"
echo "2. Probar grabación de audio en /workflow?type=initial"
echo "3. Verificar que la transcripción funciona sin errores de CORS"





