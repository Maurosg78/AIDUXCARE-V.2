#!/bin/bash
# Script simple para matar procesos bloqueados

echo "Matando procesos vite..."
pkill -9 vite 2>/dev/null

echo "Matando procesos node relacionados con dev..."
pkill -9 -f "node.*dev" 2>/dev/null
pkill -9 -f "npm.*dev" 2>/dev/null

echo "Matando procesos tsx..."
pkill -9 tsx 2>/dev/null

echo "Liberando puertos..."
lsof -ti:5174 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "✅ Procesos eliminados"
echo ""
echo "Ahora ejecuta manualmente:"
echo "  cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2"
echo "  node_modules/.bin/vite --port 5174 --host"

