#!/bin/bash

# Script de Monitoreo Inteligente de Build - AiDuxCare V.2
# Detecta automáticamente si el build está colgado o solo demorando

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuración
BUILD_TIMEOUT=300  # 5 minutos
HANG_DETECTION_INTERVAL=30  # 30 segundos para detectar colgues
PROGRESS_CHECK_INTERVAL=10  # 10 segundos para verificar progreso

# Función para mostrar timestamp
timestamp() {
    date '+%H:%M:%S'
}

# Función para mostrar progreso
show_progress() {
    local elapsed=$1
    local timeout=$2
    local progress=$((elapsed * 100 / timeout))
    
    echo -e "${BLUE}⏱️  Progreso: ${YELLOW}${progress}%${NC} (${elapsed}s / ${timeout}s)"
    
    # Barra de progreso visual
    local bar_length=30
    local filled=$((progress * bar_length / 100))
    local empty=$((bar_length - filled))
    
    printf "["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] ${progress}%%\n"
}

# Función para detectar si el build está colgado
detect_hang() {
    local pid=$1
    local last_cpu=$2
    local last_mem=$3
    
    # Obtener CPU y memoria actual
    local current_cpu=$(ps -p $pid -o %cpu= 2>/dev/null | tr -d ' ' || echo "0")
    local current_mem=$(ps -p $pid -o %mem= 2>/dev/null | tr -d ' ' || echo "0")
    
    # Si no hay cambios en CPU y memoria por 30 segundos, está colgado
    if [ "$current_cpu" = "$last_cpu" ] && [ "$current_mem" = "$last_mem" ]; then
        return 0  # Está colgado
    fi
    
    return 1  # No está colgado
}

# Función para monitorear build inteligentemente
smart_build_monitor() {
    local command="$1"
    local timeout="${2:-$BUILD_TIMEOUT}"
    
    echo -e "${GREEN}🚀 INICIANDO MONITOREO INTELIGENTE DE BUILD${NC}"
    echo -e "${BLUE}Comando: ${command}${NC}"
    echo -e "${BLUE}Timeout: ${timeout} segundos${NC}"
    echo -e "${PURPLE}Detección de colgues: ${HANG_DETECTION_INTERVAL} segundos${NC}"
    echo ""
    
    # Ejecutar comando en background
    echo -e "${GREEN}▶️  Ejecutando comando...${NC}"
    eval "$command" &
    local build_pid=$!
    
    echo -e "${GREEN}✅ PID del build: ${build_pid}${NC}"
    echo ""
    
    # Variables de monitoreo
    local start_time=$(date +%s)
    local last_cpu="0"
    local last_mem="0"
    local hang_counter=0
    local last_progress_check=0
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}           MONITOREO EN TIEMPO REAL${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Monitoreo principal
    while kill -0 $build_pid 2>/dev/null; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        # Verificar timeout
        if [ $elapsed -gt $timeout ]; then
            echo -e "${RED}⏰ TIMEOUT: Build excedió ${timeout} segundos${NC}"
            kill -9 $build_pid 2>/dev/null || true
            return 1
        fi
        
        # Limpiar pantalla y mostrar estado
        clear
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}           MONITOREO INTELIGENTE DE BUILD${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        
        # Información del proceso
        echo -e "${BLUE}🆔 PID: ${build_pid}${NC}"
        echo -e "${BLUE}⏱️  Tiempo transcurrido: ${elapsed}s${NC}"
        show_progress $elapsed $timeout
        echo ""
        
        # Estado del proceso
        if ps -p $build_pid >/dev/null 2>&1; then
            local cpu_usage=$(ps -p $build_pid -o %cpu= 2>/dev/null | tr -d ' ' || echo "0")
            local mem_usage=$(ps -p $build_pid -o %mem= 2>/dev/null | tr -d ' ' || echo "0")
            local vsz=$(ps -p $build_pid -o vsz= 2>/dev/null | tr -d ' ' || echo "0")
            
            echo -e "${BLUE}📊 Estado del proceso:${NC}"
            echo -e "  CPU: ${YELLOW}${cpu_usage}%${NC}"
            echo -e "  Memoria: ${YELLOW}${mem_usage}%${NC}"
            echo -e "  Memoria Virtual: ${YELLOW}$((vsz / 1024))MB${NC}"
            echo ""
            
            # Detección de colgues
            if detect_hang $build_pid "$last_cpu" "$last_mem"; then
                hang_counter=$((hang_counter + 1))
                echo -e "${RED}⚠️  POSIBLE COLGUE DETECTADO #${hang_counter}${NC}"
                echo -e "${RED}   CPU y memoria sin cambios por ${HANG_DETECTION_INTERVAL}s${NC}"
                
                if [ $hang_counter -ge 3 ]; then
                    echo -e "${RED}🚨 COLGUE CONFIRMADO: Terminando proceso${NC}"
                    kill -9 $build_pid 2>/dev/null || true
                    return 1
                fi
            else
                hang_counter=0
                echo -e "${GREEN}✅ Proceso activo y funcionando${NC}"
            fi
            
            last_cpu="$cpu_usage"
            last_mem="$mem_usage"
        else
            echo -e "${RED}❌ Proceso no encontrado${NC}"
            return 1
        fi
        
        # Verificar directorio dist
        echo ""
        if [ -d "dist" ]; then
            local dist_size=$(du -sh dist 2>/dev/null | cut -f1 || echo "0B")
            local file_count=$(find dist -type f 2>/dev/null | wc -l || echo "0")
            echo -e "${GREEN}📁 Directorio dist: ${dist_size} (${file_count} archivos)${NC}"
            
            if [ $file_count -gt 0 ]; then
                echo -e "${GREEN}✅ Build progresando - archivos generados${NC}"
            fi
        else
            echo -e "${YELLOW}📁 Directorio dist: No existe aún${NC}"
        fi
        
        # Estado del sistema
        echo ""
        echo -e "${BLUE}💻 Sistema:${NC}"
        local cpu_load=$(uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}' | sed 's/,//' 2>/dev/null || echo "N/A")
        local disk_usage=$(df -h . | tail -1 | awk '{print $5}' 2>/dev/null || echo "N/A")
        echo -e "  CPU Load: ${YELLOW}${cpu_load}${NC}"
        echo -e "  Disco: ${YELLOW}${disk_usage}${NC} usado"
        
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}Actualizando en ${PROGRESS_CHECK_INTERVAL} segundos... (Ctrl+C para detener)${NC}"
        
        sleep $PROGRESS_CHECK_INTERVAL
    done
    
    # Esperar resultado final
    wait $build_pid
    local exit_code=$?
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}           RESULTADO FINAL${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ BUILD COMPLETADO EXITOSAMENTE${NC}"
        
        # Mostrar resultado final
        if [ -d "dist" ]; then
            local dist_size=$(du -sh dist 2>/dev/null | cut -f1 || echo "0B")
            local file_count=$(find dist -type f 2>/dev/null | wc -l || echo "0")
            echo -e "${GREEN}📁 Resultado: ${dist_size} (${file_count} archivos)${NC}"
            
            echo -e "${BLUE}📄 Archivos principales:${NC}"
            find dist -name "*.js" -o -name "*.css" -o -name "*.html" 2>/dev/null | head -5 | while read file; do
                local size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "0B")
                echo -e "  ${GREEN}${file}${NC} (${size})"
            done
        fi
    else
        echo -e "${RED}❌ BUILD FALLÓ con código: ${exit_code}${NC}"
    fi
    
    return $exit_code
}

