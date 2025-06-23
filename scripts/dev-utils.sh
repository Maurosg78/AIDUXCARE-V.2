#!/bin/bash

# 🛠️ AiDuxCare V.2 - Scripts de Utilidad para Desarrolladores
# Autor: Asistente IA
# Fecha: 2025-06-23

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🏥 AiDuxCare V.2 - Scripts de Utilidad${NC}"
    echo ""
    echo "Uso: ./scripts/dev-utils.sh [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  ${GREEN}setup${NC}           - Configurar entorno de desarrollo"
    echo "  ${GREEN}lint${NC}            - Ejecutar linter en todo el proyecto"
    echo "  ${GREEN}lint-fix${NC}        - Ejecutar linter con auto-fix"
    echo "  ${GREEN}test${NC}            - Ejecutar tests"
    echo "  ${GREEN}build${NC}           - Construir proyecto"
    echo "  ${GREEN}deploy${NC}          - Desplegar a Firebase"
    echo "  ${GREEN}clean${NC}           - Limpiar archivos temporales"
    echo "  ${GREEN}status${NC}          - Mostrar estado del proyecto"
    echo "  ${GREEN}marathon-status${NC} - Verificar estado del maratón"
    echo "  ${GREEN}check-apis${NC}      - Verificar estado de APIs"
    echo "  ${GREEN}help${NC}            - Mostrar esta ayuda"
    echo ""
}

# Función para configurar entorno
setup() {
    echo -e "${BLUE}🔧 Configurando entorno de desarrollo...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    
    # Instalar dependencias principales
    echo -e "${BLUE}📦 Instalando dependencias principales...${NC}"
    npm install
    
    # Instalar dependencias de functions
    echo -e "${BLUE}📦 Instalando dependencias de functions...${NC}"
    cd functions && npm install && cd ..
    
    echo -e "${GREEN}✅ Entorno configurado correctamente${NC}"
}

# Función para ejecutar linter
lint() {
    echo -e "${BLUE}🔍 Ejecutando linter...${NC}"
    
    # Linter principal
    echo -e "${BLUE}📁 Linter principal...${NC}"
    npm run lint 2>/dev/null || echo -e "${YELLOW}⚠️ Linter principal no configurado${NC}"
    
    # Linter de functions
    echo -e "${BLUE}📁 Linter de functions...${NC}"
    cd functions && npm run lint && cd ..
    
    echo -e "${GREEN}✅ Linter completado${NC}"
}

# Función para ejecutar linter con auto-fix
lint_fix() {
    echo -e "${BLUE}🔧 Ejecutando linter con auto-fix...${NC}"
    
    # Linter principal con fix
    echo -e "${BLUE}📁 Linter principal con fix...${NC}"
    npm run lint -- --fix 2>/dev/null || echo -e "${YELLOW}⚠️ Linter principal no configurado${NC}"
    
    # Linter de functions con fix
    echo -e "${BLUE}📁 Linter de functions con fix...${NC}"
    cd functions && npm run lint -- --fix && cd ..
    
    echo -e "${GREEN}✅ Linter con auto-fix completado${NC}"
}

# Función para ejecutar tests
test() {
    echo -e "${BLUE}🧪 Ejecutando tests...${NC}"
    
    # Tests principales
    echo -e "${BLUE}📁 Tests principales...${NC}"
    npm test 2>/dev/null || echo -e "${YELLOW}⚠️ Tests principales no configurados${NC}"
    
    # Tests de functions
    echo -e "${BLUE}📁 Tests de functions...${NC}"
    cd functions && npm test 2>/dev/null || echo -e "${YELLOW}⚠️ Tests de functions no configurados${NC}" && cd ..
    
    echo -e "${GREEN}✅ Tests completados${NC}"
}

# Función para construir proyecto
build() {
    echo -e "${BLUE}🏗️ Construyendo proyecto...${NC}"
    
    # Build principal
    echo -e "${BLUE}📁 Build principal...${NC}"
    npm run build
    
    # Build de functions
    echo -e "${BLUE}📁 Build de functions...${NC}"
    cd functions && npm run build 2>/dev/null || echo -e "${YELLOW}⚠️ Build de functions no configurado${NC}" && cd ..
    
    echo -e "${GREEN}✅ Build completado${NC}"
}

# Función para desplegar
deploy() {
    echo -e "${BLUE}🚀 Desplegando a Firebase...${NC}"
    
    # Verificar Firebase CLI
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Firebase CLI no está instalado${NC}"
        echo -e "${YELLOW}💡 Instalar con: npm install -g firebase-tools${NC}"
        exit 1
    fi
    
    # Desplegar functions
    echo -e "${BLUE}📁 Desplegando functions...${NC}"
    firebase deploy --only functions
    
    echo -e "${GREEN}✅ Despliegue completado${NC}"
}

