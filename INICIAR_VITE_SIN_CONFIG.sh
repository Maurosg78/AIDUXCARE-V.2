#!/bin/bash
# Iniciar Vite SIN archivo de configuración para evitar problemas

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 Iniciando Vite sin configuración..."

# Matar procesos
pkill -9 vite 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
sleep 1

# Limpiar cache
rm -rf node_modules/.vite .vite 2>/dev/null || true

# Mover vite.config.ts temporalmente
if [ -f "vite.config.ts" ]; then
    mv vite.config.ts vite.config.ts.disabled
    echo "⚠️  vite.config.ts deshabilitado temporalmente"
fi

# Iniciar Vite con flags de línea de comandos (sin config)
echo "🚀 Iniciando Vite..."
node node_modules/vite/bin/vite.js \
    --port 5174 \
    --host \
    --force \
    --clearScreen false

# Restaurar config al salir
if [ -f "vite.config.ts.disabled" ]; then
    mv vite.config.ts.disabled vite.config.ts
fi

