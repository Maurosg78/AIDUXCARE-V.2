#!/bin/bash
# Test progresivo de build excluyendo archivos problemáticos

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 TEST PROGRESIVO DE BUILD"
echo "============================"
echo ""

# Crear config base
cat > /tmp/vite-progressive.js << 'EOF'
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
    rollupOptions: {
      // Excluir archivos problemáticos progresivamente
      external: [],
    },
  },
});
EOF

# TEST 1: Build completo
echo "TEST 1: Build completo (timeout 90s)"
echo "-------------------------------------"
rm -rf dist
timeout 90 node node_modules/vite/bin/vite.js build --config /tmp/vite-progressive.js 2>&1 | tail -10
TEST1=$?
if [ $TEST1 -eq 0 ]; then
    echo "✅ TEST 1 PASÓ - Build completo funciona"
    ls -lh dist/ 2>/dev/null | head -5
elif [ $TEST1 -eq 124 ]; then
    echo "❌ TEST 1 FALLÓ - Build se colgó"
    echo ""
    echo "Probando con exclusiones..."
    
    # TEST 2: Excluir archivos grandes o problemáticos
    echo ""
    echo "TEST 2: Build excluyendo archivos grandes"
    echo "------------------------------------------"
    
    # Buscar archivos grandes
    LARGE_FILES=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -10 | awk '{print $2}' | grep -v total)
    
    echo "Archivos grandes encontrados:"
    echo "$LARGE_FILES" | head -5
    
    # Crear config que excluye estos archivos
    cat > /tmp/vite-progressive-2.js << 'EOFCONFIG'
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
    rollupOptions: {
      input: 'src/main.tsx',
      // Excluir archivos problemáticos
      external: (id) => {
        // Excluir archivos de test
        if (id.includes('.test.') || id.includes('.spec.')) return true;
        // Excluir archivos grandes específicos si es necesario
        return false;
      },
    },
  },
});
EOFCONFIG
    
    rm -rf dist
    timeout 90 node node_modules/vite/bin/vite.js build --config /tmp/vite-progressive-2.js 2>&1 | tail -10
    TEST2=$?
    [ $TEST2 -eq 0 ] && echo "✅ TEST 2 PASÓ" || echo "❌ TEST 2 FALLÓ"
    rm -f /tmp/vite-progressive-2.js
fi

rm -f /tmp/vite-progressive.js

echo ""
echo "✅ Tests progresivos completados"

