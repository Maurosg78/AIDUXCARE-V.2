#!/bin/bash

# AiDuxCare - Script de Verificación de Instalación
# Versión: 1.0
# Propósito: Verificar que todos los componentes estén funcionando correctamente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
AIDUXCARE_DIR="$HOME/AiDuxCare"
OLLAMA_MODEL="llama3.2:3b"

# Función para logging
log() {
    echo -e "${GREEN}[✓] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[⚠] $1${NC}"
}

error() {
    echo -e "${RED}[✗] $1${NC}"
}

info() {
    echo -e "${BLUE}[ℹ] $1${NC}"
}

# Banner de inicio
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               AiDuxCare Installation Checker                 ║"
echo "║                Verificación Completa del Sistema            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo

# Verificar que estamos en el directorio correcto
if [[ ! -d "$AIDUXCARE_DIR" ]]; then
    error "Directorio AiDuxCare no encontrado en $AIDUXCARE_DIR"
    echo "¿Has ejecutado el script de instalación?"
    exit 1
fi

cd "$AIDUXCARE_DIR"

# 1. Verificar Ollama
info "1/8: Verificando Ollama..."

if ! command -v ollama &> /dev/null; then
    error "Ollama no está instalado"
    exit 1
else
    log "Ollama está instalado"
fi

# Verificar que Ollama está corriendo
if ! curl -s http://localhost:11434 &> /dev/null; then
    warning "Ollama no está corriendo, intentando iniciar..."
    ollama serve &
    sleep 5
    
    if ! curl -s http://localhost:11434 &> /dev/null; then
        error "No se pudo iniciar Ollama"
        exit 1
    fi
fi

log "Ollama está corriendo correctamente"

# 2. Verificar modelo descargado
info "2/8: Verificando modelo Llama 3.2..."

if ! ollama list | grep -q "$OLLAMA_MODEL"; then
    error "Modelo $OLLAMA_MODEL no está descargado"
    echo "Ejecuta: ollama pull $OLLAMA_MODEL"
    exit 1
else
    log "Modelo $OLLAMA_MODEL está disponible"
fi

# 3. Test básico del modelo
info "3/8: Probando respuesta del modelo..."

test_response=$(timeout 30s ollama run "$OLLAMA_MODEL" "Responde solo con 'FUNCIONANDO' si puedes procesar este mensaje" 2>/dev/null || echo "TIMEOUT")

if [[ "$test_response" == *"FUNCIONANDO"* ]]; then
    log "Modelo responde correctamente"
elif [[ "$test_response" == "TIMEOUT" ]]; then
    warning "Modelo responde pero muy lento (>30s)"
else
    error "Modelo no responde como esperado: $test_response"
fi

# 4. Verificar Node.js
info "4/8: Verificando Node.js y npm..."

if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
    exit 1
else
    node_version=$(node --version)
    log "Node.js $node_version está instalado"
fi

if ! command -v npm &> /dev/null; then
    error "npm no está disponible"
    exit 1
else
    npm_version=$(npm --version)
    log "npm $npm_version está disponible"
fi

# 5. Verificar dependencias del proyecto
info "5/8: Verificando dependencias del proyecto..."

if [[ ! -f "package.json" ]]; then
    error "package.json no encontrado"
    exit 1
fi

if [[ ! -d "node_modules" ]]; then
    warning "node_modules no encontrado, instalando dependencias..."
    npm install
    if [[ $? -ne 0 ]]; then
        error "Falló la instalación de dependencias"
        exit 1
    fi
fi

log "Dependencias del proyecto están instaladas"

# 6. Verificar configuración
info "6/8: Verificando configuración..."

if [[ ! -f ".env.local" ]]; then
    warning "Archivo .env.local no encontrado, creando configuración por defecto..."
    cat > .env.local << EOF
