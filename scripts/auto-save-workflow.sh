#!/bin/bash

# ✅ Auto-Save Workflow Script
# Este script guarda automáticamente los cambios en Git y crea backups locales
# Uso: ./scripts/auto-save-workflow.sh [intervalo_en_segundos]
# Ejemplo: ./scripts/auto-save-workflow.sh 300  (cada 5 minutos)

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
INTERVAL=${1:-300}  # Default: 5 minutos
BACKUP_DIR="./backups/auto-save"
SNAPSHOT_DIR="./canonical_snapshots/auto"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BRANCH_NAME=$(git branch --show-current 2>/dev/null || echo "main")

# Crear directorios si no existen
mkdir -p "$BACKUP_DIR"
mkdir -p "$SNAPSHOT_DIR"

# Función para hacer commit automático
auto_commit() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Verificar si hay cambios
    if git diff --quiet && git diff --cached --quiet; then
        echo -e "${YELLOW}[$(date +'%H:%M:%S')] No hay cambios para guardar${NC}"
        return 0
    fi
    
    # Agregar todos los cambios
    git add -A
    
    # Crear commit con timestamp
    local commit_message="💾 Auto-save: $(date +'%Y-%m-%d %H:%M:%S')"
    
    if git commit -m "$commit_message" --no-verify 2>/dev/null; then
        echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ Auto-commit creado: $commit_message${NC}"
        
        # Push opcional (comentado por seguridad)
        # git push origin "$BRANCH_NAME" 2>/dev/null || true
        
        return 0
    else
        echo -e "${RED}[$(date +'%H:%M:%S')] ❌ Error al crear commit${NC}"
        return 1
    fi
}

# Función para crear snapshot local
create_snapshot() {
    local snapshot_name="snapshot_${TIMESTAMP}"
    local snapshot_path="${SNAPSHOT_DIR}/${snapshot_name}"
    
    mkdir -p "$snapshot_path"
    
    # Copiar archivos importantes
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] 📸 Creando snapshot local...${NC}"
    
    # Archivos fuente principales
    if [ -d "src" ]; then
        cp -r src "$snapshot_path/" 2>/dev/null || true
    fi
    
    # Configuración
    cp package.json "$snapshot_path/" 2>/dev/null || true
    cp tsconfig.json "$snapshot_path/" 2>/dev/null || true
    cp vite.config.ts "$snapshot_path/" 2>/dev/null || true
    
    # Documentación
    if [ -d "docs" ]; then
        cp -r docs "$snapshot_path/" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ Snapshot creado: $snapshot_name${NC}"
    
    # Limpiar snapshots antiguos (mantener solo los últimos 20)
    cd "$SNAPSHOT_DIR"
    ls -t | tail -n +21 | xargs rm -rf 2>/dev/null || true
    cd - > /dev/null
}

# Función para crear backup comprimido
create_backup() {
    local backup_name="backup_${TIMESTAMP}.tar.gz"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] 💾 Creando backup comprimido...${NC}"
    
    # Crear backup de archivos importantes (excluyendo node_modules, dist, etc.)
    tar -czf "$backup_path" \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='coverage' \
        --exclude='backups' \
        --exclude='canonical_snapshots' \
        --exclude='.vite' \
        src/ docs/ package.json tsconfig.json vite.config.ts \
        2>/dev/null || true
    
    if [ -f "$backup_path" ]; then
        local size=$(du -h "$backup_path" | cut -f1)
        echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ Backup creado: $backup_name ($size)${NC}"
        
        # Limpiar backups antiguos (mantener solo los últimos 10)
        cd "$BACKUP_DIR"
        ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
        cd - > /dev/null
    fi
}

# Función principal
main() {
    echo -e "${GREEN}🚀 Iniciando auto-save workflow${NC}"
    echo -e "${YELLOW}Intervalo: ${INTERVAL} segundos (${INTERVAL}s = $(($INTERVAL/60)) minutos)${NC}"
    echo -e "${YELLOW}Branch: $BRANCH_NAME${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
    echo ""
    
    # Crear snapshot inicial
    create_snapshot
    create_backup
    
    # Loop principal
    while true; do
        sleep "$INTERVAL"
        
        echo ""
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] Ejecutando auto-save...${NC}"
        
        # 1. Auto-commit en Git
        auto_commit
        
        # 2. Crear snapshot local (cada 3 ciclos = ~15 minutos si intervalo es 5 min)
        if [ $(($(date +%s) % ($INTERVAL * 3))) -eq 0 ]; then
            create_snapshot
        fi
        
        # 3. Crear backup comprimido (cada 6 ciclos = ~30 minutos si intervalo es 5 min)
        if [ $(($(date +%s) % ($INTERVAL * 6))) -eq 0 ]; then
            create_backup
        fi
        
        echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ Auto-save completado${NC}"
    done
}

# Manejar Ctrl+C
trap 'echo -e "\n${YELLOW}🛑 Deteniendo auto-save workflow...${NC}"; exit 0' INT TERM

# Ejecutar
main



