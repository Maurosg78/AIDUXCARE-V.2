#!/bin/bash
# verify-firebase-config.sh
# Script para verificar configuración de Firebase Web App y Analytics

set -e

PROJECT_ID="aiduxcare-v2-uat-dev"
APP_ID="1:935285025887:web:192bab3e9ef5aef2ee3fea"
EXPECTED_MEASUREMENT_ID="G-UATDEV2025"

echo "🔍 Verificando configuración de Firebase..."
echo "   Project: $PROJECT_ID"
echo "   App ID: $APP_ID"
echo ""

# Verificar que Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
  echo "❌ Firebase CLI no está instalado"
  echo "   Instalar con: npm install -g firebase-tools"
  exit 1
fi

# Verificar que estamos autenticados
if ! firebase projects:list &> /dev/null; then
  echo "❌ No estás autenticado en Firebase CLI"
  echo "   Ejecutar: firebase login"
  exit 1
fi

# Verificar que el proyecto existe
echo "1️⃣ Verificando que el proyecto existe..."
if ! firebase projects:list | grep -q "$PROJECT_ID"; then
  echo "   ❌ Proyecto $PROJECT_ID no encontrado o sin acceso"
  exit 1
fi
echo "   ✅ Proyecto existe"

# Verificar que el App ID existe
echo ""
echo "2️⃣ Verificando que App ID existe..."
APPS_LIST=$(firebase apps:list --project $PROJECT_ID 2>&1)

if echo "$APPS_LIST" | grep -q "$APP_ID"; then
  echo "   ✅ App ID existe"
else
  echo "   ❌ App ID NO existe"
  echo ""
  echo "   📋 Web Apps disponibles:"
  echo "$APPS_LIST" | grep -A 5 "WEB" || echo "   (ninguna Web App encontrada)"
  echo ""
  echo "   🔧 Acción requerida:"
  echo "      Crear nueva Web App o usar App ID existente"
  exit 1
fi

# Obtener configuración completa
echo ""
echo "3️⃣ Obteniendo configuración completa..."
CONFIG=$(firebase apps:sdkconfig WEB --project $PROJECT_ID --app "$APP_ID" 2>&1)

if [ $? -ne 0 ]; then
  echo "   ❌ Error al obtener configuración"
  echo "   Output: $CONFIG"
  exit 1
fi

# Verificar que Analytics está habilitado
echo ""
echo "4️⃣ Verificando que Analytics está habilitado..."
if echo "$CONFIG" | grep -q "measurementId"; then
  MEASUREMENT_ID=$(echo "$CONFIG" | grep -oP 'measurementId["\s]*:\s*["\']([^"\']+)["\']' | head -1 | sed "s/.*['\"]\(.*\)['\"].*/\1/" || echo "")
  
  if [ -z "$MEASUREMENT_ID" ]; then
    # Intentar otro método de extracción
    MEASUREMENT_ID=$(echo "$CONFIG" | grep -i "measurementId" | head -1 | sed 's/.*measurementId.*["'\'']\([^"'\'']*\)["'\''].*/\1/')
  fi
  
  if [ -n "$MEASUREMENT_ID" ]; then
    echo "   ✅ Analytics está habilitado"
    echo "   📊 Measurement ID: $MEASUREMENT_ID"
    
    # Verificar que coincide con el esperado
    if [ "$MEASUREMENT_ID" = "$EXPECTED_MEASUREMENT_ID" ]; then
      echo "   ✅ Measurement ID coincide con el esperado"
    else
      echo "   ⚠️  Measurement ID NO coincide"
      echo "      Esperado: $EXPECTED_MEASUREMENT_ID"
      echo "      Actual:   $MEASUREMENT_ID"
      echo ""
      echo "   🔧 Acción requerida:"
      echo "      Actualizar VITE_FIREBASE_MEASUREMENT_ID=$MEASUREMENT_ID"
      echo "      O recrear Web App con Measurement ID correcto"
    fi
  else
    echo "   ⚠️  Analytics habilitado pero no se pudo extraer Measurement ID"
    echo "   Config output:"
    echo "$CONFIG" | head -20
  fi
else
  echo "   ❌ Analytics NO está habilitado"
  echo ""
  echo "   🔧 Acción requerida:"
  echo "      1. Ir a: https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
  echo "      2. Buscar Web App con App ID: $APP_ID"
  echo "      3. Click en 'Add Analytics' o 'Enable Google Analytics'"
  echo "      4. Seleccionar o crear propiedad de Google Analytics"
  exit 1
fi

# Mostrar resumen de configuración
echo ""
echo "5️⃣ Resumen de configuración:"
echo "$CONFIG" | grep -E "(appId|measurementId|projectId|apiKey)" | head -10

echo ""
echo "✅ Verificación completada"
echo ""
echo "📋 Próximo paso:"
echo "   Probar en navegador (ventana incógnito) y verificar que no hay errores 400"
