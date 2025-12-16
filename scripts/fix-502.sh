#!/bin/bash

echo "🔧 SOLUCIONANDO 502 BAD GATEWAY - dev.aiduxcare.com"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID="aiduxcare-v2-uat-dev"

# Step 1: Ensure correct project
echo -e "${BLUE}1️⃣ Configurando proyecto Firebase...${NC}"
firebase use "$PROJECT_ID"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Proyecto configurado: $PROJECT_ID${NC}"
else
    echo -e "${RED}❌ Error configurando proyecto${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2️⃣ Verificando y actualizando Firebase Functions...${NC}"
cd functions
if [ -f "package.json" ]; then
    echo "   Instalando dependencias..."
    npm install --silent
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencias instaladas${NC}"
    else
        echo -e "${YELLOW}⚠️  Advertencia: Algunas dependencias pueden tener problemas${NC}"
    fi
else
    echo -e "${RED}❌ package.json no encontrado en functions/${NC}"
    exit 1
fi
cd ..

echo ""
echo -e "${BLUE}3️⃣ Desplegando Firebase Functions...${NC}"
firebase deploy --only functions --project "$PROJECT_ID"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions desplegadas exitosamente${NC}"
else
    echo -e "${RED}❌ Error desplegando functions${NC}"
    echo "   Revisa los logs arriba para más detalles"
    exit 1
fi

echo ""
echo -e "${BLUE}4️⃣ Construyendo aplicación...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completado${NC}"
    
    # Verify dist exists
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✅ dist/index.html verificado${NC}"
    else
        echo -e "${RED}❌ Error: dist/index.html no encontrado${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Error en build${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}5️⃣ Verificando sitios de hosting disponibles...${NC}"
HOSTING_SITES=$(firebase hosting:sites:list 2>/dev/null | grep -E "aiduxcare" | awk '{print $1}' | head -1)
if [ -z "$HOSTING_SITES" ]; then
    HOSTING_SITES="$PROJECT_ID"
fi
echo "   Sitios encontrados: $HOSTING_SITES"

echo ""
echo -e "${BLUE}6️⃣ Desplegando Firebase Hosting...${NC}"
echo "   Desplegando a: $PROJECT_ID (sitio por defecto)"
firebase deploy --only hosting --project "$PROJECT_ID"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Hosting desplegado exitosamente${NC}"
    echo ""
    echo "   URLs disponibles:"
    echo "   - https://$PROJECT_ID.web.app"
    echo "   - https://aiduxcare-app.web.app (si existe)"
else
    echo -e "${RED}❌ Error desplegando hosting${NC}"
    echo ""
    echo "   Intenta desplegar manualmente:"
    echo "   firebase deploy --only hosting --project $PROJECT_ID"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ DESPLIEGUE COMPLETADO${NC}"
echo "=================================================="
echo ""
echo "⏳ Espera 1-2 minutos para que los cambios se propaguen..."
echo ""
echo "🔍 VERIFICACIÓN:"
echo "  1. Verifica el sitio de Firebase:"
echo "     curl -I https://$PROJECT_ID.web.app"
echo ""
echo "  2. Verifica el dominio personalizado:"
echo "     curl -I https://dev.aiduxcare.com"
echo ""
echo "📋 SI EL PROBLEMA PERSISTE:"
echo ""
echo "  🔴 PROBLEMA MÁS COMÚN: Dominio personalizado no conectado"
echo "     1. Ve a Firebase Console:"
echo "        https://console.firebase.google.com/project/$PROJECT_ID/hosting"
echo ""
echo "     2. Ve a la sección 'Dominios personalizados'"
echo ""
echo "     3. Si dev.aiduxcare.com NO aparece:"
echo "        - Haz clic en 'Agregar dominio personalizado'"
echo "        - Ingresa: dev.aiduxcare.com"
echo "        - Sigue las instrucciones para configurar DNS"
echo ""
echo "     4. Si dev.aiduxcare.com SÍ aparece pero está desconectado:"
echo "        - Verifica que esté conectado al sitio correcto"
echo "        - El sitio debe ser: $PROJECT_ID o aiduxcare-app"
echo ""
echo "  📊 Ver logs de Functions (por si hay rewrites que fallan):"
echo "     firebase functions:log --limit 20"
echo ""
echo "  🌐 Verificar configuración DNS:"
echo "     dig dev.aiduxcare.com"
echo "     nslookup dev.aiduxcare.com"
echo ""
echo "  📖 Ver guía completa:"
echo "     docs/TROUBLESHOOTING_502.md"
echo ""

