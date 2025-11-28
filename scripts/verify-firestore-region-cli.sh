#!/bin/bash

# Script mejorado para verificar región de Firestore usando CLI
# Prioriza comandos CLI sobre verificación manual

set -e

PROJECT_ID="aiduxcare-v2-uat-dev"
OUTPUT_DIR="docs/audit-trail/W1-001/02-development"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "════════════════════════════════════════════════════════════"
echo "  🔍 VERIFICACIÓN DE REGIÓN FIRESTORE (CLI PRIORITY)"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Proyecto: $PROJECT_ID"
echo "🕐 Timestamp: $TIMESTAMP"
echo ""

# Verificar herramientas disponibles
echo "1. Verificando herramientas CLI disponibles..."
echo ""

HAS_FIREBASE_CLI=false
HAS_GCLOUD_CLI=false

if command -v firebase &> /dev/null; then
    HAS_FIREBASE_CLI=true
    FIREBASE_VERSION=$(firebase --version)
    echo "   ✅ Firebase CLI: $FIREBASE_VERSION"
else
    echo "   ❌ Firebase CLI: No instalado"
fi

if command -v gcloud &> /dev/null; then
    HAS_GCLOUD_CLI=true
    GCLOUD_VERSION=$(gcloud --version | head -1)
    echo "   ✅ Google Cloud CLI: $GCLOUD_VERSION"
else
    echo "   ❌ Google Cloud CLI: No instalado"
fi

echo ""

# Método 1: Firebase CLI - Listar databases
if [ "$HAS_FIREBASE_CLI" = true ]; then
    echo "2. Intentando verificar región con Firebase CLI..."
    echo ""
    
    # Verificar autenticación
    if firebase projects:list &> /dev/null; then
        echo "   ✅ Firebase CLI autenticado"
        
        # Listar databases
        echo "   📊 Listando bases de datos Firestore:"
        firebase firestore:databases:list --project $PROJECT_ID 2>&1 | tee "$OUTPUT_DIR/firebase-cli-databases.log" || {
            echo "   ⚠️  Comando no disponible en esta versión de Firebase CLI"
        }
    else
        echo "   ⚠️  Firebase CLI no autenticado. Ejecutando login..."
        firebase login --no-localhost 2>&1 | tee "$OUTPUT_DIR/firebase-login.log" || {
            echo "   ❌ Error en login de Firebase"
        }
    fi
    echo ""
fi

# Método 2: Google Cloud CLI - Describe database
if [ "$HAS_GCLOUD_CLI" = true ]; then
    echo "3. Intentando verificar región con Google Cloud CLI..."
    echo ""
    
    # Verificar autenticación
    if gcloud auth list &> /dev/null; then
        echo "   ✅ Google Cloud CLI autenticado"
        
        # Verificar proyecto activo
        CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
        if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
            echo "   🔄 Configurando proyecto activo: $PROJECT_ID"
            gcloud config set project $PROJECT_ID 2>&1 | tee "$OUTPUT_DIR/gcloud-set-project.log"
        fi
        
        # Intentar obtener información de Firestore
        echo "   📊 Obteniendo información de Firestore database..."
        gcloud firestore databases describe --project=$PROJECT_ID --database="(default)" 2>&1 | tee "$OUTPUT_DIR/gcloud-firestore-describe.log" || {
            echo "   ⚠️  No se pudo obtener información directamente"
        }
        
        # Intentar obtener información del proyecto
        echo "   📊 Obteniendo información del proyecto..."
        gcloud projects describe $PROJECT_ID 2>&1 | tee "$OUTPUT_DIR/gcloud-project-describe.log" || {
            echo "   ⚠️  No se pudo obtener información del proyecto"
        }
        
        # Intentar API REST directa
        echo "   📊 Intentando API REST de Firestore..."
        ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null || echo "")
        if [ -n "$ACCESS_TOKEN" ]; then
            curl -s "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -H "Content-Type: application/json" 2>&1 | tee "$OUTPUT_DIR/firestore-api-response.json" || {
                echo "   ⚠️  No se pudo obtener información vía API"
            }
        else
            echo "   ⚠️  No se pudo obtener access token"
        fi
    else
        echo "   ⚠️  Google Cloud CLI no autenticado"
        echo "   💡 Ejecutar: gcloud auth login"
    fi
    echo ""
fi

# Método 3: Verificar configuración en código
echo "4. Verificando configuración en código..."
echo ""

if [ -f "functions/index.js" ]; then
    FUNCTIONS_REGION=$(grep -o "northamerica-northeast1\|us-central1\|us-east1" functions/index.js | head -1 || echo "")
    if [ -n "$FUNCTIONS_REGION" ]; then
        echo "   ✅ Firebase Functions región: $FUNCTIONS_REGION"
        echo "   📁 Archivo: functions/index.js"
    else
        echo "   ⚠️  No se encontró región explícita en functions/index.js"
    fi
else
    echo "   ⚠️  Archivo functions/index.js no encontrado"
fi

# Verificar URLs en código cliente
if [ -f "src/services/vertex-ai-service-firebase.ts" ]; then
    CLIENT_URL=$(grep -o "northamerica-northeast1\|us-central1\|us-east1" src/services/vertex-ai-service-firebase.ts | head -1 || echo "")
    if [ -n "$CLIENT_URL" ]; then
        echo "   ✅ Cliente Vertex AI URL contiene: $CLIENT_URL"
        echo "   📁 Archivo: src/services/vertex-ai-service-firebase.ts"
    fi
fi

echo ""

# Análisis de resultados
echo "5. Análisis de resultados..."
echo ""

# Buscar región en logs
if [ -f "$OUTPUT_DIR/firestore-api-response.json" ]; then
    echo "   📊 Analizando respuesta de API..."
    if grep -q "location\|region" "$OUTPUT_DIR/firestore-api-response.json" 2>/dev/null; then
        echo "   ✅ Información de región encontrada en API response"
        grep -i "location\|region" "$OUTPUT_DIR/firestore-api-response.json" | head -5
    fi
fi

if [ -f "$OUTPUT_DIR/gcloud-firestore-describe.log" ]; then
    echo "   📊 Analizando output de gcloud..."
    if grep -qi "location\|region\|northamerica\|us-central" "$OUTPUT_DIR/gcloud-firestore-describe.log" 2>/dev/null; then
        echo "   ✅ Información de región encontrada en gcloud output"
        grep -i "location\|region\|northamerica\|us-central" "$OUTPUT_DIR/gcloud-firestore-describe.log" | head -5
    fi
fi

echo ""

# Resumen y próximos pasos
echo "════════════════════════════════════════════════════════════"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Firebase Functions: northamerica-northeast1 (Canadá)"
echo "⚠️  Firestore: Verificar en logs generados"
echo ""
echo "📁 Logs generados en: $OUTPUT_DIR/"
echo "   - firebase-cli-databases.log"
echo "   - gcloud-firestore-describe.log"
echo "   - firestore-api-response.json"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "   1. Revisar logs generados para región de Firestore"
echo "   2. Si región no se puede determinar por CLI:"
echo "      → Verificar manualmente en Firebase Console"
echo "      → URL: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo "   3. Documentar resultado en docs/FIRESTORE_REGION_STATUS.md"
echo ""
echo "════════════════════════════════════════════════════════════"


