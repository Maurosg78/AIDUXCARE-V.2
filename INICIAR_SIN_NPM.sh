#!/bin/bash
# Script para iniciar sin pasar por npm (evita problemas con Volta/npm)

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 Iniciando sin npm..."

# 1. Verificar variables de entorno (sin npm)
echo "1. Verificando variables de entorno..."
node scripts/check-env.cjs
if [ $? -ne 0 ]; then
    echo "❌ Error en check-env"
    exit 1
fi

# 2. Matar procesos existentes
echo "2. Limpiando procesos..."
pkill -9 vite 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
sleep 1

# 3. Limpiar cache
echo "3. Limpiando cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

# 4. Iniciar Vite directamente con Node
echo "4. Iniciando Vite..."
echo "   Puerto: 5174"
echo "   Host: true"
echo ""

# Usar node directamente para ejecutar vite
node node_modules/vite/bin/vite.js --port 5174 --host

