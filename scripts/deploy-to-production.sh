#!/bin/bash

# Script para build y deploy completo a producción

set -e

echo "🚀 DEPLOY A PRODUCCIÓN"
echo "======================"
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

PROJECT_ID="${FIREBASE_PROJECT_ID:-aiduxcare-v2-uat-dev}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Paso 1: Verificar Firebase CLI
info "Paso 1/5: Verificando Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    error "Firebase CLI no está instalado"
    echo "   Instalar con: npm install -g firebase-tools"
    exit 1
fi
success "Firebase CLI instalado"
echo ""

# Paso 2: Verificar autenticación
info "Paso 2/5: Verificando autenticación..."
if ! firebase projects:list &> /dev/null; then
    warning "No estás autenticado. Iniciando login..."
    firebase login
fi
success "Autenticado"
echo ""

# Paso 3: Seleccionar proyecto
info "Paso 3/5: Seleccionando proyecto: $PROJECT_ID..."
firebase use "$PROJECT_ID" 2>&1 | grep -q "Now using" && success "Proyecto seleccionado" || info "Proyecto ya seleccionado"
echo ""

# Paso 4: Build
info "Paso 4/5: Ejecutando build de producción..."
if npm run build; then
    success "Build completado"
else
    error "Build falló"
    exit 1
fi
echo ""

# Verificar que dist existe
if [ ! -d "dist" ]; then
    error "Directorio dist no existe después del build"
    exit 1
fi

# Paso 5: Deploy
info "Paso 5/5: Desplegando a Firebase Hosting..."
read -p "¿Continuar con el deploy? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if firebase deploy --only hosting; then
        success "Deploy completado"
        echo ""
        info "URLs disponibles:"
        echo "   - https://$PROJECT_ID.web.app"
        echo "   - https://$PROJECT_ID.firebaseapp.com"
        if [ -n "$DOMAIN" ]; then
            echo "   - https://aiduxcare.com"
            echo "   - https://aiduxcare.com/hospital"
        fi
    else
        error "Deploy falló"
        exit 1
    fi
else
    warning "Deploy cancelado"
fi
echo ""

success "Proceso completado"
echo ""


