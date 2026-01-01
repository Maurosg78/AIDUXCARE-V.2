#!/bin/bash

# Script de Limpieza de Emergencia - AiDuxCare V.2
# Resuelve problemas de dependencias corruptas y builds colgados

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 LIMPIEZA DE EMERGENCIA INICIADA${NC}"
echo -e "${YELLOW}Este script resolverá problemas de dependencias corruptas${NC}"
echo ""

# Función para mostrar progreso
show_step() {
    local step=$1
    local description=$2
    echo -e "${BLUE}[${step}] ${description}${NC}"
}

# Paso 1: Terminar todos los procesos
show_step "1" "Terminando todos los procesos de build..."
ps aux | grep -E "(npm|node|vite|tsc)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✅ Procesos terminados${NC}"
echo ""

# Paso 2: Limpiar directorios temporales
show_step "2" "Limpiando directorios temporales..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true
echo -e "${GREEN}✅ Directorios temporales limpiados${NC}"
echo ""

# Paso 3: Limpiar archivos temporales
show_step "3" "Limpiando archivos temporales..."
find . -name "*.tmp" -o -name "*.temp" -o -name "*.log" -o -name "*.cache" 2>/dev/null | xargs rm -f 2>/dev/null || true
echo -e "${GREEN}✅ Archivos temporales limpiados${NC}"
echo ""

# Paso 4: Verificar espacio en disco
show_step "4" "Verificando espacio en disco..."
df -h . | tail -1
echo ""

# Paso 5: Limpiar cache de npm
show_step "5" "Limpiando cache de npm..."
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✅ Cache de npm limpiado${NC}"
echo ""

# Paso 6: Verificar dependencias corruptas
show_step "6" "Verificando dependencias corruptas..."
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}Verificando integridad de node_modules...${NC}"
    
    # Verificar Vite
    if [ ! -f "node_modules/vite/dist/node/cli.js" ]; then
        echo -e "${RED}❌ Vite corrupto detectado${NC}"
    else
        echo -e "${GREEN}✅ Vite OK${NC}"
    fi
    
    # Verificar Rollup
    if [ ! -f "node_modules/rollup/dist/rollup.js" ]; then
        echo -e "${RED}❌ Rollup corrupto detectado${NC}"
    else
        echo -e "${GREEN}✅ Rollup OK${NC}"
    fi
    
    # Verificar TypeScript
    if [ ! -f "node_modules/typescript/bin/tsc" ]; then
        echo -e "${RED}❌ TypeScript corrupto detectado${NC}"
    else
        echo -e "${GREEN}✅ TypeScript OK${NC}"
    fi
else
    echo -e "${YELLOW}node_modules no existe${NC}"
fi
echo ""

# Paso 7: Reinstalación de dependencias
show_step "7" "Reinstalando dependencias..."
echo -e "${YELLOW}⚠️  Esto puede tomar varios minutos...${NC}"

# Eliminar node_modules corrupto
if [ -d "node_modules" ]; then
    echo -e "${BLUE}Eliminando node_modules corrupto...${NC}"
    rm -rf node_modules
fi

# Eliminar package-lock.json
if [ -f "package-lock.json" ]; then
    echo -e "${BLUE}Eliminando package-lock.json...${NC}"
    rm -f package-lock.json
fi

# Reinstalar dependencias
echo -e "${BLUE}Instalando dependencias frescas...${NC}"
npm install
echo -e "${GREEN}✅ Dependencias reinstaladas${NC}"
echo ""

# Paso 8: Verificación final
show_step "8" "Verificación final..."
echo -e "${BLUE}Verificando que todo funcione...${NC}"

# Verificar Vite
if npm run --silent --version vite >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Vite funcional${NC}"
else
    echo -e "${RED}❌ Vite no funcional${NC}"
fi

# Verificar TypeScript
if npx tsc --version >/dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript funcional${NC}"
else
    echo -e "${RED}❌ TypeScript no funcional${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           LIMPIEZA DE EMERGENCIA COMPLETADA${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Próximos pasos recomendados:${NC}"
echo -e "  1. Probar: npm run build:ultra"
echo -e "  2. Si falla: ./scripts/smart-build-monitor.sh build:ultra"
echo -e "  3. Monitorear: ./scripts/smart-build-monitor.sh monitor"
echo ""
echo -e "${GREEN}🚀 Sistema listo para pruebas${NC}"
