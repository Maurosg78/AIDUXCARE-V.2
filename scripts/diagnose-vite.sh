#!/bin/bash
# Diagnóstico específico de Vite - Tests progresivos

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 DIAGNÓSTICO ESPECÍFICO DE VITE"
echo "==================================="
echo ""

# TEST 1: Vite bin existe y es ejecutable
echo "TEST 1: Verificar Vite bin"
echo "----------------------------"
if [ -f node_modules/vite/bin/vite.js ]; then
    echo "✅ vite.js existe"
    ls -lh node_modules/vite/bin/vite.js
else
    echo "❌ vite.js NO existe"
    exit 1
fi
echo ""

# TEST 2: Vite --version (comando más simple)
echo "TEST 2: Vite --version (timeout 5s)"
echo "------------------------------------"
timeout 5 node node_modules/vite/bin/vite.js --version 2>&1
VITE_VERSION_EXIT=$?
if [ $VITE_VERSION_EXIT -eq 0 ]; then
    echo "✅ Vite --version funciona"
elif [ $VITE_VERSION_EXIT -eq 124 ]; then
    echo "❌ TIMEOUT: Vite se cuelga incluso con --version"
    echo "   Esto indica un problema grave con Vite o Node"
else
    echo "❌ ERROR: Vite --version falló con código $VITE_VERSION_EXIT"
fi
echo ""

# TEST 3: Vite --help
echo "TEST 3: Vite --help (timeout 5s)"
echo "---------------------------------"
timeout 5 node node_modules/vite/bin/vite.js --help 2>&1 | head -10
VITE_HELP_EXIT=$?
if [ $VITE_HELP_EXIT -eq 0 ]; then
    echo "✅ Vite --help funciona"
elif [ $VITE_HELP_EXIT -eq 124 ]; then
    echo "❌ TIMEOUT: Vite se cuelga con --help"
else
    echo "⚠️ Vite --help falló (puede ser normal)"
fi
echo ""

# TEST 4: Vite con config mínima
echo "TEST 4: Vite con config mínima (timeout 10s)"
echo "----------------------------------------------"
cat > /tmp/vite-test.config.js << 'EOF'
export default {
  root: '.',
  server: {
    port: 5174,
  },
};
EOF

timeout 10 node node_modules/vite/bin/vite.js --config /tmp/vite-test.config.js --port 5174 2>&1 | head -5 &
VITE_PID=$!
sleep 3
if ps -p $VITE_PID > /dev/null 2>&1; then
    echo "⚠️ Vite inició pero sigue corriendo (puede ser normal)"
    kill $VITE_PID 2>/dev/null
else
    echo "❌ Vite no inició o se colgó"
fi
rm -f /tmp/vite-test.config.js
echo ""

# TEST 5: Verificar imports de vite.config.ts
echo "TEST 5: Verificar imports de vite.config.ts"
echo "---------------------------------------------"
node -e "
import('./vite.config.ts').then(config => {
  console.log('✅ vite.config.ts se puede importar');
  console.log('Config keys:', Object.keys(config.default || {}));
}).catch(err => {
  console.log('❌ Error importando vite.config.ts:', err.message);
  process.exit(1);
});
" 2>&1
echo ""

# TEST 6: Verificar dependencias de Vite
echo "TEST 6: Verificar dependencias críticas de Vite"
echo "------------------------------------------------"
echo -n "esbuild: "
[ -d node_modules/esbuild ] && echo "✅" || echo "❌"
echo -n "rollup: "
[ -d node_modules/rollup ] && echo "✅" || echo "❌"
echo -n "@vitejs/plugin-react: "
[ -d node_modules/@vitejs/plugin-react ] && echo "✅" || echo "❌"
echo ""

# TEST 7: Verificar variables de entorno
echo "TEST 7: Verificar variables de entorno"
echo "---------------------------------------"
node scripts/check-env.cjs 2>&1 | grep -E "✅|❌" || echo "⚠️ check-env no produjo salida esperada"
echo ""

# TEST 8: Test de I/O del sistema de archivos
echo "TEST 8: Test de I/O del sistema de archivos"
echo "---------------------------------------------"
echo "Leyendo package.json..."
timeout 2 cat package.json > /dev/null && echo "✅ Lectura OK" || echo "❌ Lectura falló"
echo "Escribiendo test file..."
timeout 2 echo "test" > /tmp/vite-diagnose-test.txt && echo "✅ Escritura OK" && rm /tmp/vite-diagnose-test.txt || echo "❌ Escritura falló"
echo ""

# TEST 9: Verificar procesos bloqueantes
echo "TEST 9: Verificar procesos bloqueantes"
echo "--------------------------------------"
echo "Procesos Node corriendo:"
ps aux | grep node | grep -v grep | head -5 || echo "  Ninguno"
echo ""
echo "Procesos Vite corriendo:"
ps aux | grep vite | grep -v grep || echo "  Ninguno"
echo ""

# TEST 10: Resumen y recomendaciones
echo "TEST 10: Resumen"
echo "-----------------"
echo "✅ Diagnóstico completo"
echo ""
echo "Si Vite se cuelga incluso con --version, el problema puede ser:"
echo "  1. Node.js corrupto o problema con Volta"
echo "  2. Sistema de archivos lento o bloqueado"
echo "  3. Memoria insuficiente"
echo "  4. Proceso zombie bloqueando I/O"
echo ""

