#!/bin/bash

# Script para probar API key y actualizar .env si funciona
# Uso: ./scripts/test-and-update-key.sh

API_KEY="${OPENAI_API_KEY:-YOUR_OPENAI_API_KEY_HERE}"

echo "=================================================="
echo "🔍 PROBANDO API KEY CON CURL"
echo "=================================================="
echo ""
echo "Key: ${API_KEY:0:20}... (${#API_KEY} caracteres)"
echo ""

# Probar con OpenAI API
echo "Probando con OpenAI API..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.openai.com/v1/models" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API KEY VÁLIDA - Funciona correctamente"
  echo ""
  
  # Actualizar .env.local
  ENV_LOCAL="/Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/.env.local"
  ENV_LOCAL_ALT="/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/.env.local"
  
  if [ -f "$ENV_LOCAL" ]; then
    echo "📍 Actualizando .env.local en Projects..."
    
    # Backup
    cp "$ENV_LOCAL" "$ENV_LOCAL.bak.$(date +%Y%m%d_%H%M%S)"
    
    # Actualizar o agregar VITE_OPENAI_API_KEY
    if grep -q "^VITE_OPENAI_API_KEY=" "$ENV_LOCAL"; then
      # Reemplazar línea existente
      sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$API_KEY|" "$ENV_LOCAL"
      echo "✅ VITE_OPENAI_API_KEY actualizada en .env.local"
    else
      # Agregar nueva línea
      echo "" >> "$ENV_LOCAL"
      echo "VITE_OPENAI_API_KEY=$API_KEY" >> "$ENV_LOCAL"
      echo "✅ VITE_OPENAI_API_KEY agregada a .env.local"
    fi
    
    rm -f "$ENV_LOCAL.bak"
  elif [ -f "$ENV_LOCAL_ALT" ]; then
    echo "📍 Actualizando .env.local en Desktop..."
    ENV_LOCAL="$ENV_LOCAL_ALT"
    
    # Backup
    cp "$ENV_LOCAL" "$ENV_LOCAL.bak.$(date +%Y%m%d_%H%M%S)"
    
    # Actualizar o agregar
    if grep -q "^VITE_OPENAI_API_KEY=" "$ENV_LOCAL"; then
      sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$API_KEY|" "$ENV_LOCAL"
      echo "✅ VITE_OPENAI_API_KEY actualizada en .env.local"
    else
      echo "" >> "$ENV_LOCAL"
      echo "VITE_OPENAI_API_KEY=$API_KEY" >> "$ENV_LOCAL"
      echo "✅ VITE_OPENAI_API_KEY agregada a .env.local"
    fi
    
    rm -f "$ENV_LOCAL.bak"
  else
    echo "⚠️  No se encontró .env.local, creando nuevo archivo..."
    ENV_LOCAL="/Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/.env.local"
    echo "VITE_OPENAI_API_KEY=$API_KEY" > "$ENV_LOCAL"
    echo "✅ .env.local creado con VITE_OPENAI_API_KEY"
  fi
  
  # Actualizar .env (si existe)
  ENV_FILE="/Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/.env"
  if [ -f "$ENV_FILE" ]; then
    echo ""
    echo "📍 Actualizando .env..."
    
    # Backup
    cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%Y%m%d_%H%M%S)"
    
    if grep -q "^VITE_OPENAI_API_KEY=" "$ENV_FILE"; then
      sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$API_KEY|" "$ENV_FILE"
      echo "✅ VITE_OPENAI_API_KEY actualizada en .env"
    else
      echo "" >> "$ENV_FILE"
      echo "VITE_OPENAI_API_KEY=$API_KEY" >> "$ENV_FILE"
      echo "✅ VITE_OPENAI_API_KEY agregada a .env"
    fi
    
    rm -f "$ENV_FILE.bak"
  fi
  
  echo ""
  echo "=================================================="
  echo "✅ ACTUALIZACIÓN COMPLETA"
  echo "=================================================="
  echo ""
  echo "Archivos actualizados:"
  echo "  ✅ $ENV_LOCAL"
  [ -f "$ENV_FILE" ] && echo "  ✅ $ENV_FILE"
  echo ""
  echo "Próximo paso: Reinicia el servidor de desarrollo"
  echo "  npm run dev"
  
else
  echo "❌ API KEY INVÁLIDA - No funciona"
  echo ""
  echo "HTTP Code: $HTTP_CODE"
  echo "Respuesta:"
  echo "$BODY" | head -20
  echo ""
  echo "No se actualizarán los archivos .env"
  exit 1
fi

echo ""

