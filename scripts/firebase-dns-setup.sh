#!/bin/bash

# Script de Configuración DNS para Firebase Hosting
# Genera reporte completo y comandos para configuración manual

# --- Colores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DOMAIN="aiduxcare.com"
PROJECT_ID="aiduxcare-v2-uat-dev"
EXPECTED_IP="199.36.158.100"
EXPECTED_TXT="hosting-site=aiduxcare-v2-uat-dev"

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

log_step() {
    echo -e "${CYAN}📋 $1${NC}"
}

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🔧 Firebase DNS Setup - Reporte Completo"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar Firebase CLI
log_step "Verificando Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI no está instalado"
    echo "Instala con: npm install -g firebase-tools"
    exit 1
fi
log_success "Firebase CLI detectado: $(firebase --version | head -n 1)"
echo ""

# Verificar proyecto Firebase
log_step "Verificando proyecto Firebase..."
CURRENT_PROJECT=$(firebase use 2>&1 | grep -oP 'Using \K[^\s]+' || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    log_warning "Proyecto actual: ${CURRENT_PROJECT:-Ninguno}"
    log_info "Intentando cambiar a proyecto: $PROJECT_ID"
    firebase use "$PROJECT_ID" 2>&1 | grep -v "Already using" || true
fi
log_success "Proyecto: $PROJECT_ID"
echo ""

# Verificar DNS actual
log_step "Verificando DNS actual para $DOMAIN..."
echo ""

echo "📊 Registros A (IPv4):"
A_RECORDS=$(dig $DOMAIN A +short | sort -u)
if [ -z "$A_RECORDS" ]; then
    log_error "No se encontraron registros A"
else
    echo "$A_RECORDS" | while read -r ip; do
        if [ "$ip" == "$EXPECTED_IP" ]; then
            log_success "  $ip (CORRECTO - Firebase)"
        else
            log_error "  $ip (INCORRECTO - Debe ser eliminado)"
        fi
    done
fi
echo ""

echo "📊 Registros AAAA (IPv6):"
AAAA_RECORDS=$(dig $DOMAIN AAAA +short | sort -u)
if [ -z "$AAAA_RECORDS" ]; then
    log_success "No hay registros AAAA (CORRECTO - Firebase no requiere IPv6)"
else
    echo "$AAAA_RECORDS" | while read -r ipv6; do
        log_error "  $ipv6 (INCORRECTO - Debe ser eliminado)"
    done
fi
echo ""

echo "📊 Registros TXT:"
TXT_RECORDS=$(dig $DOMAIN TXT +short)
if [ -z "$TXT_RECORDS" ]; then
    log_error "No se encontraron registros TXT"
else
    echo "$TXT_RECORDS" | while read -r txt; do
        if echo "$txt" | grep -q "$EXPECTED_TXT"; then
            log_success "  $txt (CORRECTO - Firebase)"
        elif echo "$txt" | grep -q "spf1"; then
            log_info "  $txt (Email SPF - OK)"
        else
            log_warning "  $txt (Verificar si es necesario)"
        fi
    done
fi
echo ""

# Generar reporte de configuración requerida
log_step "Generando configuración DNS requerida..."
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  📋 CONFIGURACIÓN DNS REQUERIDA EN PORKBUN"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "✅ REGISTROS QUE DEBEN EXISTIR:"
echo ""
echo "1. Registro A (IPv4) - Dominio raíz:"
echo "   Tipo:     A"
echo "   Host:     @ (o dejar vacío)"
echo "   Value:    $EXPECTED_IP"
echo "   TTL:      600"
echo ""

echo "2. Registro A (IPv4) - Subdominio app:"
echo "   Tipo:     A"
echo "   Host:     app"
echo "   Value:    $EXPECTED_IP"
echo "   TTL:      600"
echo ""

echo "3. Registro CNAME - Subdominio dev:"
echo "   Tipo:     CNAME"
echo "   Host:     dev"
echo "   Value:    ${PROJECT_ID}.web.app"
echo "   TTL:      600"
echo ""

echo "4. Registro CNAME - Subdominio www:"
echo "   Tipo:     CNAME"
echo "   Host:     www"
echo "   Value:    app.$DOMAIN"
echo "   TTL:      600"
echo ""

echo "5. Registro TXT - Verificación Firebase:"
echo "   Tipo:     TXT"
echo "   Host:     @ (o dejar vacío)"
echo "   Value:    $EXPECTED_TXT"
echo "   TTL:      600"
echo "   ⚠️  IMPORTANTE: Debe ser EXACTO, sin espacios extra"
echo ""

echo "6. Registro TXT - Email SPF (si no existe):"
echo "   Tipo:     TXT"
echo "   Host:     @"
echo "   Value:    v=spf1 include:_spf.google.com ~all"
echo "   TTL:      600"
echo ""

echo "7. Registro MX - Email (si no existe):"
echo "   Tipo:     MX"
echo "   Host:     @"
echo "   Value:    smtp.google.com"
echo "   Priority: 1"
echo "   TTL:      600"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  ❌ REGISTROS QUE DEBEN ELIMINARSE"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "⚠️  ELIMINA TODOS estos registros si existen:"
echo ""

# Verificar IPs problemáticas
CLOUDFLARE_IPS=("104.21.11.188" "172.67.192.98")
CLOUDFLARE_IPV6=("2606:4700:3032::ac43:c062" "2606:4700:3035::6815:bbc")

FOUND_PROBLEMS=false

for ip in "${CLOUDFLARE_IPS[@]}"; do
    if echo "$A_RECORDS" | grep -q "$ip"; then
        echo "   ❌ Tipo: A, Host: @, Value: $ip"
        FOUND_PROBLEMS=true
    fi
done

for ipv6 in "${CLOUDFLARE_IPV6[@]}"; do
    if echo "$AAAA_RECORDS" | grep -q "$ipv6"; then
        echo "   ❌ Tipo: AAAA, Host: @, Value: $ipv6"
        FOUND_PROBLEMS=true
    fi
done

if [ "$FOUND_PROBLEMS" = false ]; then
    log_success "No se detectaron registros problemáticos en DNS público"
    echo "   (Pero verifica manualmente en Porkbun por si hay cache)"
fi

echo ""

# Verificar si hay IPs incorrectas adicionales
if [ ! -z "$A_RECORDS" ]; then
    echo "$A_RECORDS" | while read -r ip; do
        if [ "$ip" != "$EXPECTED_IP" ] && [[ ! " ${CLOUDFLARE_IPS[@]} " =~ " ${ip} " ]]; then
            log_warning "   ⚠️  Tipo: A, Host: @, Value: $ip (IP desconocida - verificar)"
        fi
    done
fi

echo ""

# Instrucciones de verificación
echo "════════════════════════════════════════════════════════════"
echo "  📝 PASOS SIGUIENTES"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "1. Accede a Porkbun DNS Management:"
echo "   https://porkbun.com/account/domains"
echo ""

echo "2. Selecciona el dominio: $DOMAIN"
echo ""

echo "3. Ve a la sección 'DNS Records' o 'DNS'"
echo ""

echo "4. ELIMINA todos los registros problemáticos listados arriba"
echo ""

echo "5. VERIFICA que existan todos los registros requeridos"
echo "   (Si falta alguno, agrégalo con los valores exactos)"
echo ""

echo "6. ESPERA 1-2 horas para propagación DNS"
echo ""

echo "7. Verifica nuevamente ejecutando:"
echo "   ./scripts/verify-dns-firebase.sh"
echo ""

echo "8. Re-verifica en Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/hosting"
echo ""

# Generar comando de verificación
echo "════════════════════════════════════════════════════════════"
echo "  🔍 COMANDOS DE VERIFICACIÓN"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "# Verificar registros A:"
echo "dig $DOMAIN A +short"
echo ""

echo "# Verificar registros AAAA:"
echo "dig $DOMAIN AAAA +short"
echo ""

echo "# Verificar registros TXT:"
echo "dig $DOMAIN TXT +short"
echo ""

echo "# Ejecutar script de verificación completo:"
echo "./scripts/verify-dns-firebase.sh"
echo ""

# Resumen final
echo "════════════════════════════════════════════════════════════"
echo "  📊 RESUMEN"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ "$FOUND_PROBLEMS" = true ]; then
    log_error "Se detectaron registros DNS problemáticos"
    echo "   Acción requerida: Eliminar registros antiguos en Porkbun"
else
    log_success "No se detectaron registros problemáticos en DNS público"
    echo "   Verifica manualmente en Porkbun y espera propagación"
fi

echo ""
log_info "Reporte completo generado"
echo ""


