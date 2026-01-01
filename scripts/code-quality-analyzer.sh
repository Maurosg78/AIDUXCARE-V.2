#!/bin/bash

# Analizador de Calidad de Código Enterprise MVP - AiDuxCare V.2
# Detecta problemas de calidad y archivos vacíos

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 ANÁLISIS DE CALIDAD DE CÓDIGO ENTERPRISE MVP${NC}"
echo ""

# Función para analizar archivos TypeScript
analyze_typescript() {
    echo -e "${BLUE}📊 ANÁLISIS DE ARCHIVOS TYPESCRIPT${NC}"
    
    # Contar archivos totales
    local total_files=$(find src/ -name "*.ts" -o -name "*.tsx" | wc -l)
    echo -e "  Total archivos: ${GREEN}${total_files}${NC}"
    
    # Archivos pequeños (< 5KB)
    local small_files=$(find src/ -name "*.ts" -o -name "*.tsx" -size -5k | wc -l)
    echo -e "  Archivos < 5KB: ${YELLOW}${small_files}${NC}"
    
    # Archivos vacíos
    local empty_files=$(find src/ -name "*.ts" -o -name "*.tsx" -empty | wc -l)
    echo -e "  Archivos vacíos: ${RED}${empty_files}${NC}"
    
    echo ""
}

# Función para detectar uso de 'any'
detect_any_usage() {
    echo -e "${BLUE}🚨 DETECCIÓN DE USO DE 'ANY' (PROHIBIDO)${NC}"
    
    local any_count=$(grep -r "any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
    
    if [ "$any_count" -gt 0 ]; then
        echo -e "  ❌ Uso de 'any' detectado: ${RED}${any_count}${NC} ocurrencias"
        echo -e "  📍 Primeras 5 ocurrencias:"
        grep -r "any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 | while read line; do
            echo -e "    ${YELLOW}${line}${NC}"
        done
    else
        echo -e "  ✅ No se detectó uso de 'any'"
    fi
    
    echo ""
}

# Función para analizar archivos pequeños
analyze_small_files() {
    echo -e "${BLUE}📁 ANÁLISIS DE ARCHIVOS PEQUEÑOS (< 5KB)${NC}"
    
    local small_files=$(find src/ -name "*.ts" -o -name "*.tsx" -size -5k)
    
    if [ -n "$small_files" ]; then
        echo -e "  Archivos que requieren revisión:"
        echo "$small_files" | while read file; do
            local size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "0B")
            local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
            echo -e "    ${YELLOW}${file}${NC} (${size}, ${lines} líneas)"
        done
    else
        echo -e "  ✅ No hay archivos pequeños que revisar"
    fi
    
    echo ""
}

# Función para verificar estándares de código
check_code_standards() {
    echo -e "${BLUE}📋 VERIFICACIÓN DE ESTÁNDARES DE CÓDIGO${NC}"
    
    # Verificar ESLint
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
        echo -e "  ✅ Configuración ESLint encontrada"
    else
        echo -e "  ❌ Configuración ESLint NO encontrada"
    fi
    
    # Verificar TypeScript config
    if [ -f "tsconfig.json" ]; then
        echo -e "  ✅ Configuración TypeScript encontrada"
    else
        echo -e "  ❌ Configuración TypeScript NO encontrada"
    fi
    
    # Verificar Prettier
    if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
        echo -e "  ✅ Configuración Prettier encontrada"
    else
        echo -e "  ❌ Configuración Prettier NO encontrada"
    fi
    
    echo ""
}

# Función para generar reporte
generate_report() {
    echo -e "${BLUE}📊 REPORTE DE CALIDAD DE CÓDIGO${NC}"
    echo -e "  Fecha: $(date)"
    echo -e "  Proyecto: AiDuxCare V.2"
    echo -e "  Versión: Enterprise MVP"
    echo ""
    
    analyze_typescript
    detect_any_usage
    analyze_small_files
    check_code_standards
    
    echo -e "${GREEN}✅ Análisis completado${NC}"
}

# Ejecutar análisis
generate_report
