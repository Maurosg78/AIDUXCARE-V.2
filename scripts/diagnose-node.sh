#!/bin/bash
# Diagnóstico específico de Node.js y Volta

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 DIAGNÓSTICO DE NODE.JS Y VOLTA"
echo "==================================="
echo ""

# TEST 1: Node básico
echo "TEST 1: Node básico"
echo "-------------------"
echo -n "Node path: "
which node
echo -n "Node version: "
timeout 2 node --version 2>&1 || echo "TIMEOUT"
echo -n "Node ejecuta código simple: "
timeout 2 node -e "console.log('OK')" 2>&1 || echo "TIMEOUT"
echo ""

# TEST 2: Volta
echo "TEST 2: Volta"
echo "--------------"
echo -n "VOLTA_HOME: "
echo $VOLTA_HOME
echo -n "Volta en PATH: "
echo $PATH | grep -q volta && echo "✅" || echo "❌"
echo -n "Node desde Volta: "
[ -f /Users/mauriciosobarzo/.volta/bin/node ] && echo "✅" || echo "❌"
echo ""

# TEST 3: Node con módulos
echo "TEST 3: Node con módulos ES6"
echo "-----------------------------"
echo -n "Import dinámico simple: "
timeout 3 node -e "import('fs').then(() => console.log('✅')).catch(e => console.log('❌', e.message))" 2>&1 || echo "TIMEOUT"
echo ""

# TEST 4: Node con archivos locales
echo "TEST 4: Node leyendo archivos locales"
echo "--------------------------------------"
echo -n "Leyendo package.json: "
timeout 2 node -e "const fs = require('fs'); fs.readFileSync('package.json', 'utf8'); console.log('✅')" 2>&1 || echo "TIMEOUT o ERROR"
echo ""

# TEST 5: Node ejecutando scripts
echo "TEST 5: Node ejecutando scripts"
echo "-------------------------------"
echo -n "Ejecutando check-env.cjs: "
timeout 5 node scripts/check-env.cjs > /dev/null 2>&1 && echo "✅" || echo "❌ TIMEOUT o ERROR"
echo ""

# TEST 6: Node con Vite bin directamente
echo "TEST 6: Node ejecutando Vite bin"
echo "--------------------------------"
echo -n "Vite bin path existe: "
[ -f node_modules/vite/bin/vite.js ] && echo "✅" || echo "❌"
echo -n "Ejecutando Vite bin con Node: "
timeout 3 node node_modules/vite/bin/vite.js --version 2>&1 | head -1 || echo "TIMEOUT o ERROR"
echo ""

# TEST 7: Verificar permisos
echo "TEST 7: Verificar permisos"
echo "---------------------------"
echo -n "Permisos de node_modules/vite/bin/vite.js: "
ls -l node_modules/vite/bin/vite.js | awk '{print $1, $3, $4}'
echo -n "Ejecutable: "
[ -x node_modules/vite/bin/vite.js ] && echo "✅" || echo "❌"
echo ""

# TEST 8: Variables de entorno
echo "TEST 8: Variables de entorno"
echo "-----------------------------"
echo "NODE_ENV: ${NODE_ENV:-no definido}"
echo "NODE_OPTIONS: ${NODE_OPTIONS:-no definido}"
echo ""

# TEST 9: Desactivar Volta temporalmente
echo "TEST 9: Test sin Volta"
echo "----------------------"
echo "Desactivando Volta temporalmente..."
OLD_PATH=$PATH
export PATH=$(echo $PATH | tr ':' '\n' | grep -v volta | tr '\n' ':')
unset VOLTA_HOME

echo -n "Node path sin Volta: "
which node 2>/dev/null || echo "No encontrado"

echo -n "Node version sin Volta: "
timeout 2 node --version 2>&1 || echo "TIMEOUT"

# Restaurar
export PATH=$OLD_PATH
export VOLTA_HOME=/Users/mauriciosobarzo/.volta
echo ""

# TEST 10: Resumen
echo "TEST 10: Resumen"
echo "-----------------"
echo "✅ Diagnóstico de Node.js completo"
echo ""

