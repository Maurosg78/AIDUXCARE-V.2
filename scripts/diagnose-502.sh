#!/bin/bash

echo "🔍 DIAGNÓSTICO 502 BAD GATEWAY - dev.aiduxcare.com"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Firebase CLI
echo "1️⃣ Verificando Firebase CLI..."
if command -v firebase &> /dev/null; then
    echo -e "${GREEN}✅ Firebase CLI instalado${NC}"
    firebase --version
else
    echo -e "${RED}❌ Firebase CLI no encontrado${NC}"
    echo "   Instala con: npm install -g firebase-tools"
    exit 1
fi

echo ""
echo "2️⃣ Verificando autenticación Firebase..."
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✅ Autenticado en Firebase${NC}"
    CURRENT_PROJECT=$(firebase use 2>&1 | grep -oP '(?<=Using )\S+' || echo "none")
    echo "   Proyecto actual: $CURRENT_PROJECT"
else
    echo -e "${YELLOW}⚠️  No autenticado o sin acceso${NC}"
    echo "   Ejecuta: firebase login"
fi

echo ""
echo "3️⃣ Verificando proyecto configurado..."
if [ -f ".firebaserc" ]; then
    PROJECT_ID=$(grep -oP '(?<="default": ")[^"]+' .firebaserc)
    echo -e "${GREEN}✅ Proyecto configurado: $PROJECT_ID${NC}"
    
    # Check if project matches
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
        echo -e "${YELLOW}⚠️  Cambiando a proyecto correcto...${NC}"
        firebase use "$PROJECT_ID"
    fi
else
    echo -e "${RED}❌ No se encontró .firebaserc${NC}"
    exit 1
fi

echo ""
echo "4️⃣ Verificando Firebase Hosting..."
HOSTING_URL=$(firebase hosting:sites:list 2>/dev/null | grep -i "dev\|aiduxcare" | head -1 || echo "")
if [ -n "$HOSTING_URL" ]; then
    echo -e "${GREEN}✅ Hosting configurado${NC}"
    echo "   $HOSTING_URL"
else
    echo -e "${YELLOW}⚠️  No se encontró sitio de hosting específico${NC}"
fi

echo ""
echo "5️⃣ Verificando Firebase Functions..."
if [ -d "functions" ]; then
    echo -e "${GREEN}✅ Directorio functions encontrado${NC}"
    
    # Check if functions are deployed
    echo "   Verificando funciones desplegadas..."
    DEPLOYED_FUNCTIONS=$(firebase functions:list 2>/dev/null | grep -c "vertexAIProxy\|processWithVertexAI\|sendSMS" || echo "0")
    if [ "$DEPLOYED_FUNCTIONS" -gt 0 ]; then
        echo -e "${GREEN}✅ Funciones desplegadas encontradas${NC}"
        firebase functions:list 2>/dev/null | head -10
    else
        echo -e "${YELLOW}⚠️  No se encontraron funciones desplegadas${NC}"
        echo "   Esto podría causar el 502 si las funciones son requeridas"
    fi
else
    echo -e "${YELLOW}⚠️  Directorio functions no encontrado${NC}"
fi

echo ""
echo "6️⃣ Verificando build local..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ Build local existe${NC}"
    echo "   Archivos en dist/: $(ls -1 dist | wc -l | xargs) archivos"
else
    echo -e "${YELLOW}⚠️  No hay build local${NC}"
    echo "   Ejecuta: npm run build"
fi

echo ""
echo "7️⃣ Verificando configuración de dominio..."
echo "   Verificando configuración DNS y dominio personalizado..."
DOMAIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://dev.aiduxcare.com 2>/dev/null || echo "000")
if [ "$DOMAIN_CHECK" = "502" ]; then
    echo -e "${RED}❌ Confirmado: 502 Bad Gateway${NC}"
elif [ "$DOMAIN_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Dominio responde correctamente (200)${NC}"
elif [ "$DOMAIN_CHECK" = "000" ]; then
    echo -e "${YELLOW}⚠️  No se pudo conectar al dominio${NC}"
else
    echo -e "${YELLOW}⚠️  Dominio responde con código: $DOMAIN_CHECK${NC}"
fi

echo ""
echo "=================================================="
echo "📋 RESUMEN Y RECOMENDACIONES"
echo "=================================================="
echo ""

if [ "$DOMAIN_CHECK" = "502" ]; then
    echo -e "${RED}🔴 PROBLEMA CONFIRMADO: 502 Bad Gateway${NC}"
    echo ""
    echo "Posibles causas:"
    echo "1. Firebase Functions no están desplegadas o están fallando"
    echo "2. El dominio personalizado no está correctamente configurado"
    echo "3. El proyecto Firebase tiene problemas de configuración"
    echo ""
    echo "SOLUCIONES RECOMENDADAS:"
    echo ""
    echo "A) Redesplegar Firebase Functions:"
    echo "   cd functions"
    echo "   npm install"
    echo "   cd .."
    echo "   firebase deploy --only functions"
    echo ""
    echo "B) Redesplegar Firebase Hosting:"
    echo "   npm run build"
    echo "   firebase deploy --only hosting"
    echo ""
    echo "C) Verificar logs de Firebase Functions:"
    echo "   firebase functions:log"
    echo ""
    echo "D) Verificar configuración del dominio en Firebase Console:"
    echo "   https://console.firebase.google.com/project/$PROJECT_ID/hosting"
    echo ""
    echo "E) Redesplegar todo:"
    echo "   npm run build"
    echo "   firebase deploy"
fi

echo ""
echo "=================================================="

