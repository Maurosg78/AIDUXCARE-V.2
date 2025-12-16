#!/bin/bash
# Script rápido de verificación de estado

echo "🔍 VERIFICACIÓN DE ESTADO - AIDUXCARE.COM"
echo "=========================================="
echo ""

# Firebase
echo "📋 Firebase:"
echo "   CLI: $(firebase --version 2>/dev/null || echo 'NO INSTALADO')"
echo "   Proyecto: $(firebase use 2>&1 | grep -v 'Now using' || echo 'NO CONFIGURADO')"
echo ""

# Archivos
echo "📁 Archivos clave:"
echo "   PublicLandingPage.tsx: $(test -f src/pages/PublicLandingPage.tsx && echo '✅' || echo '❌')"
echo "   deploy.sh: $(test -f scripts/deploy.sh && echo '✅' || echo '❌')"
echo "   quick-deploy.sh: $(test -f scripts/quick-deploy.sh && echo '✅' || echo '❌')"
echo "   firebase.json: $(test -f firebase.json && echo '✅' || echo '❌')"
echo ""

# Router
echo "🔗 Router:"
if grep -q "PublicLandingPage" src/router/router.tsx 2>/dev/null; then
    echo "   ✅ PublicLandingPage configurado en router"
    echo "   Ruta '/': $(grep -A 1 "path: '/'" src/router/router.tsx | grep PublicLandingPage > /dev/null && echo 'PublicLandingPage' || echo 'OTRO')"
else
    echo "   ❌ PublicLandingPage NO configurado"
fi
echo ""

# Build
echo "📦 Build:"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "   ✅ dist/ existe"
    echo "   Tamaño: $(du -sh dist 2>/dev/null | cut -f1 || echo 'N/A')"
else
    echo "   ⚠️  dist/ no existe (ejecutar: npm run build)"
fi
echo ""

# DNS (si está configurado)
echo "🌐 DNS (verificación básica):"
if command -v dig &> /dev/null; then
    DNS_A=$(dig +short aiduxcare.com A 2>/dev/null | head -1)
    if [ -n "$DNS_A" ]; then
        echo "   ✅ aiduxcare.com resuelve a: $DNS_A"
    else
        echo "   ⚠️  aiduxcare.com no resuelve aún (normal si DNS no está configurado)"
    fi
else
    echo "   ⚠️  dig no disponible (instalar: brew install bind)"
fi
echo ""

echo "✅ Verificación completada"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar dominio en Firebase Console"
echo "   2. Configurar DNS en Porkbun"
echo "   3. Ejecutar: ./scripts/quick-deploy.sh"