# Función para limpieza automática
auto_cleanup() {
    echo -e "${PURPLE}🧹 LIMPIEZA AUTOMÁTICA INICIADA${NC}"
    
    # Limpiar archivos temporales
    echo -e "${BLUE}Limpiando archivos temporales...${NC}"
    find . -name "*.tmp" -o -name "*.temp" -o -name "*.log" -mtime +1 2>/dev/null | xargs rm -f 2>/dev/null || true
    
    # Limpiar cache de Vite
    echo -e "${BLUE}Limpiando cache de Vite...${NC}"
    rm -rf node_modules/.vite 2>/dev/null || true
    
    # Limpiar directorio dist si existe
    if [ -d "dist" ]; then
        echo -e "${BLUE}Limpiando directorio dist...${NC}"
        rm -rf dist
    fi
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Manejo de argumentos
case "${1:-}" in
    "build")
        smart_build_monitor "npm run build"
        ;;
    "build:fast")
        smart_build_monitor "npm run build:fast"
        ;;
    "build:ultra")
        smart_build_monitor "npm run build:ultra"
        ;;
    "clean")
        auto_cleanup
        ;;
    "monitor")
        smart_build_monitor "npm run build:ultra"
        ;;
    *)
        echo -e "${GREEN}Uso: $0 [comando]${NC}"
        echo ""
        echo -e "${BLUE}Comandos disponibles:${NC}"
        echo -e "  build       - Build estándar con monitoreo inteligente"
        echo -e "  build:fast  - Build rápido con monitoreo inteligente"
        echo -e "  build:ultra - Build ultra con monitoreo inteligente"
        echo -e "  clean       - Limpieza automática"
        echo -e "  monitor     - Build ultra con monitoreo inteligente"
        echo ""
        echo -e "${YELLOW}Características del monitoreo inteligente:${NC}"
        echo -e "  🔍 Detección automática de colgues"
        echo -e "  📊 Monitoreo de CPU y memoria en tiempo real"
        echo -e "  ⏱️  Barra de progreso visual"
        echo -e "  🚨 Terminación automática si se detecta colgue"
        echo -e "  📁 Verificación de progreso del directorio dist"
        echo ""
        echo -e "${PURPLE}Ejemplo: $0 build:ultra${NC}"
        exit 1
        ;;
esac
