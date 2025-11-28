#!/bin/bash

# Script para limpiar archivos duplicados en src/
# Ejecutar con precaución - revisa antes de eliminar

set -e

echo "🔍 Buscando archivos duplicados en src/..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Crear directorio de backups
mkdir -p backups/src-duplicates

# Archivos duplicados conocidos
DUPLICATES=(
    "src/router.tsx"  # Duplicado de src/router/router.tsx
    "src/pages/LoginPage.tsx.backup2"
    "src/pages/ProfessionalWorkflowPage_tabs.tsx.disabled"
    "src/components/WorkflowAnalysisTab.tsx.backup-current"
    "src/App.baup.20250823-212930.tsx"
)

echo "📋 Archivos duplicados encontrados:"
for file in "${DUPLICATES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ $file (no existe)${NC}"
    fi
done
echo ""

# Mover automáticamente (sin confirmación)
echo "📦 Moviendo archivos a backups..."
for file in "${DUPLICATES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "backups/src-duplicates/"
        echo -e "${GREEN}  ✓ Movido: $file${NC}"
    fi
done
echo ""
echo -e "${GREEN}✅ Limpieza completada${NC}"

