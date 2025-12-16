#!/bin/bash
# Test detallado de Vite con logging para ver dónde se cuelga

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 TEST DETALLADO DE VITE CON LOGGING"
echo "======================================="
echo ""

# Limpiar
rm -rf dist

# Crear config con logging
cat > /tmp/vite-detailed.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src")
    }
  },
  plugins: [
    react({
      // Añadir logging para ver qué está pasando
      jsxRuntime: 'automatic',
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      onwarn(warning, warn) {
        // Log warnings para debugging
        console.log('[ROLLUP WARNING]', warning.code, warning.message);
        warn(warning);
      },
    },
  },
  logLevel: 'info',
});
EOF

echo "Iniciando build con logging detallado..."
echo "Esto puede tardar hasta 2 minutos..."
echo ""

# Ejecutar build con timeout y capturar output
timeout 120 node node_modules/vite/bin/vite.js build --config /tmp/vite-detailed.js --mode development 2>&1 | tee /tmp/vite-build.log

BUILD_EXIT=$?

echo ""
echo "═══════════════════════════════════════════════"
echo "RESULTADO"
echo "═══════════════════════════════════════════════"

if [ $BUILD_EXIT -eq 0 ]; then
    echo "✅ BUILD COMPLETADO EXITOSAMENTE"
    ls -lh dist/ 2>/dev/null | head -10
elif [ $BUILD_EXIT -eq 124 ]; then
    echo "❌ BUILD SE COLGÓ (timeout 120s)"
    echo ""
    echo "Últimas líneas del log:"
    tail -20 /tmp/vite-build.log
    echo ""
    echo "Buscando errores en el log:"
    grep -i "error\|fail\|warn" /tmp/vite-build.log | tail -10
else
    echo "❌ BUILD FALLÓ con código $BUILD_EXIT"
    echo ""
    echo "Errores encontrados:"
    grep -i "error\|fail" /tmp/vite-build.log | tail -10
fi

echo ""
echo "Log completo guardado en: /tmp/vite-build.log"

rm -f /tmp/vite-detailed.js

