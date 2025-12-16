#!/bin/bash
# Tests de archivos fuente para identificar cuál causa el colgue

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 TESTS DE ARCHIVOS FUENTE"
echo "============================"
echo ""

# Crear config mínima para tests
cat > /tmp/vite-test-src.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src")
    }
  },
  build: {
    outDir: 'dist',
  },
});
EOF

# TEST 1: Verificar que main.tsx existe y es válido
echo "TEST 1: Verificar main.tsx"
echo "--------------------------"
if [ -f src/main.tsx ]; then
    echo "✅ src/main.tsx existe"
    # Verificar sintaxis básica
    timeout 5 node -e "
    const fs = require('fs');
    const content = fs.readFileSync('src/main.tsx', 'utf8');
    if (content.includes('import') && content.includes('React')) {
      console.log('✅ Sintaxis básica OK');
    } else {
      console.log('⚠️ Contenido inusual');
    }
    " 2>&1 || echo "❌ Error leyendo main.tsx"
else
    echo "❌ src/main.tsx NO existe"
fi
echo ""

# TEST 2: Verificar index.html
echo "TEST 2: Verificar index.html"
echo "-----------------------------"
if [ -f index.html ]; then
    echo "✅ index.html existe"
    if grep -q "main.tsx" index.html; then
        echo "✅ index.html referencia main.tsx"
    else
        echo "⚠️ index.html no referencia main.tsx"
    fi
else
    echo "❌ index.html NO existe"
fi
echo ""

# TEST 3: Contar archivos TypeScript/TSX
echo "TEST 3: Contar archivos fuente"
echo "--------------------------------"
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Archivos TS/TSX encontrados: $TS_FILES"
if [ "$TS_FILES" -gt 0 ]; then
    echo "✅ Archivos fuente encontrados"
else
    echo "❌ No se encontraron archivos fuente"
fi
echo ""

# TEST 4: Verificar imports circulares básicos
echo "TEST 4: Verificar imports en main.tsx"
echo "--------------------------------------"
timeout 10 node -e "
const fs = require('fs');
const content = fs.readFileSync('src/main.tsx', 'utf8');
const imports = content.match(/import.*from/g) || [];
console.log('Imports encontrados:', imports.length);
imports.slice(0, 5).forEach(imp => console.log('  -', imp));
" 2>&1 || echo "❌ Error analizando imports"
echo ""

# TEST 5: Test de build con solo main.tsx (si es posible)
echo "TEST 5: Verificar que Vite puede leer los archivos"
echo "---------------------------------------------------"
timeout 15 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-src.js 2>&1 | grep -E "error|Error|ERROR|building|built" | head -10 || echo "⚠️ Build no produjo output esperado"
echo ""

# TEST 6: Verificar dependencias críticas
echo "TEST 6: Verificar dependencias críticas"
echo "----------------------------------------"
echo -n "react: "
[ -d node_modules/react ] && echo "✅" || echo "❌"
echo -n "react-dom: "
[ -d node_modules/react-dom ] && echo "✅" || echo "❌"
echo -n "@vitejs/plugin-react: "
[ -d node_modules/@vitejs/plugin-react ] && echo "✅" || echo "❌"
echo ""

# Limpiar
rm -f /tmp/vite-test-src.js

echo "✅ Tests de archivos fuente completados"

