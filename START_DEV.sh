#!/bin/bash
# Script para iniciar el servidor de desarrollo

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

# Verificar variables de entorno
node scripts/check-env.cjs

# Iniciar Vite directamente
echo "Iniciando Vite..."
node_modules/.bin/vite --port 5174 --host

