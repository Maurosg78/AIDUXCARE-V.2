#!/bin/bash

# ✅ Quick Save - Versión Ultra Simple
# Solo copia archivos importantes a un snapshot
# Uso: ./scripts/quick-save.sh

SNAPSHOT_DIR="./canonical_snapshots/quick"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_NAME="quick_${TIMESTAMP}"
SNAPSHOT_PATH="${SNAPSHOT_DIR}/${SNAPSHOT_NAME}"

mkdir -p "$SNAPSHOT_PATH"

echo "💾 Guardando snapshot rápido..."

# Copiar archivos importantes
[ -d "src" ] && cp -r src "$SNAPSHOT_PATH/" && echo "  ✅ src/"
[ -f "package.json" ] && cp package.json "$SNAPSHOT_PATH/" && echo "  ✅ package.json"
[ -f "tsconfig.json" ] && cp tsconfig.json "$SNAPSHOT_PATH/" && echo "  ✅ tsconfig.json"
[ -f "vite.config.ts" ] && cp vite.config.ts "$SNAPSHOT_PATH/" && echo "  ✅ vite.config.ts"
[ -d "docs" ] && cp -r docs "$SNAPSHOT_PATH/" && echo "  ✅ docs/"

echo ""
echo "✅ Snapshot guardado: $SNAPSHOT_NAME"
echo "📁 Ubicación: $SNAPSHOT_PATH"

# Limpiar antiguos (mantener últimos 50)
cd "$SNAPSHOT_DIR" 2>/dev/null && ls -t | tail -n +51 | xargs rm -rf 2>/dev/null || true



