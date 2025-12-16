#!/bin/bash

# Script de Verificación DNS para Firebase Hosting
# Verifica que los registros DNS estén configurados correctamente

# --- Colores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="aiduxcare.com"
EXPECTED_IP="199.36.158.100"
EXPECTED_TXT="hosting-site=aiduxcare-v2-uat-dev"

# IPs antiguas de Cloudflare que NO deben existir
CLOUDFLARE_IPS=(
  "104.21.11.188"
  "172.67.192.98"
)

CLOUDFLARE_IPV6=(
  "2606:4700:3032::ac43:c062"
  "2606:4700:3035::6815:bbc"
)

log_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
log_info "🔍 Verificando DNS para ${DOMAIN}..."
echo ""

# Verificar registros A
log_info "📋 Verificando registros A (IPv4)..."
A_RECORDS=$(dig ${DOMAIN} A +short)

if [ -z "$A_RECORDS" ]; then
    log_error "No se encontraron registros A para ${DOMAIN}"
else
    echo "Registros A encontrados:"
    echo "$A_RECORDS" | while read -r ip; do
        if [ "$ip" == "$EXPECTED_IP" ]; then
            log_success "  ✅ ${ip} (CORRECTO - Firebase IP)"
        elif [[ " ${CLOUDFLARE_IPS[@]} " =~ " ${ip} " ]]; then
            log_error "  ❌ ${ip} (INCORRECTO - IP antigua de Cloudflare - DEBE ELIMINARSE)"
        else
            log_warning "  ⚠️  ${ip} (IP desconocida - verificar si es correcta)"
        fi
    done
fi

echo ""

# Verificar registros AAAA (IPv6)
log_info "📋 Verificando registros AAAA (IPv6)..."
AAAA_RECORDS=$(dig ${DOMAIN} AAAA +short)

if [ -z "$AAAA_RECORDS" ]; then
    log_success "No se encontraron registros AAAA (CORRECTO - Firebase no requiere IPv6)"
else
    echo "Registros AAAA encontrados:"
    echo "$AAAA_RECORDS" | while read -r ipv6; do
        if [[ " ${CLOUDFLARE_IPV6[@]} " =~ " ${ipv6} " ]]; then
            log_error "  ❌ ${ipv6} (INCORRECTO - IPv6 antigua de Cloudflare - DEBE ELIMINARSE)"
        else
            log_warning "  ⚠️  ${ipv6} (IPv6 desconocida - verificar si es correcta)"
        fi
    done
fi

echo ""

# Verificar registro TXT de Firebase
log_info "📋 Verificando registro TXT de Firebase..."
TXT_RECORDS=$(dig ${DOMAIN} TXT +short | grep -i "hosting-site")

if [ -z "$TXT_RECORDS" ]; then
    log_error "No se encontró el registro TXT de Firebase"
    log_info "Debe existir: TXT @ → hosting-site=aiduxcare-v2-uat-dev"
else
    if echo "$TXT_RECORDS" | grep -q "$EXPECTED_TXT"; then
        log_success "Registro TXT encontrado: ${TXT_RECORDS}"
    else
        log_warning "Registro TXT encontrado pero puede estar mal formateado: ${TXT_RECORDS}"
        log_info "Debe ser exactamente: hosting-site=aiduxcare-v2-uat-dev"
    fi
fi

echo ""

# Verificar todos los registros TXT
log_info "📋 Todos los registros TXT:"
ALL_TXT=$(dig ${DOMAIN} TXT +short)
if [ -z "$ALL_TXT" ]; then
    log_warning "No se encontraron registros TXT"
else
    echo "$ALL_TXT"
fi

echo ""

# Resumen
log_info "📊 RESUMEN:"
echo ""

# Verificar si hay IPs incorrectas
HAS_CLOUDFLARE_IPS=false
for ip in $A_RECORDS; do
    if [[ " ${CLOUDFLARE_IPS[@]} " =~ " ${ip} " ]]; then
        HAS_CLOUDFLARE_IPS=true
        break
    fi
done

HAS_CLOUDFLARE_IPV6=false
if [ ! -z "$AAAA_RECORDS" ]; then
    for ipv6 in $AAAA_RECORDS; do
        if [[ " ${CLOUDFLARE_IPV6[@]} " =~ " ${ipv6} " ]]; then
            HAS_CLOUDFLARE_IPV6=true
            break
        fi
    done
fi

if [ "$HAS_CLOUDFLARE_IPS" = true ] || [ "$HAS_CLOUDFLARE_IPV6" = true ]; then
    log_error "PROBLEMA DETECTADO: Hay registros DNS antiguos de Cloudflare"
    echo ""
    log_info "Acciones requeridas:"
    if [ "$HAS_CLOUDFLARE_IPS" = true ]; then
        echo "  1. Elimina los registros A con IPs de Cloudflare en Porkbun"
    fi
    if [ "$HAS_CLOUDFLARE_IPV6" = true ]; then
        echo "  2. Elimina los registros AAAA con IPv6 de Cloudflare en Porkbun"
    fi
    echo "  3. Espera 1-2 horas para propagación DNS"
    echo "  4. Re-verifica en Firebase Console"
else
    log_success "No se detectaron registros antiguos de Cloudflare"
fi

echo ""
log_info "✅ Verificación completada"
echo ""


