#!/bin/bash
# Script para configurar secretos de GitHub Codespaces
# Ejecutar: bash scripts/setup-codespaces-secrets.sh

set -e

REPO="Maurosg78/AIDUXCARE-V.2"
ENVIRONMENT="codespaces"

echo "🔐 Configurando secretos de GitHub Codespaces para $REPO..."
echo ""

# Verificar que gh está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no está instalado. Instala con: brew install gh"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ No estás autenticado. Ejecuta: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configurado correctamente"
echo ""

# Función para configurar un secreto
# Nota: Los secretos se configuran para Codespaces usando --app codespaces
# Estos estarán disponibles automáticamente en todos los Codespaces del repo
set_secret() {
    local name=$1
    local value=$2
    
    echo "📝 Configurando $name..."
    if gh secret set "$name" -b"$value" --repo "$REPO" --app codespaces 2>&1; then
        echo "   ✅ $name configurado"
    else
        echo "   ⚠️  Error configurando $name (puede que ya exista)"
        return 1
    fi
}

# Configurar todos los secretos
echo "🚀 Iniciando configuración de secretos..."
echo ""

set_secret "VITE_ENV" "uat-dev"
set_secret "VITE_MARKET" "CA"
set_secret "VITE_LANGUAGE" "en-CA"
set_secret "VITE_VERTEX_PROJECT_ID" "aiduxcare-v2-uat-dev"
set_secret "VITE_VERTEX_LOCATION" "us-central1"
set_secret "VITE_VERTEX_MODEL" "gemini-1.5-pro"
set_secret "VITE_VERTEX_API_KEY" "AIzaSyDoujtsMh6ZSy7wwS99MhM8sxyI6LocfI0"
set_secret "VITE_FIREBASE_API_KEY" "AIzaSyDfZP98XKzx71vA4ctX9HlUWI1tp0W9EKQ"
set_secret "VITE_FIREBASE_AUTH_DOMAIN" "aiduxcare-v2-uat-dev.firebaseapp.com"
set_secret "VITE_FIREBASE_PROJECT_ID" "aiduxcare-v2-uat-dev"
set_secret "VITE_FIREBASE_STORAGE_BUCKET" "aiduxcare-v2-uat-dev.firebasestorage.app"
set_secret "VITE_FIREBASE_MESSAGING_SENDER_ID" "935285025887"
set_secret "VITE_FIREBASE_APP_ID" "1:935285025887:web:prod-uatsim-2e34b1"
set_secret "VITE_FIREBASE_MEASUREMENT_ID" "G-UATDEV2025"
set_secret "VITE_SUPABASE_URL" "https://aiduxcare-v2.supabase.co"
set_secret "VITE_OPENAI_API_KEY" "YOUR_OPENAI_API_KEY_HERE"
set_secret "VITE_OPENAI_MODEL" "gpt-4o-mini"
set_secret "VITE_OPENAI_TRANSCRIPT_URL" "https://api.openai.com/v1/audio/transcriptions"
set_secret "VITE_WHISPER_MODEL" "gpt-4o-mini-transcribe"
set_secret "VITE_MARKET_CANONICAL" "CA"
set_secret "VITE_COMPLIANCE" "PHIPA,PIPEDA"
set_secret "VITE_SOT_TAG" "guardian-uat-20251107"
set_secret "VITE_SMS_PROVIDER" "vonage"
set_secret "VITE_VONAGE_API_KEY" "1d667b43"
set_secret "VITE_VONAGE_API_SECRET" "cT0AzU%zK19hIk3Cuuav"
set_secret "VITE_VONAGE_FROM_NUMBER" "+14168496475"
set_secret "VITE_DEBUG_VERTEX" "true"
set_secret "VITE_DEBUG_FIREBASE" "false"
set_secret "VITE_DEBUG_AUTH" "true"
set_secret "VITE_DEV_PUBLIC_URL" "https://aiduxcare-v2-uat-dev.web.app"
set_secret "VITE_PILOT_EMAIL_VERIFICATION" "true"

echo ""
echo "✅ Todos los secretos configurados correctamente"
echo ""
echo "⚠️  IMPORTANTE: Las claves API expuestas en este script deben rotarse después de validar Codespaces"
echo "   - VITE_OPENAI_API_KEY"
echo "   - VITE_VERTEX_API_KEY"
echo "   - VITE_VONAGE_API_SECRET"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Crear Codespace desde GitHub.com o Cursor"
echo "   2. Verificar que las variables de entorno se cargan correctamente"
echo "   3. Rotar las claves API expuestas"
echo ""

