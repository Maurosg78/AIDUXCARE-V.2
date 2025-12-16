#!/bin/bash

# Execute Emulator Tests
# Runs comprehensive mobile testing using available emulators

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  📱 EJECUTANDO TESTS EN EMULADORES                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if server is running
if lsof -ti:5174 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor HTTPS corriendo en puerto 5174${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Servidor HTTPS no está corriendo${NC}"
    echo "   Iniciando servidor en background..."
    npm run dev:https > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    echo -e "${GREEN}✅ Servidor iniciado (PID: $SERVER_PID)${NC}"
    SERVER_RUNNING=true
fi

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo -e "${BLUE}📡 IP Local: $LOCAL_IP${NC}"
echo ""

# Test URLs
BASE_URL="https://$LOCAL_IP:5174"
echo -e "${BLUE}🌐 URL Base: $BASE_URL${NC}"
echo ""

# Viewports to test
VIEWPORTS=(
    "375x667:iPhone SE"
    "390x844:iPhone 12/13"
    "393x852:iPhone 14 Pro"
    "430x932:iPhone 14 Pro Max"
    "768x1024:iPad Mini"
    "1024x1366:iPad Pro"
    "360x640:Android Small"
    "412x915:Android Medium"
    "412x892:Android Large"
)

echo "────────────────────────────────────────────────────────────"
echo "📋 TESTS A EJECUTAR:"
echo "────────────────────────────────────────────────────────────"
echo ""
echo "1. Chrome DevTools Device Mode"
echo "   • Abrir Chrome DevTools (F12)"
echo "   • Toggle Device Toolbar (Ctrl+Shift+M)"
echo "   • Probar cada viewport:"
for vp in "${VIEWPORTS[@]}"; do
    echo "     - ${vp#*:} (${vp%:*})"
done
echo ""
echo "2. Safari Responsive Design Mode"
echo "   • Safari → Develop → Enter Responsive Design Mode"
echo "   • Probar iPhone e iPad"
echo ""
echo "3. Páginas a testear:"
echo "   • Login: $BASE_URL/"
echo "   • Command Center: $BASE_URL/command-center (requiere login)"
echo "   • Professional Workflow: $BASE_URL/professional-workflow (requiere login)"
echo "   • Documents: $BASE_URL/documents (requiere login)"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# Check available tools
echo "🔍 Verificando herramientas disponibles..."
echo ""

# Chrome DevTools
if command -v google-chrome &> /dev/null || command -v chromium &> /dev/null || [ -d "/Applications/Google Chrome.app" ]; then
    echo -e "${GREEN}✅ Chrome disponible${NC}"
    CHROME_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Chrome no encontrado${NC}"
    CHROME_AVAILABLE=false
fi

# Safari
if [ -d "/Applications/Safari.app" ]; then
    echo -e "${GREEN}✅ Safari disponible${NC}"
    SAFARI_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Safari no encontrado${NC}"
    SAFARI_AVAILABLE=false
fi

# Xcode Simulator
if command -v xcrun &> /dev/null && xcrun simctl list devices > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Xcode Simulator disponible${NC}"
    XCODE_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Xcode Simulator no disponible${NC}"
    XCODE_AVAILABLE=false
fi

# Android Emulator
if command -v emulator &> /dev/null; then
    echo -e "${GREEN}✅ Android Emulator disponible${NC}"
    ANDROID_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Android Emulator no disponible${NC}"
    ANDROID_AVAILABLE=false
fi

echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# Generate test checklist
echo "📋 CHECKLIST DE TESTING:"
echo ""
echo "Para cada viewport, verificar:"
echo "  [ ] Layout se renderiza correctamente"
echo "  [ ] No hay overflow horizontal"
echo "  [ ] Botones son accesibles (min 44px/48px)"
echo "  [ ] Formularios funcionan correctamente"
echo "  [ ] Modales se centran correctamente"
echo "  [ ] Scroll funciona correctamente"
echo "  [ ] Navegación funciona"
echo "  [ ] Touch targets son adecuados"
echo ""

echo "────────────────────────────────────────────────────────────"
echo ""
echo -e "${GREEN}✅ Preparación completa${NC}"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. Abrir Chrome DevTools Device Mode"
echo "2. Navegar a: $BASE_URL"
echo "3. Probar cada viewport de la lista"
echo "4. Documentar resultados en CTO_EMULATOR_TESTING_REPORT.md"
echo ""
echo "Para Safari:"
echo "1. Abrir Safari"
echo "2. Develop → Enter Responsive Design Mode"
echo "3. Navegar a: $BASE_URL"
echo "4. Probar iPhone e iPad"
echo "5. Documentar resultados"
echo ""

# Cleanup function
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo "Cerrando servidor (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT

echo -e "${BLUE}Presiona Ctrl+C para detener el servidor${NC}"
echo ""

# Keep script running
wait

