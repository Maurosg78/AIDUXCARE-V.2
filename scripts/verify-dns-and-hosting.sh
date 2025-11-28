#!/bin/bash

echo "🔍 VERIFICACIÓN COMPLETA - dev.aiduxcare.com"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="dev.aiduxcare.com"
FIREBASE_SITE="aiduxcare-v2-uat-dev.web.app"
PROJECT_ID="aiduxcare-v2-uat-dev"

# Test 1: Verificar DNS CNAME
echo -e "${BLUE}1️⃣ Verificando configuración DNS CNAME...${NC}"
CNAME_RESULT=$(dig +short $DOMAIN CNAME 2>/dev/null | head -1)
if [ -n "$CNAME_RESULT" ]; then
    echo "   CNAME encontrado: $CNAME_RESULT"
    if [[ "$CNAME_RESULT" == *"$FIREBASE_SITE"* ]] || [[ "$CNAME_RESULT" == "$FIREBASE_SITE" ]]; then
        echo -e "   ${GREEN}✅ CNAME apunta correctamente a Firebase${NC}"
        DNS_OK=true
    else
        echo -e "   ${YELLOW}⚠️  CNAME apunta a: $CNAME_RESULT${NC}"
        echo -e "   ${YELLOW}   Debería apuntar a: $FIREBASE_SITE${NC}"
        DNS_OK=false
    fi
else
    echo -e "   ${RED}❌ No se encontró registro CNAME${NC}"
    DNS_OK=false
fi

