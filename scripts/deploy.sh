#!/bin/bash

# Script de deploy automatizado para aiduxcare.com
# Incluye verificaciones, linting, testing y deploy

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

PROJECT_ID="${FIREBASE_PROJECT_ID:-aiduxcare-v2-uat-dev}"

echo "🚀 DEPLOY AUTOMATIZADO - AIDUXCARE.COM"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Paso 1: Verificar Firebase CLI
info "Paso 1/6: Verificando Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    error "Firebase CLI no está instalado"
    echo "   Instalar con: npm install -g firebase-tools"
    exit 1
fi
success "Firebase CLI instalado: $(firebase --version)"
echo ""

# Paso 2: Verificar autenticación
info "Paso 2/6: Verificando autenticación..."
if ! firebase projects:list &> /dev/null; then
    warning "No estás autenticado. Iniciando login..."
    firebase login
fi
success "Autenticado"
echo ""

# Paso 3: Seleccionar proyecto
info "Paso 3/6: Seleccionando proyecto: $PROJECT_ID..."
firebase use "$PROJECT_ID" 2>&1 | grep -q "Now using" && success "Proyecto seleccionado" || info "Proyecto ya seleccionado"
echo ""

# Paso 4: Linting (opcional, no bloquea)
info "Paso 4/6: Ejecutando linting..."
if npm run lint 2>/dev/null; then
    success "Linting pasado"
else
    warning "Linting falló, continuando de todas formas..."
fi
echo ""

# Paso 5: Build
info "Paso 5/6: Ejecutando build de producción..."
if npm run build; then
    success "Build completado"
    
    # Verificar tamaño de bundle
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "0")
        info "Tamaño del build: $DIST_SIZE"
        
        # Verificar que index.html existe
        if [ -f "dist/index.html" ]; then
            success "index.html generado correctamente"
        else
            error "index.html no encontrado en dist/"
            exit 1
        fi
    else
        error "Directorio dist no existe después del build"
        exit 1
    fi
else
    error "Build falló"
    exit 1
fi
echo ""

# Paso 6: Deploy
info "Paso 6/6: Desplegando a Firebase Hosting..."
read -p "¿Continuar con el deploy a $PROJECT_ID? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if firebase deploy --only hosting; then
        success "Deploy completado exitosamente"
        echo ""
        info "📋 URLs disponibles:"
        echo "   - https://$PROJECT_ID.web.app"
        echo "   - https://$PROJECT_ID.firebaseapp.com"
        echo "   - https://aiduxcare.com (después de configurar DNS)"
        echo "   - https://aiduxcare.com/hospital"
        echo ""
        info "✅ Landing page pública disponible en:"
        echo "   https://$PROJECT_ID.web.app"
        echo ""
        success "¡Deploy completado!"
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


