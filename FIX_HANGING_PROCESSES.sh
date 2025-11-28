#!/bin/bash
# Script para matar procesos colgados de Vite y limpiar

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 FIX: Procesos Colgados de Vite"
echo "==================================="
echo ""

# Paso 1: Identificar procesos colgados
echo "1. Identificando procesos colgados..."
echo "--------------------------------------"
ps aux | grep -E "vite|node.*vite" | grep -v grep || echo "  No se encontraron procesos"
echo ""

# Paso 2: Matar procesos de Vite
echo "2. Matando procesos de Vite..."
echo "-------------------------------"
pkill -9 -f "vite.js" 2>/dev/null && echo "✅ Procesos vite.js eliminados" || echo "  No había procesos vite.js"
pkill -9 -f "node_modules/vite" 2>/dev/null && echo "✅ Procesos node_modules/vite eliminados" || echo "  No había procesos node_modules/vite"
pkill -9 -f "npm run" 2>/dev/null && echo "✅ Procesos npm run eliminados" || echo "  No había procesos npm run"
sleep 2
echo ""

# Paso 3: Verificar que se eliminaron
echo "3. Verificando que se eliminaron..."
echo "------------------------------------"
REMAINING=$(ps aux | grep -E "vite|node.*vite" | grep -v grep | wc -l | tr -d ' ')
if [ "$REMAINING" -eq "0" ]; then
    echo "✅ Todos los procesos eliminados"
else
    echo "⚠️ Aún quedan $REMAINING procesos:"
    ps aux | grep -E "vite|node.*vite" | grep -v grep
    echo ""
    echo "Intentando matar procesos restantes..."
    ps aux | grep -E "vite|node.*vite" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
fi
echo ""

# Paso 4: Limpiar archivos temporales
echo "4. Limpiando archivos temporales..."
echo "------------------------------------"
rm -rf .vite 2>/dev/null && echo "✅ .vite eliminado" || echo "  .vite no existía"
rm -rf node_modules/.vite 2>/dev/null && echo "✅ node_modules/.vite eliminado" || echo "  node_modules/.vite no existía"
rm -rf dist 2>/dev/null && echo "✅ dist eliminado" || echo "  dist no existía"
echo ""

# Paso 5: Liberar puertos
echo "5. Liberando puertos..."
echo "-----------------------"
lsof -ti:5174 | xargs kill -9 2>/dev/null && echo "✅ Puerto 5174 liberado" || echo "  Puerto 5174 ya estaba libre"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ Puerto 5173 liberado" || echo "  Puerto 5173 ya estaba libre"
echo ""

# Paso 6: Verificación final
echo "6. Verificación final..."
echo "------------------------"
echo "Procesos restantes:"
ps aux | grep -E "vite|node.*vite" | grep -v grep || echo "  ✅ Ninguno"
echo ""
echo "Puertos en uso:"
lsof -ti:5174 && echo "  ⚠️ Puerto 5174 aún ocupado" || echo "  ✅ Puerto 5174 libre"
lsof -ti:5173 && echo "  ⚠️ Puerto 5173 aún ocupado" || echo "  ✅ Puerto 5173 libre"
echo ""

echo "✅ Limpieza completada"
echo ""
echo "Ahora puedes ejecutar:"
echo "  npm run dev"
echo "  o"
echo "  bash START_VITE.sh"

