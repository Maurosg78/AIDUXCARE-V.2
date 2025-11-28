#!/bin/bash
# Script simple para iniciar Vite sin pasar por npm

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

# Verificar entorno primero
node scripts/check-env.cjs

# Si check-env funciona, iniciar Vite
if [ $? -eq 0 ]; then
    echo ""
    echo "🚀 Iniciando Vite en puerto 5174..."
    echo ""
    # Usar exec para evitar que el proceso se mate
    exec node node_modules/vite/bin/vite.js --port 5174 --host
else
    echo "❌ Error en verificación de entorno"
    exit 1
fi