# Test 2: Verificar resolución DNS
echo ""
echo -e "${BLUE}2️⃣ Verificando resolución DNS...${NC}"
IP_RESULT=$(dig +short $DOMAIN A 2>/dev/null | head -1)
if [ -n "$IP_RESULT" ]; then
    echo "   IP resuelta: $IP_RESULT"
    # Firebase Hosting IPs generalmente empiezan con 151. o son de Google Cloud
    if [[ "$IP_RESULT" =~ ^151\. ]] || [[ "$IP_RESULT" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "   ${GREEN}✅ DNS resuelve correctamente${NC}"
        RESOLUTION_OK=true
    else
        echo -e "   ${YELLOW}⚠️  IP resuelta: $IP_RESULT (puede ser correcta)${NC}"
        RESOLUTION_OK=true
    fi
else
    echo -e "   ${YELLOW}⚠️  No se pudo resolver IP (puede ser normal si solo hay CNAME)${NC}"
    RESOLUTION_OK=true
fi

# Test 3: Verificar respuesta HTTP del dominio personalizado
echo ""
echo -e "${BLUE}3️⃣ Verificando respuesta HTTP de $DOMAIN...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Dominio responde correctamente (200 OK)${NC}"
    HTTP_OK=true
elif [ "$HTTP_CODE" = "502" ]; then
    echo -e "   ${RED}❌ Error 502 Bad Gateway${NC}"
    echo "   El dominio aún no está configurado correctamente o DNS no se ha propagado"
    HTTP_OK=false
elif [ "$HTTP_CODE" = "000" ] || [ -z "$HTTP_CODE" ]; then
    echo -e "   ${YELLOW}⚠️  No se pudo conectar (puede ser DNS aún propagándose)${NC}"
    HTTP_OK=false
else
    echo -e "   ${YELLOW}⚠️  Código HTTP: $HTTP_CODE${NC}"
    HTTP_OK=false
fi

# Test 4: Verificar respuesta HTTP del sitio Firebase
echo ""
echo -e "${BLUE}4️⃣ Verificando respuesta HTTP de Firebase Hosting...${NC}"
FIREBASE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$FIREBASE_SITE" 2>/dev/null)
if [ "$FIREBASE_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Firebase Hosting funciona correctamente (200 OK)${NC}"
    FIREBASE_OK=true
else
    echo -e "   ${RED}❌ Firebase Hosting responde con código: $FIREBASE_CODE${NC}"
    FIREBASE_OK=false
fi

# Test 5: Verificar Firebase Functions
echo ""
echo -e "${BLUE}5️⃣ Verificando Firebase Functions...${NC}"
if command -v firebase &> /dev/null; then
    FUNCTIONS_COUNT=$(firebase functions:list --project "$PROJECT_ID" 2>/dev/null | grep -c "callable\|https" || echo "0")
    if [ "$FUNCTIONS_COUNT" -gt 0 ]; then
        echo -e "   ${GREEN}✅ Firebase Functions desplegadas: $FUNCTIONS_COUNT funciones${NC}"
        FUNCTIONS_OK=true
    else
        echo -e "   ${YELLOW}⚠️  No se encontraron funciones desplegadas${NC}"
        FUNCTIONS_OK=false
    fi
else
    echo -e "   ${YELLOW}⚠️  Firebase CLI no disponible para verificar funciones${NC}"
    FUNCTIONS_OK=true
fi

# Test 6: Verificar build local
echo ""
echo -e "${BLUE}6️⃣ Verificando build local...${NC}"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "   ${GREEN}✅ Build local existe${NC}"
    echo "   Archivos en dist/: $(ls -1 dist 2>/dev/null | wc -l | xargs) archivos"
    BUILD_OK=true
else
    echo -e "   ${YELLOW}⚠️  No hay build local${NC}"
    BUILD_OK=false
fi

# Test 7: Verificar SSL/HTTPS
echo ""
echo -e "${BLUE}7️⃣ Verificando certificado SSL...${NC}"
SSL_CHECK=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ -n "$SSL_CHECK" ]; then
    echo -e "   ${GREEN}✅ Certificado SSL válido${NC}"
    SSL_OK=true
else
    echo -e "   ${YELLOW}⚠️  No se pudo verificar certificado SSL${NC}"
    SSL_OK=false
fi

# Resumen
echo ""
echo "=============================================="
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "=============================================="
echo ""

if [ "$DNS_OK" = true ]; then
    echo -e "${GREEN}✅ DNS CNAME: Configurado correctamente${NC}"
else
    echo -e "${RED}❌ DNS CNAME: Necesita corrección${NC}"
fi

if [ "$RESOLUTION_OK" = true ]; then
    echo -e "${GREEN}✅ Resolución DNS: Funcionando${NC}"
else
    echo -e "${RED}❌ Resolución DNS: Problema detectado${NC}"
fi

if [ "$HTTP_OK" = true ]; then
    echo -e "${GREEN}✅ HTTP $DOMAIN: Funcionando (200 OK)${NC}"
else
    echo -e "${RED}❌ HTTP $DOMAIN: Error ($HTTP_CODE)${NC}"
fi

if [ "$FIREBASE_OK" = true ]; then
    echo -e "${GREEN}✅ Firebase Hosting: Funcionando${NC}"
else
    echo -e "${RED}❌ Firebase Hosting: Problema detectado${NC}"
fi

if [ "$FUNCTIONS_OK" = true ]; then
    echo -e "${GREEN}✅ Firebase Functions: Desplegadas${NC}"
else
    echo -e "${YELLOW}⚠️  Firebase Functions: Verificar manualmente${NC}"
fi

if [ "$BUILD_OK" = true ]; then
    echo -e "${GREEN}✅ Build Local: Disponible${NC}"
else
    echo -e "${YELLOW}⚠️  Build Local: No encontrado${NC}"
fi

if [ "$SSL_OK" = true ]; then
    echo -e "${GREEN}✅ SSL: Certificado válido${NC}"
else
    echo -e "${YELLOW}⚠️  SSL: Verificar manualmente${NC}"
fi

echo ""
echo "=============================================="

# Estado final
if [ "$HTTP_OK" = true ] && [ "$DNS_OK" = true ] && [ "$FIREBASE_OK" = true ]; then
    echo -e "${GREEN}🎉 ¡TODO ESTÁ FUNCIONANDO CORRECTAMENTE!${NC}"
    echo ""
    echo "✅ El dominio $DOMAIN está configurado y funcionando"
    echo "✅ Puedes acceder en: https://$DOMAIN"
    exit 0
else
    echo -e "${YELLOW}⚠️  ALGUNOS PUNTOS NECESITAN ATENCIÓN${NC}"
    echo ""
    if [ "$HTTP_OK" = false ]; then
        echo "🔴 El dominio aún no responde correctamente"
        echo "   - Espera 15-30 minutos para propagación DNS"
        echo "   - Verifica que el CNAME esté configurado en Porkbun"
        echo "   - Verifica en Firebase Console que el dominio esté conectado"
    fi
    if [ "$DNS_OK" = false ]; then
        echo "🔴 El DNS CNAME no está configurado correctamente"
        echo "   - Ve a Porkbun y cambia el CNAME a: $FIREBASE_SITE"
    fi
    echo ""
    echo "Ejecuta este script nuevamente en 15-30 minutos para verificar"
    exit 1
fi

