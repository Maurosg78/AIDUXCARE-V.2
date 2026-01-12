#!/bin/bash

# Script para probar una API key específica
# Uso: ./scripts/test-specific-key.sh

API_KEY="${OPENAI_API_KEY:-YOUR_OPENAI_API_KEY_HERE}"

echo "=================================================="
echo "🔍 TEST OPENAI API KEY"
echo "=================================================="
echo ""
echo "Key length: ${#API_KEY} caracteres"
echo "Key prefix: ${API_KEY:0:10}..."
echo ""

# Test 1: Verificar key con endpoint de modelos
echo "📍 Test 1: Verificando key con OpenAI API..."
echo ""

MODELS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.openai.com/v1/models" 2>&1)

HTTP_CODE=$(echo "$MODELS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$MODELS_RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API Key: VÁLIDA"
  echo ""
  echo "La key funciona correctamente con OpenAI API."
  echo ""
  
  # Verificar si whisper está disponible
  if echo "$RESPONSE_BODY" | grep -q "whisper"; then
    echo "✅ Whisper API disponible"
  else
    echo "⚠️  Whisper no encontrado en respuesta (puede ser normal)"
  fi
  
  echo ""
  echo "=================================================="
  echo "✅ RESULTADO: API KEY VÁLIDA"
  echo "=================================================="
  echo ""
  echo "La key está funcionando. Puedes configurarla en Firebase:"
  echo ""
  echo "  firebase functions:config:set openai.key=\"YOUR_OPENAI_API_KEY_HERE\""
  echo ""
  
else
  echo "❌ API Key: INVÁLIDA o REVOCADA"
  echo ""
  echo "Respuesta de OpenAI:"
  echo "$RESPONSE_BODY" | head -20
  echo ""
  
  if [ "$HTTP_CODE" = "401" ]; then
    echo "❌ ERROR: API key inválida o revocada"
  elif [ "$HTTP_CODE" = "429" ]; then
    echo "⚠️  Rate limit alcanzado (pero la key es válida)"
  else
    echo "⚠️  Error desconocido: $HTTP_CODE"
  fi
  
  echo ""
  echo "=================================================="
  echo "❌ RESULTADO: API KEY INVÁLIDA"
  echo "=================================================="
fi

echo ""

