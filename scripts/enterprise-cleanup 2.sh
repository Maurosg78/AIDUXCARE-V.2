#!/bin/bash

# Limpieza Enterprise MVP - AiDuxCare V.2
# Restaura archivos funcionales y elimina archivos problemáticos

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 LIMPIEZA ENTERPRISE MVP INICIADA${NC}"
echo ""

# Función para mostrar progreso
show_step() {
    local step=$1
    local description=$2
    echo -e "${BLUE}[${step}] ${description}${NC}"
}

# Paso 1: Backup del estado actual
show_step "1" "Creando backup del estado actual..."
mkdir -p backup/$(date +%Y%m%d_%H%M%S)
cp -r src/ backup/$(date +%Y%m%d_%H%M%S)/src/
echo -e "${GREEN}✅ Backup creado${NC}"
echo ""

# Paso 2: Restauración de archivos críticos desde cuarentena
show_step "2" "Restaurando archivos críticos desde cuarentena..."

# Restaurar App.tsx
if [ -f "QUARANTINE_20250820_204227/aiduxcare-clean/src/App.tsx" ]; then
    cp "QUARANTINE_20250820_204227/aiduxcare-clean/src/App.tsx" src/
    echo -e "  ✅ App.tsx restaurado"
fi

# Restaurar main.tsx
if [ -f "QUARANTINE_20250820_204227/aiduxcare-clean/src/main.tsx" ]; then
    cp "QUARANTINE_20250820_204227/aiduxcare-clean/src/main.tsx" src/
    echo -e "  ✅ main.tsx restaurado"
fi

# Restaurar CSS
if [ -f "QUARANTINE_20250820_204227/aiduxcare-clean/src/App.css" ]; then
    cp "QUARANTINE_20250820_204227/aiduxcare-clean/src/App.css" src/
    echo -e "  ✅ App.css restaurado"
fi

if [ -f "QUARANTINE_20250820_204227/aiduxcare-clean/src/index.css" ]; then
    cp "QUARANTINE_20250820_204227/aiduxcare-clean/src/index.css" src/
    echo -e "  ✅ index.css restaurado"
fi

echo -e "${GREEN}✅ Archivos críticos restaurados${NC}"
echo ""

# Paso 3: Eliminación de archivos problemáticos
show_step "3" "Eliminando archivos problemáticos..."

# Eliminar archivos vacíos
find src/ -type f -empty -delete
echo -e "  ✅ Archivos vacíos eliminados"

# Eliminar archivos muy pequeños (< 100 bytes)
find src/ -type f -size -100c -delete
echo -e "  ✅ Archivos muy pequeños eliminados"

# Eliminar archivos de test vacíos
find src/ -name "*.spec.ts" -o -name "*.test.ts" | xargs rm -f 2>/dev/null || true
echo -e "  ✅ Archivos de test vacíos eliminados"

echo -e "${GREEN}✅ Limpieza completada${NC}"
echo ""

# Paso 4: Verificación del estado
show_step "4" "Verificando estado del sistema..."

local total_files=$(find src/ -name "*.ts" -o -name "*.tsx" | wc -l)
local small_files=$(find src/ -name "*.ts" -o -name "*.tsx" -size -5k | wc -l)
local empty_files=$(find src/ -type f -empty | wc -l)

echo -e "  📊 Estado actual:"
echo -e "    Total archivos: ${GREEN}${total_files}${NC}"
echo -e "    Archivos < 5KB: ${YELLOW}${small_files}${NC}"
echo -e "    Archivos vacíos: ${RED}${empty_files}${NC}"

echo ""
echo -e "${GREEN}✅ LIMPIEZA ENTERPRISE MVP COMPLETADA${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo -e "  1. Probar: npm run build:enterprise"
echo -e "  2. Verificar funcionalidad: npm run dev"
echo -e "  3. Análisis de calidad: ./scripts/code-quality-analyzer.sh"
