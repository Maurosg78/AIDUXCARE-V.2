#!/bin/bash
# Tests progresivos de configuración de Vite para identificar el problema

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 TESTS PROGRESIVOS DE CONFIGURACIÓN VITE"
echo "==========================================="
echo ""

# Limpiar dist antes de cada test
rm -rf dist 2>/dev/null

# TEST 1: Config completamente vacía
echo "TEST 1: Config completamente vacía"
echo "----------------------------------"
cat > /tmp/vite-test-1.js << 'EOF'
export default {};
EOF
timeout 15 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-1.js 2>&1 | tail -5
TEST1=$?
[ $TEST1 -eq 0 ] && echo "✅ TEST 1 PASÓ" || echo "❌ TEST 1 FALLÓ (exit: $TEST1)"
echo ""

# TEST 2: Solo plugin React
echo "TEST 2: Solo plugin React"
echo "-------------------------"
cat > /tmp/vite-test-2.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
EOF
timeout 20 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-2.js 2>&1 | tail -5
TEST2=$?
[ $TEST2 -eq 0 ] && echo "✅ TEST 2 PASÓ" || echo "❌ TEST 2 FALLÓ (exit: $TEST2)"
echo ""

# TEST 3: Plugin React + alias básico
echo "TEST 3: Plugin React + alias básico"
echo "------------------------------------"
cat > /tmp/vite-test-3.js << 'EOF'
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
});
EOF
timeout 30 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-3.js 2>&1 | tail -5
TEST3=$?
[ $TEST3 -eq 0 ] && echo "✅ TEST 3 PASÓ" || echo "❌ TEST 3 FALLÓ (exit: $TEST3)"
echo ""

# TEST 4: Plugin React + alias + optimizeDeps
echo "TEST 4: Plugin React + alias + optimizeDeps"
echo "--------------------------------------------"
cat > /tmp/vite-test-4.js << 'EOF'
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
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
EOF
timeout 40 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-4.js 2>&1 | tail -5
TEST4=$?
[ $TEST4 -eq 0 ] && echo "✅ TEST 4 PASÓ" || echo "❌ TEST 4 FALLÓ (exit: $TEST4)"
echo ""

# TEST 5: Config completa sin build options
echo "TEST 5: Config completa sin build options"
echo "-----------------------------------------"
cat > /tmp/vite-test-5.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src")
    }
  },
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
EOF
timeout 50 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-5.js 2>&1 | tail -5
TEST5=$?
[ $TEST5 -eq 0 ] && echo "✅ TEST 5 PASÓ" || echo "❌ TEST 5 FALLÓ (exit: $TEST5)"
echo ""

# TEST 6: Config completa con build básico
echo "TEST 6: Config completa con build básico"
echo "----------------------------------------"
cat > /tmp/vite-test-6.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src")
    }
  },
  plugins: [react()],
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
EOF
timeout 60 node node_modules/vite/bin/vite.js build --config /tmp/vite-test-6.js 2>&1 | tail -5
TEST6=$?
[ $TEST6 -eq 0 ] && echo "✅ TEST 6 PASÓ" || echo "❌ TEST 6 FALLÓ (exit: $TEST6)"
echo ""

# Limpiar archivos temporales
rm -f /tmp/vite-test-*.js

# Resumen
echo "═══════════════════════════════════════════════"
echo "RESUMEN"
echo "═══════════════════════════════════════════════"
echo "TEST 1 (vacía): $([ $TEST1 -eq 0 ] && echo '✅' || echo '❌')"
echo "TEST 2 (React): $([ $TEST2 -eq 0 ] && echo '✅' || echo '❌')"
echo "TEST 3 (React+alias): $([ $TEST3 -eq 0 ] && echo '✅' || echo '❌')"
echo "TEST 4 (React+alias+optimize): $([ $TEST4 -eq 0 ] && echo '✅' || echo '❌')"
echo "TEST 5 (Completa sin build): $([ $TEST5 -eq 0 ] && echo '✅' || echo '❌')"
echo "TEST 6 (Completa con build): $([ $TEST6 -eq 0 ] && echo '✅' || echo '❌')"
echo ""
echo "El primer test que falla indica dónde está el problema."

