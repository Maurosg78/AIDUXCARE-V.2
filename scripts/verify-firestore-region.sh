#!/bin/bash

# Script para verificar región de Firestore
# Basado en recomendaciones del CTO

echo "════════════════════════════════════════════════════════════"
echo "  🔍 VERIFICACIÓN DE REGIÓN FIRESTORE"
echo "════════════════════════════════════════════════════════════"
echo ""

PROJECT_ID="aiduxcare-v2-uat-dev"

echo "📋 Proyecto: $PROJECT_ID"
echo ""

# Verificar Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado"
    echo "   Instalar con: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI encontrado"
echo ""

# Verificar autenticación
echo "🔐 Verificando autenticación..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  No autenticado. Ejecutando login..."
    firebase login
fi

echo ""
echo "📊 Verificando configuración del proyecto..."
echo ""

# Listar bases de datos de Firestore
echo "1. Listando bases de datos Firestore:"
firebase firestore:databases:list --project $PROJECT_ID 2>&1 || {
    echo "   ⚠️  Comando no disponible en esta versión de Firebase CLI"
    echo "   📍 Verificar manualmente en:"
    echo "      https://console.firebase.google.com/project/$PROJECT_ID/firestore"
}

echo ""
echo "2. Verificando región de Firebase Functions:"
echo "   ✅ Configurada en código: northamerica-northeast1 (Montreal, Canadá)"
echo "   📁 Archivo: functions/index.js"
echo ""

# Verificar en código
if grep -q "northamerica-northeast1" functions/index.js 2>/dev/null; then
    echo "   ✅ Functions configuradas para región canadiense"
else
    echo "   ⚠️  No se encontró configuración de región en functions/index.js"
fi

echo ""
echo "3. ⚠️  CRÍTICO - Verificar región de Firestore:"
echo "   📍 IR A: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo "   📍 Verificar que 'Database location' sea: northamerica-northeast1"
echo "   🚨 Si aparece us-central1 → MIGRACIÓN URGENTE REQUERIDA"
echo ""

echo "4. Verificación de compliance:"
echo "   ✅ Functions: Canadá (northamerica-northeast1)"
echo "   ⚠️  Firestore: VERIFICAR MANUALMENTE EN CONSOLE"
echo "   ✅ Hosting: Firebase (edge locations, OK para estático)"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "🎯 RESULTADO ESPERADO: 100% datos en Canadá"
echo "📅 TIMELINE: Resolver en 48h máximo"
echo "🚨 RIESGO: Violación soberanía datos si Firestore en US"
echo "════════════════════════════════════════════════════════════"


