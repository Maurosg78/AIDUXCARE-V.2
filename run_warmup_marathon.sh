#!/bin/bash

# 🔥 SCRIPT DE MARATÓN DE CALENTAMIENTO - ESTRATEGIA PARA DESBLOQUEAR VERTEX AI
# 
# Este script ejecuta de forma continua el test de calentamiento para generar
# actividad masiva en las APIs de Google Cloud y potencialmente desbloquear Vertex AI
#
# Autor: Claude Assistant
# Fecha: 2025-06-22
# Proyecto: aiduxcare-mvp-prod

# Configuración
LOG_FILE="warmup_marathon_log.txt"
INTERVAL_MINUTES=10
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))
SCRIPT_PATH="scripts/test-warmup-activity.cjs"

# Colores para la consola
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables de control
total_executions=0
successful_executions=0
failed_executions=0
start_time=$(date +%s)

# Función para imprimir con timestamp
print_with_timestamp() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message"
}

# Función para imprimir con timestamp y color
print_with_timestamp_color() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${color}[$timestamp] $message${NC}"
}

# Función para manejar la interrupción (Ctrl+C)
cleanup() {
    echo ""
    print_with_timestamp_color "🛑 PROCESO DE MARATÓN DETENIDO POR EL USUARIO" $YELLOW
    echo ""
    
    # Calcular tiempo total de ejecución
    end_time=$(date +%s)
    total_duration=$((end_time - start_time))
    hours=$((total_duration / 3600))
    minutes=$(((total_duration % 3600) / 60))
    seconds=$((total_duration % 60))
    
    # Mostrar resumen final
    print_with_timestamp_color "📊 RESUMEN FINAL DEL MARATÓN DE CALENTAMIENTO" $CYAN
    print_with_timestamp_color "============================================================" $CYAN
    print_with_timestamp_color "🔥 Tiempo total de ejecución: ${hours}h ${minutes}m ${seconds}s" $CYAN
    print_with_timestamp_color "📋 Total de ejecuciones: $total_executions" $CYAN
    print_with_timestamp_color "✅ Ejecuciones exitosas: $successful_executions" $GREEN
    print_with_timestamp_color "❌ Ejecuciones fallidas: $failed_executions" $RED
    
    if [ $total_executions -gt 0 ]; then
        success_rate=$((successful_executions * 100 / total_executions))
        print_with_timestamp_color "📈 Tasa de éxito: ${success_rate}%" $CYAN
    fi
    
    print_with_timestamp_color "📝 Log completo disponible en: $LOG_FILE" $CYAN
    print_with_timestamp_color "🎯 Objetivo: Desbloquear Vertex AI mediante actividad legítima" $PURPLE
    echo ""
    print_with_timestamp_color "🔥 ¡Maratón de calentamiento completado! Revisa los logs para más detalles." $GREEN
    echo ""
    
    exit 0
}

# Configurar trap para manejar Ctrl+C
trap cleanup SIGINT SIGTERM

# Función para verificar si el script de prueba existe
check_prerequisites() {
    if [ ! -f "$SCRIPT_PATH" ]; then
        print_with_timestamp_color "❌ ERROR: No se encontró el script de prueba en $SCRIPT_PATH" $RED
        print_with_timestamp_color "💡 Asegúrate de estar en el directorio raíz del proyecto" $YELLOW
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_with_timestamp_color "❌ ERROR: Node.js no está instalado o no está en el PATH" $RED
        print_with_timestamp_color "💡 Instala Node.js para continuar" $YELLOW
        exit 1
    fi
    
    print_with_timestamp_color "✅ Prerrequisitos verificados correctamente" $GREEN
}

# Función para ejecutar con timeout (compatible con macOS)
run_with_timeout() {
    local timeout_seconds=$1
    shift
    local command="$@"
    
    # En macOS, usamos gtimeout si está disponible, sino ejecutamos sin timeout
    if command -v gtimeout &> /dev/null; then
        gtimeout $timeout_seconds $command
    else
        # Sin timeout en macOS, pero con un proceso background para simular
        $command &
        local pid=$!
        sleep $timeout_seconds
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null
            return 124  # Timeout
        else
            wait $pid
            return $?
        fi
    fi
}

