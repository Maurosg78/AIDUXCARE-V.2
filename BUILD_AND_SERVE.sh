#!/bin/bash
# Script completo para build + serve sin npm

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 Build + Serve - Desarrollo"
echo ""

# Verificar entorno
echo "1. Verificando entorno..."
node scripts/check-env.cjs

if [ $? -ne 0 ]; then
    echo "❌ Error en check-env"
    exit 1
fi

echo ""
echo "2. Haciendo build inicial..."
node node_modules/vite/bin/vite.js build --mode development

if [ $? -ne 0 ]; then
    echo "❌ Error en build"
    exit 1
fi

echo ""
echo "✅ Build completado"
echo ""
echo "3. Iniciando servidor en puerto 5174..."
echo "   Abre: http://localhost:5174"
echo ""
echo "   Para rebuild, ejecuta en otra terminal:"
echo "   node node_modules/vite/bin/vite.js build --mode development"
echo ""

# Servir con serve
if command -v serve &> /dev/null; then
    serve dist -p 5174
elif command -v npx &> /dev/null; then
    npx serve dist -p 5174
else
    # Fallback a Python
    cd dist
    python3 -m http.server 5174
fi
