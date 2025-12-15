#!/bin/bash
# Script completo para limpiar procesos colgados y preparar entorno limpio

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🧹 LIMPIEZA COMPLETA Y FIX"
echo "=========================="
echo ""

# Paso 1: Matar TODOS los procesos relacionados
echo "1. Matando procesos colgados..."
echo "-------------------------------"
pkill -9 -f "vite" 2>/dev/null
pkill -9 -f "node.*vite" 2>/dev/null
pkill -9 -f "find.*vite" 2>/dev/null
pkill -9 -f "npm.*dev" 2>/dev/null
pkill -9 -f "timeout.*vite" 2>/dev/null
sleep 3

# Verificar
REMAINING=$(ps aux | grep -E "vite|node.*vite" | grep -v grep | wc -l | tr -d ' ')
if [ "$REMAINING" -eq "0" ]; then
    echo "✅ Todos los procesos eliminados"
else
    echo "⚠️ Aún quedan $REMAINING procesos, matando agresivamente..."
    ps aux | grep -E "vite|node.*vite" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
    sleep 2
fi
echo ""

# Paso 2: Limpiar archivos temporales
echo "2. Limpiando archivos temporales..."
echo "------------------------------------"
rm -rf .vite 2>/dev/null && echo "✅ .vite eliminado" || echo "  .vite no existía"
rm -rf node_modules/.vite 2>/dev/null && echo "✅ node_modules/.vite eliminado" || echo "  node_modules/.vite no existía"
rm -rf dist 2>/dev/null && echo "✅ dist eliminado" || echo "  dist no existía"
rm -f /tmp/vite-test.config.js 2>/dev/null && echo "✅ /tmp/vite-test.config.js eliminado" || echo "  /tmp/vite-test.config.js no existía"
echo ""

# Paso 3: Liberar puertos
echo "3. Liberando puertos..."
echo "-----------------------"
lsof -ti:5174 | xargs kill -9 2>/dev/null && echo "✅ Puerto 5174 liberado" || echo "  Puerto 5174 ya estaba libre"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ Puerto 5173 liberado" || echo "  Puerto 5173 ya estaba libre"
echo ""

# Paso 4: Verificación final
echo "4. Verificación final..."
echo "------------------------"
echo "Procesos restantes:"
ps aux | grep -E "vite|node.*vite" | grep -v grep || echo "  ✅ Ninguno"
echo ""
echo "Puertos:"
lsof -ti:5174 && echo "  ⚠️ Puerto 5174 aún ocupado" || echo "  ✅ Puerto 5174 libre"
lsof -ti:5173 && echo "  ⚠️ Puerto 5173 aún ocupado" || echo "  ✅ Puerto 5173 libre"
echo ""

# Paso 5: Test rápido de Vite
echo "5. Test rápido de Vite (timeout 5s)..."
echo "---------------------------------------"
timeout 5 node node_modules/vite/bin/vite.js --version 2>&1
VITE_TEST=$?
if [ $VITE_TEST -eq 0 ]; then
    echo "✅ Vite responde correctamente"
elif [ $VITE_TEST -eq 124 ]; then
    echo "❌ Vite aún se cuelga - puede necesitar reinstalación"
else
    echo "⚠️ Vite tiene problemas pero no se cuelga"
fi
echo ""

echo "✅ Limpieza completada"
echo ""
echo "Próximos pasos:"
echo "  1. Si Vite responde: npm run dev"
echo "  2. Si Vite aún se cuelga: npm install vite@latest --force"
echo "  3. Alternativa: bash BUILD_AND_SERVE.sh (build + serve)"

