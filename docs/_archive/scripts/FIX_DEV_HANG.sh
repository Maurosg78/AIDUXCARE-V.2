#!/bin/bash
# Script para iniciar dev server sin que se cuelgue

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 Iniciando servidor de desarrollo..."

# Matar procesos existentes
pkill -9 vite 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
sleep 1

# Verificar entorno
echo "1. Verificando entorno..."
node scripts/check-env.cjs

if [ $? -ne 0 ]; then
    echo "❌ Error en check-env"
    exit 1
fi

echo ""
echo "2. Iniciando Vite..."
echo "   Puerto: 5174"
echo "   Host: true"
echo ""

# Iniciar Vite directamente con node (evita problemas con npm)
# Usar exec para reemplazar el proceso shell y evitar que se mate
exec node node_modules/vite/bin/vite.js --port 5174 --host