# Función para ejecutar una iteración del test
run_test_iteration() {
    local iteration=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    print_with_timestamp_color "🔥 INICIANDO ITERACIÓN #$iteration" $PURPLE
    print_with_timestamp_color "⏰ Timestamp: $timestamp" $BLUE
    print_with_timestamp_color "🔄 Ejecutando script de calentamiento..." $CYAN
    
    # Ejecutar el script y capturar la salida
    local output
    local exit_code
    
    # Ejecutar el script (sin timeout en macOS por simplicidad)
    output=$(node "$SCRIPT_PATH" 1 1 2>&1)
    exit_code=$?
    
    # Registrar en el archivo de log
    echo "" >> "$LOG_FILE"
    echo "==================================================================================" >> "$LOG_FILE"
    echo "[$timestamp] ITERACIÓN #$iteration" >> "$LOG_FILE"
    echo "==================================================================================" >> "$LOG_FILE"
    echo "$output" >> "$LOG_FILE"
    echo "==================================================================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    # Analizar el resultado
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "warmupStatus: COMPLETED"; then
        print_with_timestamp_color "✅ ITERACIÓN #$iteration COMPLETADA EXITOSAMENTE" $GREEN
        print_with_timestamp_color "🔥 Actividad de calentamiento: EJECUTADA" $GREEN
        ((successful_executions++))
    else
        print_with_timestamp_color "❌ ITERACIÓN #$iteration FALLÓ" $RED
        print_with_timestamp_color "🔍 Revisa el log para más detalles: $LOG_FILE" $YELLOW
        ((failed_executions++))
    fi
    
    ((total_executions++))
    
    # Mostrar estadísticas actuales
    print_with_timestamp_color "📊 Estadísticas actuales:" $CYAN
    print_with_timestamp_color "   Total: $total_executions | ✅ Éxitos: $successful_executions | ❌ Fallos: $failed_executions" $CYAN
    
    if [ $total_executions -gt 0 ]; then
        success_rate=$((successful_executions * 100 / total_executions))
        print_with_timestamp_color "   📈 Tasa de éxito: ${success_rate}%" $CYAN
    fi
}

# Función para calcular próxima ejecución (compatible con macOS)
get_next_execution_time() {
    local current_time=$(date +%s)
    local next_time=$((current_time + INTERVAL_SECONDS))
    date -r $next_time '+%H:%M:%S'
}

# Función principal
main() {
    # Limpiar pantalla y mostrar header
    clear
    print_with_timestamp_color "🔥 MARATÓN DE CALENTAMIENTO - ESTRATEGIA PARA DESBLOQUEAR VERTEX AI" $PURPLE
    print_with_timestamp_color "==================================================================================" $PURPLE
    print_with_timestamp_color "🎯 Objetivo: Generar actividad masiva en Google Cloud APIs" $CYAN
    print_with_timestamp_color "⏰ Intervalo entre ejecuciones: $INTERVAL_MINUTES minutos" $CYAN
    print_with_timestamp_color "📝 Log file: $LOG_FILE" $CYAN
    print_with_timestamp_color "🛑 Para detener: Presiona Ctrl+C" $YELLOW
    echo ""
    
    # Verificar prerrequisitos
    check_prerequisites
    
    # Crear archivo de log si no existe
    if [ ! -f "$LOG_FILE" ]; then
        echo "🔥 MARATÓN DE CALENTAMIENTO - LOG INICIADO $(date)" > "$LOG_FILE"
        echo "==================================================================================" >> "$LOG_FILE"
    fi
    
    print_with_timestamp_color "🚀 INICIANDO MARATÓN DE CALENTAMIENTO..." $GREEN
    print_with_timestamp_color "⏰ Hora de inicio: $(date)" $BLUE
    echo ""
    
    # Bucle principal
    iteration=1
    while true; do
        run_test_iteration $iteration
        
        print_with_timestamp_color "⏰ Esperando $INTERVAL_MINUTES minutos antes de la siguiente iteración..." $YELLOW
        print_with_timestamp_color "⏰ Próxima ejecución: $(get_next_execution_time)" $BLUE
        echo ""
        
        # Pausa entre iteraciones
        sleep $INTERVAL_SECONDS
        
        ((iteration++))
    done
}

# Ejecutar función principal
main