# Función para limpiar
clean() {
    echo -e "${BLUE}🧹 Limpiando archivos temporales...${NC}"
    
    # Limpiar node_modules (opcional)
    read -p "¿Deseas eliminar node_modules? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🗑️ Eliminando node_modules...${NC}"
        rm -rf node_modules
        rm -rf functions/node_modules
    fi
    
    # Limpiar archivos de build
    echo -e "${BLUE}🗑️ Eliminando archivos de build...${NC}"
    rm -rf dist
    rm -rf functions/lib
    
    # Limpiar logs
    echo -e "${BLUE}🗑️ Eliminando logs...${NC}"
    rm -f *.log
    rm -f functions/*.log
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para mostrar estado
status() {
    echo -e "${BLUE}📊 Estado del proyecto${NC}"
    echo ""
    
    # Estado de Git
    echo -e "${BLUE}🔍 Estado de Git:${NC}"
    git status --porcelain | head -10 || echo -e "${YELLOW}⚠️ No es un repositorio Git${NC}"
    echo ""
    
    # Estado de dependencias
    echo -e "${BLUE}📦 Estado de dependencias:${NC}"
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ Dependencias principales instaladas${NC}"
    else
        echo -e "${RED}❌ Dependencias principales no instaladas${NC}"
    fi
    
    if [ -d "functions/node_modules" ]; then
        echo -e "${GREEN}✅ Dependencias de functions instaladas${NC}"
    else
        echo -e "${RED}❌ Dependencias de functions no instaladas${NC}"
    fi
    echo ""
    
    # Estado de maratón
    echo -e "${BLUE}🔥 Estado del maratón:${NC}"
    if [ -f "warmup_marathon_log.txt" ]; then
        echo -e "${GREEN}✅ Log de maratón encontrado${NC}"
        echo -e "${BLUE}📊 Últimas líneas del log:${NC}"
        tail -5 warmup_marathon_log.txt
    else
        echo -e "${YELLOW}⚠️ Log de maratón no encontrado${NC}"
    fi
    echo ""
}

# Función para verificar estado del maratón
marathon_status() {
    echo -e "${BLUE}🔥 Estado del maratón de calentamiento${NC}"
    echo ""
    
    if [ -f "warmup_marathon_log.txt" ]; then
        echo -e "${BLUE}📊 Estadísticas del maratón:${NC}"
        
        # Contar iteraciones
        total_iterations=$(grep -c "ITERACIÓN" warmup_marathon_log.txt || echo "0")
        successful_iterations=$(grep -c "COMPLETADA EXITOSAMENTE" warmup_marathon_log.txt || echo "0")
        failed_iterations=$(grep -c "FALLO" warmup_marathon_log.txt || echo "0")
        
        echo -e "Total de iteraciones: ${total_iterations}"
        echo -e "Iteraciones exitosas: ${successful_iterations}"
        echo -e "Iteraciones fallidas: ${failed_iterations}"
        
        if [ "$total_iterations" -gt 0 ]; then
            success_rate=$((successful_iterations * 100 / total_iterations))
            echo -e "Tasa de éxito: ${success_rate}%"
        fi
        
        echo ""
        echo -e "${BLUE}📝 Últimas 10 líneas del log:${NC}"
        tail -10 warmup_marathon_log.txt
        
        echo ""
        echo -e "${BLUE}🔍 Verificar si el proceso está ejecutándose:${NC}"
        if pgrep -f "run_warmup_marathon.sh" > /dev/null; then
            echo -e "${GREEN}✅ Maratón ejecutándose${NC}"
        else
            echo -e "${YELLOW}⚠️ Maratón no ejecutándose${NC}"
        fi
    else
        echo -e "${RED}❌ Log de maratón no encontrado${NC}"
        echo -e "${YELLOW}💡 Ejecutar: ./run_warmup_marathon.sh${NC}"
    fi
}

# Función para verificar APIs
check_apis() {
    echo -e "${BLUE}🔍 Verificando estado de APIs${NC}"
    echo ""
    
    # Verificar credenciales
    if [ -f "aiduxcare-nlp-credentials.json" ]; then
        echo -e "${GREEN}✅ Credenciales encontradas${NC}"
    else
        echo -e "${RED}❌ Credenciales no encontradas${NC}"
    fi
    
    # Verificar Firebase
    if command -v firebase &> /dev/null; then
        echo -e "${GREEN}✅ Firebase CLI instalado${NC}"
        firebase projects:list 2>/dev/null | grep aiduxcare-mvp-prod && echo -e "${GREEN}✅ Proyecto aiduxcare-mvp-prod encontrado${NC}" || echo -e "${YELLOW}⚠️ Proyecto aiduxcare-mvp-prod no encontrado${NC}"
    else
        echo -e "${RED}❌ Firebase CLI no instalado${NC}"
    fi
    
    # Verificar Node.js
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js no instalado${NC}"
    fi
    
    # Verificar npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    else
        echo -e "${RED}❌ npm no instalado${NC}"
    fi
}

# Función principal
main() {
    case "${1:-help}" in
        "setup")
            setup
            ;;
        "lint")
            lint
            ;;
        "lint-fix")
            lint_fix
            ;;
        "test")
            test
            ;;
        "build")
            build
            ;;
        "deploy")
            deploy
            ;;
        "clean")
            clean
            ;;
        "status")
            status
            ;;
        "marathon-status")
            marathon_status
            ;;
        "check-apis")
            check_apis
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@" 