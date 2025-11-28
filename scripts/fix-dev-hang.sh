#!/bin/bash
# Script para solucionar problemas de colgues en npm run dev

echo "🔧 Solucionando problemas de colgues..."

# 1. Matar todos los procesos relacionados
echo "1. Matando procesos..."
pkill -9 -f vite 2>/dev/null || true
pkill -9 -f "node.*dev" 2>/dev/null || true
pkill -9 -f "tsx" 2>/dev/null || true
sleep 1

# 2. Limpiar cache de Vite
echo "2. Limpiando cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

# 3. Verificar que el puerto esté libre
echo "3. Verificando puerto 5174..."
lsof -ti:5174 | xargs kill -9 2>/dev/null || echo "   Puerto libre"

# 4. Verificar vite.config.ts existe
if [ ! -f "vite.config.ts" ]; then
    echo "4. ⚠️  vite.config.ts no existe, creando uno básico..."
    cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
});
EOF
    echo "   ✅ vite.config.ts creado"
else
    echo "4. ✅ vite.config.ts existe"
fi

echo ""
echo "✅ Limpieza completada"
echo ""
echo "Ahora intenta ejecutar:"
echo "  npm run dev:direct"
echo ""
echo "O si eso no funciona:"
echo "  node_modules/.bin/vite --port 5174 --host"

