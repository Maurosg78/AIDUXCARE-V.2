#!/bin/bash

# Script para probar OpenAI API Key directamente
# Uso: ./scripts/test-openai-key.sh

echo "=================================================="
echo "🔍 TEST OPENAI API KEY"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==================================================
# PASO 1: Obtener API key
# ==================================================
echo "📍 PASO 1: Obteniendo API key..."
echo ""

# Buscar en .env.local.bak primero, luego .env.local
ENV_LOCATIONS=(
  "/Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/.env.local.bak"
  "/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/.env.local.bak"
  "$(pwd)/.env.local.bak"
  "/Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/.env.local"
  "/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/.env.local"
  "$(pwd)/.env.local"
)

API_KEY=""
ENV_FILE=""

for location in "${ENV_LOCATIONS[@]}"; do
  if [ -f "$location" ]; then
    echo -e "${GREEN}✅ Encontrado: $location${NC}"
    ENV_FILE="$location"
    
    API_KEY=$(grep -E "^VITE_OPENAI_API_KEY=" "$location" | cut -d '=' -f2- | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//" | tr -d '[:space:]')
    
    if [ -n "$API_KEY" ]; then
      echo -e "${GREEN}✅ API Key encontrada (${#API_KEY} caracteres)${NC}"
      break
    fi
  fi
done

# Si no se encontró, pedir al usuario
if [ -z "$API_KEY" ]; then
  echo -e "${YELLOW}⚠️  No se encontró API key en .env.local${NC}"
  echo ""
  echo "Ingresa tu OpenAI API Key (o presiona Enter para usar la de Firebase):"
  read -p "API Key: " API_KEY
  
  if [ -z "$API_KEY" ]; then
    echo ""
    echo "Obteniendo de Firebase config..."
    FIREBASE_KEY=$(firebase functions:config:get openai 2>/dev/null | grep -o '"key": "[^"]*' | cut -d'"' -f4)
    if [ -n "$FIREBASE_KEY" ]; then
      API_KEY="$FIREBASE_KEY"
      echo -e "${GREEN}✅ API Key obtenida de Firebase (${#API_KEY} caracteres)${NC}"
    else
      echo -e "${RED}❌ No se pudo obtener API key${NC}"
      exit 1
    fi
  fi
fi

# Validar formato
if [[ ! "$API_KEY" =~ ^sk-proj- ]] && [[ ! "$API_KEY" =~ ^sk- ]]; then
  echo -e "${YELLOW}⚠️  ADVERTENCIA: La API key no tiene el formato esperado${NC}"
  echo "   Debe empezar con 'sk-proj-' o 'sk-'"
fi

echo ""
echo "📍 PASO 2: Probando API key con OpenAI..."
echo ""

# ==================================================
# PASO 2: Probar con OpenAI API
# ==================================================

# Crear un archivo de audio de prueba muy pequeño (1 segundo de silencio)
# Usaremos curl para hacer una llamada directa a OpenAI

echo "Haciendo test call a OpenAI Whisper API..."
echo ""

# Test 1: Verificar key con un endpoint simple (models)
echo "Test 1: Verificando key con endpoint de modelos..."
MODELS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.openai.com/v1/models" 2>&1)

HTTP_CODE=$(echo "$MODELS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$MODELS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Test 1: API Key VÁLIDA (código 200)${NC}"
  echo "   La key puede acceder a OpenAI API"
  echo ""
  
  # Verificar si whisper está disponible
  if echo "$RESPONSE_BODY" | grep -q "whisper"; then
    echo -e "${GREEN}✅ Whisper API disponible${NC}"
  else
    echo -e "${YELLOW}⚠️  Whisper no encontrado en modelos (puede ser normal)${NC}"
  fi
else
  echo -e "${RED}❌ Test 1: API Key INVÁLIDA (código $HTTP_CODE)${NC}"
  echo ""
  echo "Respuesta de OpenAI:"
  echo "$RESPONSE_BODY" | head -20
  echo ""
  
  if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ ERROR: API key inválida o revocada${NC}"
    echo ""
    echo "Solución:"
    echo "  1. Ve a https://platform.openai.com/api-keys"
    echo "  2. Verifica si la key está activa"
    echo "  3. Si está revocada, crea una nueva"
    echo "  4. Re-configura en Firebase:"
    echo "     firebase functions:config:set openai.key=\"sk-proj-NUEVA-KEY\""
  elif [ "$HTTP_CODE" = "429" ]; then
    echo -e "${YELLOW}⚠️  Rate limit alcanzado (pero la key es válida)${NC}"
  else
    echo -e "${YELLOW}⚠️  Error desconocido: $HTTP_CODE${NC}"
  fi
  
  exit 1
fi

echo ""
echo "📍 PASO 3: Verificando permisos de la key..."
echo ""

# Test 2: Verificar permisos específicos
echo "Test 2: Verificando acceso a Whisper endpoint..."
echo ""

# Crear un archivo de audio de prueba muy pequeño (silence)
# Usaremos un archivo WAV de 1 segundo de silencio en base64
SILENCE_WAV_B64="UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="

# Intentar hacer una transcripción de prueba (muy pequeña)
WHISPER_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "https://api.openai.com/v1/audio/transcriptions" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@/dev/null" \
  -F "model=whisper-1" 2>&1)

WHISPER_HTTP_CODE=$(echo "$WHISPER_RESPONSE" | tail -n1)
WHISPER_BODY=$(echo "$WHISPER_RESPONSE" | sed '$d')

if [ "$WHISPER_HTTP_CODE" = "200" ] || [ "$WHISPER_HTTP_CODE" = "400" ]; then
  # 400 puede ser porque el archivo está vacío, pero significa que la key es válida
  if [ "$WHISPER_HTTP_CODE" = "400" ]; then
    if echo "$WHISPER_BODY" | grep -q "invalid_api_key"; then
      echo -e "${RED}❌ Test 2: API key inválida para Whisper${NC}"
    else
      echo -e "${GREEN}✅ Test 2: API key VÁLIDA (error 400 es por archivo vacío, no por key)${NC}"
      echo "   La key tiene acceso a Whisper API"
    fi
  else
    echo -e "${GREEN}✅ Test 2: API key VÁLIDA y funcionando${NC}"
  fi
elif [ "$WHISPER_HTTP_CODE" = "401" ]; then
  echo -e "${RED}❌ Test 2: API key INVÁLIDA o REVOCADA${NC}"
  echo ""
  echo "Respuesta:"
  echo "$WHISPER_BODY" | head -10
else
  echo -e "${YELLOW}⚠️  Test 2: Respuesta inesperada (código $WHISPER_HTTP_CODE)${NC}"
  echo "Respuesta:"
  echo "$WHISPER_BODY" | head -10
fi

echo ""
echo "=================================================="
echo "📊 RESUMEN"
echo "=================================================="
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ API Key: VÁLIDA${NC}"
  echo ""
  echo "La key funciona correctamente."
  echo "Si aún tienes problemas en la Cloud Function, puede ser:"
  echo "  - La key en Firebase está desactualizada"
  echo "  - Hay un problema con cómo se lee la key en la función"
  echo ""
  echo "Solución: Re-configura la key en Firebase:"
  echo "  firebase functions:config:set openai.key=\"$API_KEY\""
else
  echo -e "${RED}❌ API Key: INVÁLIDA o REVOCADA${NC}"
  echo ""
  echo "Necesitas crear una nueva key en:"
  echo "  https://platform.openai.com/api-keys"
fi

echo ""

