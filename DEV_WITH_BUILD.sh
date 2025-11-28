#!/bin/bash
# Solución alternativa: Build + Serve (evita problemas con Vite dev server)

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 Modo Desarrollo con Build + Serve"
echo ""

# Verificar entorno
echo "1. Verificando entorno..."
node scripts/check-env.cjs

if [ $? -ne 0 ]; then
    echo "❌ Error en check-env"
    exit 1
fi

echo ""
echo "2. Haciendo build..."
node node_modules/vite/bin/vite.js build --watch --mode development

# Nota: --watch hace rebuild automático cuando cambias archivos
# Luego en otra terminal ejecuta: npx serve dist -p 5174

