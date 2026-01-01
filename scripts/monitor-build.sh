#!/bin/bash

# Script de Monitoreo Universal para Builds - AiDuxCare V.2
# Monitorea en tiempo real todos los procesos de build y npm

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar timestamp
timestamp() {
    date '+%H:%M:%S'
}

# Función para monitorear procesos
monitor_processes() {
    echo -e "${BLUE}[$(timestamp)] 🔍 Monitoreando procesos de build...${NC}"
    
    # Procesos npm/vite activos
    local npm_processes=$(ps aux | grep -E "(npm|node|vite|tsc)" | grep -v grep | grep -v "Cursor Helper" || true)
    
    if [ -n "$npm_processes" ]; then
        echo -e "${YELLOW}[$(timestamp)] ⚠️  Procesos activos detectados:${NC}"
        echo "$npm_processes"
        echo ""
        
        # Mostrar uso de CPU y memoria
        echo -e "${BLUE}[$(timestamp)] 📊 Estadísticas de recursos:${NC}"
        ps aux | grep -E "(npm|node|vite|tsc)" | grep -v grep | grep -v "Cursor Helper" | awk '{print $3, $4, $6, $11}' | head -5
        echo ""
    else
        echo -e "${GREEN}[$(timestamp)] ✅ No hay procesos de build activos${NC}"
    fi
}

# Función para monitorear directorio dist
monitor_dist() {
    if [ -d "dist" ]; then
        local dist_size=$(du -sh dist 2>/dev/null | cut -f1 || echo "0B")
        local file_count=$(find dist -type f 2>/dev/null | wc -l || echo "0")
        
        echo -e "${BLUE}[$(timestamp)] 📁 Directorio dist: ${GREEN}${dist_size}${NC} (${file_count} archivos)${NC}"
        
        # Mostrar archivos más recientes
        if [ "$file_count" -gt 0 ]; then
            echo -e "${BLUE}[$(timestamp)] 📄 Archivos más recientes:${NC}"
            find dist -type f -exec ls -la {} \; 2>/dev/null | head -3 | awk '{print $6, $7, $8, $9}'
        fi
    else
        echo -e "${YELLOW}[$(timestamp)] ⚠️  Directorio dist no existe aún${NC}"
    fi
}

# Función para monitorear logs de build
monitor_logs() {
    echo -e "${BLUE}[$(timestamp)] 📝 Monitoreando logs de build...${NC}"
    
    # Verificar si hay archivos de log recientes
    local log_files=$(find . -name "*.log" -mtime -1 2>/dev/null | head -5 || true)
    
    if [ -n "$log_files" ]; then
        echo -e "${YELLOW}[$(timestamp)] 📋 Archivos de log encontrados:${NC}"
        echo "$log_files"
    else
        echo -e "${GREEN}[$(timestamp)] ✅ No hay logs recientes${NC}"
    fi
}

# Función para monitorear uso de memoria del sistema
monitor_system() {
    echo -e "${BLUE}[$(timestamp)] 💻 Estado del sistema:${NC}"
    
    # CPU load
    local cpu_load=$(uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}' | sed 's/,//' 2>/dev/null || echo "N/A")
    echo -e "  CPU Load: ${YELLOW}${cpu_load}${NC}"
    
    # Espacio en disco
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' 2>/dev/null || echo "N/A")
    echo -e "  Disco: ${YELLOW}${disk_usage}${NC} usado"
    
    # Memoria del sistema (simplificado)
    local mem_info=$(top -l 1 | grep PhysMem | awk '{print $2, $3, $4}' 2>/dev/null || echo "N/A")
    echo -e "  Memoria: ${YELLOW}${mem_info}${NC}"
}

# Función para monitorear un comando específico (SIN BUCLE INFINITO)
monitor_command() {
    local command="$1"
    local timeout="${2:-300}" # 5 minutos por defecto
    
    echo -e "${GREEN}🚀 Ejecutando: ${command}${NC}"
    echo -e "${BLUE}Timeout: ${timeout} segundos${NC}"
    echo ""
    
    # Ejecutar comando y monitorear en tiempo real
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}           MONITOREO DE COMANDO: ${command}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Mostrar estado inicial
    monitor_processes
    echo ""
    monitor_dist
    echo ""
    monitor_system
    echo ""
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}▶️  Iniciando comando...${NC}"
    echo ""
    
    # Ejecutar comando con timeout (compatible con macOS)
    if gtimeout $timeout bash -c "$command" 2>/dev/null || timeout $timeout bash -c "$command" 2>/dev/null || bash -c "$command"; then
        echo -e "${GREEN}✅ Comando completado exitosamente${NC}"
        
        # Mostrar estado final
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}           ESTADO FINAL DESPUÉS DEL BUILD${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        
        monitor_processes
        echo ""
        monitor_dist
        echo ""
        monitor_system
        echo ""
        
        return 0
    else
        echo -e "${RED}❌ Comando falló o excedió el timeout${NC}"
        return 1
    fi
}

# Función para monitoreo continuo (con escape fácil)
continuous_monitor() {
    echo -e "${GREEN}🚀 INICIANDO MONITOREO CONTINUO - AiDuxCare V.2${NC}"
    echo -e "${BLUE}Presiona 'q' + Enter para salir, o Ctrl+C${NC}"
    echo ""
    
    local count=0
    while true; do
        count=$((count + 1))
        
        clear
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}           MONITOREO CONTINUO #${count} - $(date)${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        
        monitor_processes
        echo ""
        monitor_dist
        echo ""
        monitor_logs
        echo ""
        monitor_system
        echo ""
        
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}Actualizando en 10 segundos... (q + Enter para salir)${NC}"
        
        # Leer input con timeout
        if read -t 10 -n 1 input; then
            if [ "$input" = "q" ]; then
                echo -e "${GREEN}👋 Monitoreo detenido por el usuario${NC}"
                break
            fi
        fi
    done
}

# Manejo de argumentos
case "${1:-}" in
    "monitor"|"continuous")
        continuous_monitor
        ;;
    "build")
        monitor_command "npm run build"
        ;;
    "build:fast")
        monitor_command "npm run build:fast"
        ;;
    "build:ultra")
        monitor_command "npm run build:ultra"
        ;;
    "dev")
        monitor_command "npm run dev"
        ;;
    "test")
        monitor_command "npm run test"
        ;;
    "lint")
        monitor_command "npm run lint"
        ;;
    "status")
        echo -e "${GREEN}📊 ESTADO ACTUAL DEL SISTEMA - $(date)${NC}"
        echo ""
        monitor_processes
        echo ""
        monitor_dist
        echo ""
        monitor_system
        ;;
    *)
        echo -e "${GREEN}Uso: $0 [comando]${NC}"
        echo ""
        echo -e "${BLUE}Comandos disponibles:${NC}"
        echo -e "  monitor     - Monitoreo continuo del sistema"
        echo -e "  continuous  - Monitoreo continuo del sistema"
        echo -e "  build       - Build con monitoreo"
        echo -e "  build:fast  - Build rápido con monitoreo"
        echo -e "  build:ultra - Build ultra-optimizado con monitoreo"
        echo -e "  dev         - Desarrollo con monitoreo"
        echo -e "  test        - Tests con monitoreo"
        echo -e "  lint        - Linting con monitoreo"
        echo -e "  status      - Estado actual del sistema"
        echo ""
        echo -e "${YELLOW}Ejemplos:${NC}"
        echo -e "  $0 build:ultra    - Build con monitoreo"
        echo -e "  $0 monitor        - Monitoreo continuo"
        echo -e "  $0 status         - Estado actual"
        exit 1
        ;;
esac
