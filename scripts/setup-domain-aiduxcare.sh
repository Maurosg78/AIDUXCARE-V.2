#!/bin/bash

# Script completo para configurar dominio aiduxcare.com
# Automatiza todo lo posible por CLI

set -e  # Exit on error

DOMAIN="aiduxcare.com"
PROJECT_ID="${FIREBASE_PROJECT_ID:-aiduxcare-v2-uat-dev}"

echo "🌐 CONFIGURACIÓN AUTOMÁTICA DE DOMINIO: $DOMAIN"
echo "================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Paso 1: Verificar Firebase CLI
info "Paso 1/7: Verificando Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    error "Firebase CLI no está instalado"
    echo "   Instalar con: npm install -g firebase-tools"
    exit 1
fi
success "Firebase CLI instalado: $(firebase --version)"
echo ""

# Paso 2: Verificar autenticación
info "Paso 2/7: Verificando autenticación..."
if ! firebase projects:list &> /dev/null; then
    warning "No estás autenticado. Iniciando login..."
    firebase login
fi
success "Autenticado correctamente"
echo ""

# Paso 3: Seleccionar proyecto
info "Paso 3/7: Seleccionando proyecto: $PROJECT_ID..."
firebase use "$PROJECT_ID" 2>&1 | grep -q "Now using" && success "Proyecto seleccionado: $PROJECT_ID" || warning "Proyecto ya estaba seleccionado"
echo ""

# Paso 4: Verificar configuración de hosting
info "Paso 4/7: Verificando configuración de hosting..."
if [ -f "firebase.json" ]; then
    success "firebase.json encontrado"
    if grep -q "hosting" firebase.json; then
        success "Hosting configurado en firebase.json"
    else
        warning "Hosting no está configurado en firebase.json"
    fi
else
    warning "firebase.json no encontrado"
fi
echo ""

# Paso 5: Verificar que dist existe (después de build)
info "Paso 5/7: Verificando directorio de build..."
if [ -d "dist" ]; then
    success "Directorio dist existe"
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "0")
    info "Tamaño: $DIST_SIZE"
else
    warning "Directorio dist no existe. Ejecuta 'npm run build' primero."
fi
echo ""

# Paso 6: Información sobre configuración de dominio
info "Paso 6/7: Información sobre configuración de dominio..."
warning "La configuración de dominio personalizado requiere Firebase Console"
echo ""
info "Para configurar el dominio $DOMAIN:"
echo "   1. Ir a Firebase Console: https://console.firebase.google.com"
echo "   2. Seleccionar proyecto: $PROJECT_ID"
echo "   3. Ir a Hosting > Configuración del sitio"
echo "   4. Click en 'Agregar dominio personalizado'"
echo "   5. Ingresar: $DOMAIN"
echo "   6. Firebase te dará los registros DNS específicos"
echo ""
info "Nota: Firebase CLI no tiene comandos para agregar dominios personalizados."
info "      Esto debe hacerse desde Firebase Console."
echo ""

# Paso 7: Verificar DNS actual
info "Paso 7/7: Verificando configuración DNS actual..."
if command -v dig &> /dev/null; then
    info "Verificando registros DNS para $DOMAIN..."
    DNS_A=$(dig +short $DOMAIN A 2>/dev/null | head -1 || echo "")
    DNS_CNAME=$(dig +short www.$DOMAIN CNAME 2>/dev/null | head -1 || echo "")
    
    if [ -n "$DNS_A" ]; then
        success "Registro A encontrado: $DNS_A"
    else
        warning "No se encontró registro A para $DOMAIN"
    fi
    
    if [ -n "$DNS_CNAME" ]; then
        success "Registro CNAME para www encontrado: $DNS_CNAME"
    else
        warning "No se encontró registro CNAME para www.$DOMAIN"
    fi
else
    warning "dig no está instalado. Instalar con: brew install bind (macOS) o apt-get install dnsutils (Linux)"
fi
echo ""

# Resumen y próximos pasos
echo "================================================"
success "Verificación completada"
echo ""
info "📋 RESUMEN:"
echo "   - Proyecto: $PROJECT_ID"
echo "   - Site ID: ${SITE_ID:-No encontrado}"
echo "   - Dominio: $DOMAIN"
echo ""
info "📝 PRÓXIMOS PASOS MANUALES:"
echo ""
echo "1. Configurar dominio en Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/hosting"
echo ""
echo "2. Obtener registros DNS de Firebase Console"
echo ""
echo "3. Configurar DNS en Porkbun:"
echo "   https://porkbun.com/account/domains"
echo ""
echo "4. Desplegar aplicación:"
echo "   npm run build"
echo "   firebase deploy --only hosting"
echo ""
echo "5. Verificar después de 24-48 horas:"
echo "   ./scripts/verify-domain.sh"
echo ""

