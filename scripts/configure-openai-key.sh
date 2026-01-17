#!/bin/bash

# Script para configurar OpenAI API Key en Firebase Functions
# Uso: ./scripts/configure-openai-key.sh

echo "=================================================="
echo "🔐 CONFIGURACIÓN OPENAI API KEY EN FIREBASE"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==================================================
# PASO 1: Buscar API key en .env.local
# ==================================================
echo "📍 PASO 1: Buscando API key en .env.local..."
echo ""

ENV_LOCATIONS=(
  "/Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/.env.local"
  "/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/.env.local"
  "$(pwd)/.env.local"
  "$(pwd)/../.env.local"
)

API_KEY=""
ENV_FILE=""

for location in "${ENV_LOCATIONS[@]}"; do
  if [ -f "$location" ]; then
    echo -e "${GREEN}✅ Encontrado: $location${NC}"
    ENV_FILE="$location"
    
    # Buscar VITE_OPENAI_API_KEY
    API_KEY=$(grep -E "^VITE_OPENAI_API_KEY=" "$location" | cut -d '=' -f2- | sed 's/^"//;s/"$//' | tr -d '[:space:]')
    
    if [ -n "$API_KEY" ]; then
      echo -e "${GREEN}✅ API Key encontrada (${#API_KEY} caracteres)${NC}"
      break
    else
      echo -e "${YELLOW}⚠️  Archivo encontrado pero no contiene VITE_OPENAI_API_KEY${NC}"
    fi
  fi
done

# ==================================================
# PASO 2: Si no se encontró, pedir al usuario
# ==================================================
if [ -z "$API_KEY" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  No se encontró API key en .env.local${NC}"
  echo ""
  echo "Opciones:"
  echo "  1. Ingresar API key manualmente"
  echo "  2. Cancelar y configurar después"
  echo ""
  read -p "¿Deseas ingresar la API key ahora? (s/n): " -n 1 -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Cancelado. Puedes configurarla después con:"
    echo "  firebase functions:config:set openai.key=\"sk-proj-...\""
    exit 0
  fi
  
  echo ""
  echo "Ingresa tu OpenAI API Key (debe empezar con 'sk-proj-'):"
  read -p "API Key: " API_KEY
  
  if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ API Key vacía. Cancelando.${NC}"
    exit 1
  fi
fi

# ==================================================
# PASO 3: Validar formato de API key
# ==================================================
echo ""
echo "📍 PASO 2: Validando formato de API key..."

if [[ ! "$API_KEY" =~ ^sk-proj- ]]; then
  echo -e "${YELLOW}⚠️  ADVERTENCIA: La API key no empieza con 'sk-proj-'${NC}"
  echo "   ¿Estás seguro de que es la key correcta?"
  read -p "   Continuar de todos modos? (s/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 0
  fi
fi

KEY_LENGTH=${#API_KEY}
if [ $KEY_LENGTH -lt 50 ]; then
  echo -e "${RED}❌ ERROR: API key muy corta (${KEY_LENGTH} caracteres)${NC}"
  echo "   Las API keys de OpenAI suelen tener 50+ caracteres"
  exit 1
fi

echo -e "${GREEN}✅ API Key válida (${KEY_LENGTH} caracteres)${NC}"

# ==================================================
# PASO 4: Configurar en Firebase
# ==================================================
echo ""
echo "📍 PASO 3: Configurando en Firebase..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "firebase.json" ] && [ ! -f "../firebase.json" ]; then
  echo -e "${RED}❌ ERROR: No se encontró firebase.json${NC}"
  echo "   Asegúrate de estar en la raíz del proyecto"
  exit 1
fi

# Navegar a la raíz del proyecto si es necesario
if [ ! -f "firebase.json" ]; then
  cd ..
fi

# Configurar API key
echo "Ejecutando: firebase functions:config:set openai.key=\"***\""
firebase functions:config:set openai.key="$API_KEY"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ API Key configurada exitosamente${NC}"
  echo ""
  
  # Verificar configuración
  echo "📍 Verificando configuración..."
  firebase functions:config:get openai
  
  echo ""
  echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
  echo ""
  echo "Próximo paso:"
  echo "  firebase deploy --only functions:whisperProxy"
else
  echo ""
  echo -e "${RED}❌ ERROR al configurar API key${NC}"
  echo ""
  echo "Intenta manualmente:"
  echo "  firebase functions:config:set openai.key=\"$API_KEY\""
  exit 1
fi

