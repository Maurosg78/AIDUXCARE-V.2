#!/bin/bash

# Script para verificar que el dominio está configurado correctamente

DOMAIN="aiduxcare.com"

echo "🔍 VERIFICACIÓN DE DOMINIO: $DOMAIN"
echo "===================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Verificar DNS
info "1. Verificando DNS..."
if command -v dig &> /dev/null; then
    DNS_A=$(dig +short $DOMAIN A 2>/dev/null | head -1)
    DNS_AAAA=$(dig +short $DOMAIN AAAA 2>/dev/null | head -1)
    DNS_CNAME=$(dig +short www.$DOMAIN CNAME 2>/dev/null | head -1)
    
    if [ -n "$DNS_A" ]; then
        success "Registro A: $DNS_A"
    else
        error "No se encontró registro A"
    fi
    
    if [ -n "$DNS_AAAA" ]; then
        success "Registro AAAA: $DNS_AAAA"
    fi
    
    if [ -n "$DNS_CNAME" ]; then
        success "Registro CNAME (www): $DNS_CNAME"
    fi
else
    warning "dig no está instalado. Usando nslookup..."
    nslookup $DOMAIN 2>/dev/null || error "No se pudo resolver DNS"
fi
echo ""

# Verificar HTTP/HTTPS
info "2. Verificando HTTP/HTTPS..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null || echo "000")
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        success "HTTP responde: $HTTP_CODE"
    else
        warning "HTTP no responde correctamente: $HTTP_CODE"
    fi
    
    if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "301" ] || [ "$HTTPS_CODE" = "302" ]; then
        success "HTTPS responde: $HTTPS_CODE"
    else
        error "HTTPS no responde correctamente: $HTTPS_CODE"
        warning "SSL puede estar aún configurándose (esperar 24-48h)"
    fi
else
    warning "curl no está instalado"
fi
echo ""

# Verificar SSL
info "3. Verificando certificado SSL..."
if command -v openssl &> /dev/null; then
    SSL_INFO=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -E "Verify return code|subject=" || echo "")
    if [ -n "$SSL_INFO" ]; then
        success "SSL configurado"
        echo "$SSL_INFO" | head -2
    else
        warning "No se pudo verificar SSL (puede estar aún configurándose)"
    fi
else
    warning "openssl no está instalado"
fi
echo ""

# Verificar rutas específicas
info "4. Verificando rutas específicas..."
if command -v curl &> /dev/null; then
    ROUTES=("/" "/hospital" "/login")
    for route in "${ROUTES[@]}"; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN$route 2>/dev/null || echo "000")
        if [ "$CODE" = "200" ]; then
            success "$route → $CODE"
        else
            warning "$route → $CODE"
        fi
    done
fi
echo ""

# Resumen
echo "================================================"
info "Verificación completada"
echo ""
info "Para verificar manualmente:"
echo "   - DNS: dig $DOMAIN"
echo "   - HTTP: curl -I http://$DOMAIN"
echo "   - HTTPS: curl -I https://$DOMAIN"
echo "   - SSL: openssl s_client -connect $DOMAIN:443"
echo ""


