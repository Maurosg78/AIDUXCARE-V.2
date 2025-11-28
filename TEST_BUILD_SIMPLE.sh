#!/bin/bash
# Test de build con configuración mínima

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔨 Test de Build Simple"
echo "======================"
echo ""

# Crear config mínima temporal
cat > /tmp/vite-build-test.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
EOF

echo "1. Test con config mínima (timeout 30s)..."
timeout 30 node node_modules/vite/bin/vite.js build --config /tmp/vite-build-test.config.js 2>&1 | tail -20

BUILD_EXIT=$?
rm -f /tmp/vite-build-test.config.js

if [ $BUILD_EXIT -eq 0 ]; then
    echo ""
    echo "✅ Build completado con config mínima"
    ls -la dist/ 2>/dev/null | head -5
elif [ $BUILD_EXIT -eq 124 ]; then
    echo ""
    echo "❌ Build se colgó incluso con config mínima"
    echo "   Esto indica un problema grave con Vite o dependencias"
else
    echo ""
    echo "⚠️ Build falló con código $BUILD_EXIT"
fi

