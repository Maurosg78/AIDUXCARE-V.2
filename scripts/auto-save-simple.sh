#!/bin/bash

# ✅ Auto-Save Simple Script (SIN Git)
# Solo crea snapshots locales - NO requiere Git ni aprobaciones
# Uso: ./scripts/auto-save-simple.sh [intervalo_en_segundos]

set -e

INTERVAL=${1:-300}  # Default: 5 minutos
SNAPSHOT_DIR="./canonical_snapshots/auto"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$SNAPSHOT_DIR"

create_snapshot() {
    local snapshot_name="snapshot_$(date +"%Y%m%d_%H%M%S")"
    local snapshot_path="${SNAPSHOT_DIR}/${snapshot_name}"
    
    mkdir -p "$snapshot_path"
    
    echo "[$(date +'%H:%M:%S')] 📸 Creando snapshot..."
    
    # Copiar solo archivos importantes
    [ -d "src" ] && cp -r src "$snapshot_path/" 2>/dev/null || true
    [ -f "package.json" ] && cp package.json "$snapshot_path/" 2>/dev/null || true
    [ -f "tsconfig.json" ] && cp tsconfig.json "$snapshot_path/" 2>/dev/null || true
    [ -f "vite.config.ts" ] && cp vite.config.ts "$snapshot_path/" 2>/dev/null || true
    [ -d "docs" ] && cp -r docs "$snapshot_path/" 2>/dev/null || true
    
    echo "[$(date +'%H:%M:%S')] ✅ Snapshot: $snapshot_name"
    
    # Limpiar antiguos (mantener últimos 30)
    cd "$SNAPSHOT_DIR"
    ls -t | tail -n +31 | xargs rm -rf 2>/dev/null || true
    cd - > /dev/null
}

echo "🚀 Auto-save simple iniciado (cada ${INTERVAL}s)"
echo "Presiona Ctrl+C para detener"
echo ""

create_snapshot

while true; do
    sleep "$INTERVAL"
    create_snapshot
done



