#!/bin/bash

# Script para monitorear la propagación DNS
# Ejecuta verificaciones periódicas hasta que los cambios se propaguen

DOMAIN="aiduxcare.com"
EXPECTED_IP="199.36.158.100"
EXPECTED_TXT="hosting-site=aiduxcare-v2-uat-dev"
CHECK_INTERVAL=300  # 5 minutos

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

check_dns() {
    local all_correct=true
    
    # Verificar registros A
    A_RECORDS=$(dig $DOMAIN A +short | sort -u)
    if echo "$A_RECORDS" | grep -q "$EXPECTED_IP"; then
        if [ "$(echo "$A_RECORDS" | wc -l)" -eq 1 ] && [ "$A_RECORDS" == "$EXPECTED_IP" ]; then
            log_success "Registros A correctos: $A_RECORDS"
        else
            log_warning "Registros A encontrados: $A_RECORDS (debe ser solo $EXPECTED_IP)"
            all_correct=false
        fi
    else
        log_error "Registros A incorrectos: $A_RECORDS (debe ser $EXPECTED_IP)"
        all_correct=false
    fi
    
    # Verificar registros AAAA (no deben existir)
    AAAA_RECORDS=$(dig $DOMAIN AAAA +short | sort -u)
    if [ -z "$AAAA_RECORDS" ]; then
        log_success "No hay registros AAAA (correcto)"
    else
        log_error "Registros AAAA encontrados (deben eliminarse): $AAAA_RECORDS"
        all_correct=false
    fi
    
    # Verificar registro TXT
    TXT_RECORDS=$(dig $DOMAIN TXT +short)
    if echo "$TXT_RECORDS" | grep -q "$EXPECTED_TXT"; then
        log_success "Registro TXT de Firebase encontrado"
    else
        log_error "Registro TXT de Firebase NO encontrado"
        all_correct=false
    fi
    
    return $([ "$all_correct" = true ] && echo 0 || echo 1)
}

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🔍 Monitor de Propagación DNS"
echo "════════════════════════════════════════════════════════════"
echo ""
log_info "Monitoreando propagación DNS para $DOMAIN"
log_info "Verificando cada $((CHECK_INTERVAL / 60)) minutos"
log_info "Presiona Ctrl+C para detener"
echo ""

iteration=0
while true; do
    iteration=$((iteration + 1))
    echo ""
    log_info "--- Verificación #$iteration ---"
    
    if check_dns; then
        echo ""
        log_success "¡Propagación DNS completada!"
        log_success "Todos los registros están correctos"
        echo ""
        log_info "Puedes proceder a verificar en Firebase Console:"
        echo "   https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting"
        echo ""
        exit 0
    else
        log_warning "Aún hay problemas con la configuración DNS"
        log_info "Esperando $((CHECK_INTERVAL / 60)) minutos antes de la próxima verificación..."
        sleep $CHECK_INTERVAL
    fi
done