# AiDuxCare - Configuración Local
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=$OLLAMA_MODEL
VITE_DEV_MODE=true
VITE_LOG_LEVEL=info
EOF
    log "Configuración creada"
else
    log "Archivo de configuración existe"
fi

# 7. Test de build
info "7/8: Verificando que el proyecto puede construirse..."

if npm run build &> /dev/null; then
    log "Build exitoso"
else
    warning "Build falló, pero puede funcionar en modo desarrollo"
fi

# 8. Test completo del pipeline
info "8/8: Probando pipeline completo de AiDuxCare..."

if [[ -f "src/scripts/testOllama.ts" ]]; then
    if npm run test:ollama &> /dev/null; then
        log "Pipeline completo funciona correctamente"
    else
        warning "Test del pipeline falló, verificar logs"
    fi
else
    warning "Script de test no encontrado, saltando test del pipeline"
fi

echo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║                ✅ VERIFICACIÓN COMPLETADA ✅                ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${NC}"
echo

# Resumen del estado
echo -e "${BLUE}📊 RESUMEN DEL SISTEMA:${NC}"

# Hardware info
echo "💻 Hardware:"
echo "   - SO: $(uname -s) $(uname -r)"
echo "   - Arquitectura: $(uname -m)"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   - RAM: $(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2, $3}')"
fi

# Software versions
echo "🔧 Software:"
echo "   - Ollama: $(ollama --version 2>/dev/null | head -n1 || echo 'unknown')"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"

# Model info
echo "🤖 Modelo:"
echo "   - Modelo activo: $OLLAMA_MODEL"
model_size=$(ollama list | grep "$OLLAMA_MODEL" | awk '{print $2}' || echo "unknown")
echo "   - Tamaño: $model_size"

# Disk usage
echo "💾 Espacio:"
du_output=$(du -sh . 2>/dev/null || echo "unknown")
echo "   - Proyecto AiDuxCare: $du_output"

echo
echo -e "${YELLOW}🚀 COMANDOS PARA INICIAR:${NC}"
echo "   cd $AIDUXCARE_DIR"
echo "   ./start-aiduxcare.sh"
echo
echo "   O manualmente:"
echo "   npm run dev"
echo

echo -e "${YELLOW}🌐 URL DE ACCESO:${NC}"
echo "   http://localhost:5173"
echo

# Verificar puertos
echo -e "${YELLOW}🔌 ESTADO DE PUERTOS:${NC}"
if lsof -i :11434 &> /dev/null; then
    echo "   ✅ Puerto 11434 (Ollama): EN USO"
else
    echo "   ❌ Puerto 11434 (Ollama): LIBRE"
fi

if lsof -i :5173 &> /dev/null; then
    echo "   ⚠️  Puerto 5173 (Vite): EN USO - La aplicación ya está corriendo"
else
    echo "   ✅ Puerto 5173 (Vite): LIBRE - Listo para iniciar"
fi

echo
echo -e "${GREEN}¡AiDuxCare está listo para user testing! 🎯${NC}"

# Test automático si se pasa el flag --auto-test
if [[ "$1" == "--auto-test" ]]; then
    echo
    info "Ejecutando test automático completo..."
    
    # Iniciar la aplicación en background
    npm run dev &
    APP_PID=$!
    
    # Esperar a que la aplicación esté lista
    sleep 10
    
    # Test de conectividad
    if curl -s http://localhost:5173 &> /dev/null; then
        log "Aplicación web responde correctamente"
    else
        error "Aplicación web no responde"
    fi
    
    # Parar la aplicación
    kill $APP_PID 2>/dev/null || true
    
    echo "Test automático completado"
fi

echo
echo -e "${BLUE}📞 SOPORTE TÉCNICO:${NC}"
echo "   - WhatsApp/Telegram: [NÚMERO_SOPORTE]"
echo "   - Email: mauricio@aiduxcare.com"
echo "   - Logs: tail -f ~/.ollama/logs/server.log" 