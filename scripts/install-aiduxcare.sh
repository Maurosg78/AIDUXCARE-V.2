#!/bin/bash

# AiDuxCare - Script de Instalación Automatizada para macOS
# Versión: 1.0
# Fecha: Junio 2025
# Propósito: Facilitar instalación para fisioterapeutas en user testing

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
AIDUXCARE_DIR="$HOME/AiDuxCare"
OLLAMA_MODEL="llama3.2:3b"
NODE_VERSION="18"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Banner de inicio
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    AiDuxCare Installer                       ║"
echo "║              Asistente Clínico Inteligente                  ║"
echo "║                    Versión MVP 1.0                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo
log "Iniciando instalación de AiDuxCare..."
echo

# Verificar requisitos del sistema
info "Verificando requisitos del sistema..."

# Verificar macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "Este script es solo para macOS. Para Windows, usa install-aiduxcare.ps1"
fi

# Verificar versión de macOS
macos_version=$(sw_vers -productVersion)
log "Detectado macOS $macos_version"

# Verificar arquitectura
arch=$(uname -m)
if [[ "$arch" == "arm64" ]]; then
    log "Detectado Apple Silicon (M1/M2/M3) - Perfecto para AiDuxCare ✓"
elif [[ "$arch" == "x86_64" ]]; then
    warning "Detectado Intel Mac - Funcionará pero M1+ es recomendado"
else
    error "Arquitectura no soportada: $arch"
fi

# Verificar RAM
ram_gb=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2}')
log "RAM detectada: $ram_gb"

if [[ "${ram_gb%% *}" -lt 8 ]]; then
    warning "RAM menor a 8GB detectada. AiDuxCare puede funcionar lento."
    read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar espacio en disco
available_space=$(df -h ~ | awk 'NR==2{print $4}' | sed 's/Gi//')
if [[ "${available_space%.*}" -lt 10 ]]; then
    error "Se necesitan al menos 10GB de espacio libre. Disponible: ${available_space}GB"
fi

log "Verificación de sistema completada ✓"
echo

# Paso 1: Instalar Homebrew si no existe
info "Paso 1/6: Verificando Homebrew..."

if ! command -v brew &> /dev/null; then
    log "Instalando Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for M1 Macs
    if [[ "$arch" == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    log "Homebrew ya está instalado ✓"
fi

# Actualizar Homebrew
log "Actualizando Homebrew..."
brew update || warning "No se pudo actualizar Homebrew, continuando..."

echo

# Paso 2: Instalar Ollama
info "Paso 2/6: Instalando Ollama..."

if ! command -v ollama &> /dev/null; then
    log "Instalando Ollama via Homebrew..."
    brew install ollama
else
    log "Ollama ya está instalado ✓"
    ollama_version=$(ollama --version 2>/dev/null | head -n1 || echo "unknown")
    log "Versión: $ollama_version"
fi

# Verificar que Ollama funciona
log "Verificando instalación de Ollama..."
if ollama --help &> /dev/null; then
    log "Ollama instalado correctamente ✓"
else
    error "Error en la instalación de Ollama"
fi

echo

# Paso 3: Iniciar servicio Ollama y descargar modelo
info "Paso 3/6: Configurando Ollama y descargando modelo..."

# Iniciar Ollama en background
log "Iniciando servicio Ollama..."
ollama serve &
OLLAMA_PID=$!

# Esperar a que Ollama esté listo
log "Esperando a que Ollama esté listo..."
sleep 5

# Verificar que Ollama está corriendo
max_attempts=30
attempt=0
while ! curl -s http://localhost:11434 &> /dev/null; do
    sleep 1
    attempt=$((attempt + 1))
    if [[ $attempt -ge $max_attempts ]]; then
        error "Ollama no respondió después de $max_attempts segundos"
    fi
done

log "Ollama está corriendo ✓"

# Verificar si el modelo ya está descargado
if ollama list | grep -q "$OLLAMA_MODEL"; then
    log "Modelo $OLLAMA_MODEL ya está descargado ✓"
else
    log "Descargando modelo $OLLAMA_MODEL (esto puede tomar varios minutos)..."
    info "Tamaño del modelo: ~2GB - Tiempo estimado: 5-15 minutos según conexión"
    
    if ollama pull "$OLLAMA_MODEL"; then
        log "Modelo $OLLAMA_MODEL descargado correctamente ✓"
    else
        error "Error descargando el modelo $OLLAMA_MODEL"
    fi
fi

# Test básico del modelo
log "Probando modelo..."
test_response=$(ollama run "$OLLAMA_MODEL" "Responde solo 'OK' si funcionas correctamente" --timeout 30s 2>/dev/null || echo "FAILED")
if [[ "$test_response" == *"OK"* ]]; then
    log "Modelo funcionando correctamente ✓"
else
    warning "El modelo no respondió como esperado, pero continuamos..."
fi

echo

# Paso 4: Instalar Node.js
info "Paso 4/6: Verificando Node.js..."

if ! command -v node &> /dev/null; then
    log "Instalando Node.js via Homebrew..."
    brew install node@$NODE_VERSION
    brew link node@$NODE_VERSION
else
    node_version=$(node --version | sed 's/v//')
    log "Node.js ya está instalado - Versión: $node_version ✓"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está disponible después de instalar Node.js"
fi

echo

# Paso 5: Clonar e instalar AiDuxCare
info "Paso 5/6: Instalando AiDuxCare..."

# Crear directorio si no existe
if [[ -d "$AIDUXCARE_DIR" ]]; then
    warning "Directorio $AIDUXCARE_DIR ya existe"
    read -p "¿Deseas reinstalar? (esto borrará la instalación actual) (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Eliminando instalación anterior..."
        rm -rf "$AIDUXCARE_DIR"
    else
        log "Usando instalación existente..."
    fi
fi

if [[ ! -d "$AIDUXCARE_DIR" ]]; then
    log "Clonando repositorio AiDuxCare..."
    git clone https://github.com/mauriciosobarzo/AIDUXCARE-V.2.git "$AIDUXCARE_DIR" || error "Error clonando repositorio"
fi

# Cambiar al directorio de AiDuxCare
cd "$AIDUXCARE_DIR"

log "Instalando dependencias de Node.js..."
npm install || error "Error instalando dependencias"

# Crear archivo de configuración
log "Creando configuración local..."
cat > .env.local << EOF
# AiDuxCare - Configuración Local
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=$OLLAMA_MODEL

# Configuración de desarrollo
VITE_DEV_MODE=true
VITE_LOG_LEVEL=info

# Configuración Supabase (mantener valores existentes si los hay)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

log "Configuración creada ✓"

echo

# Paso 6: Testing final
info "Paso 6/6: Ejecutando tests finales..."

# Test de build
log "Verificando que la aplicación construye correctamente..."
if npm run build &> /dev/null; then
    log "Build exitoso ✓"
else
    warning "Build falló, pero la aplicación puede funcionar en modo desarrollo"
fi

# Test de Ollama connection
log "Probando conexión con Ollama..."
if npm run test:ollama &> /dev/null; then
    log "Conexión con Ollama funcional ✓"
else
    warning "Test de Ollama falló, pero puede funcionar manualmente"
fi

echo

# Creación de scripts de conveniencia
log "Creando scripts de conveniencia..."

# Script para iniciar AiDuxCare
cat > start-aiduxcare.sh << 'EOF'
#!/bin/bash
cd "$HOME/AiDuxCare"

echo "🚀 Iniciando AiDuxCare..."

# Verificar Ollama
if ! curl -s http://localhost:11434 &> /dev/null; then
    echo "⚡ Iniciando Ollama..."
    ollama serve &
    sleep 3
fi

# Iniciar aplicación
echo "🎯 Iniciando aplicación web..."
npm run dev
EOF

chmod +x start-aiduxcare.sh

# Script para parar servicios
cat > stop-aiduxcare.sh << 'EOF'
#!/bin/bash
echo "🛑 Deteniendo AiDuxCare..."

# Matar procesos de Ollama
pkill -f "ollama serve" || true

# Matar procesos de Vite/Node
pkill -f "vite" || true
pkill -f "npm run dev" || true

echo "✅ AiDuxCare detenido"
EOF

chmod +x stop-aiduxcare.sh

log "Scripts de conveniencia creados ✓"

echo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║                 🎉 INSTALACIÓN COMPLETADA 🎉                ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${NC}"
echo

# Resumen de instalación
echo -e "${BLUE}📋 RESUMEN DE INSTALACIÓN:${NC}"
echo "✅ Sistema verificado ($macos_version, $arch, $ram_gb RAM)"
echo "✅ Homebrew instalado/actualizado"
echo "✅ Ollama instalado (servicio corriendo)"
echo "✅ Modelo $OLLAMA_MODEL descargado (~2GB)"
echo "✅ Node.js y npm configurados"
echo "✅ AiDuxCare clonado e instalado en $AIDUXCARE_DIR"
echo "✅ Configuración local creada"
echo "✅ Scripts de conveniencia creados"
echo

echo -e "${YELLOW}🚀 PARA INICIAR AIDUXCARE:${NC}"
echo "   cd $AIDUXCARE_DIR"
echo "   ./start-aiduxcare.sh"
echo
echo "   O manualmente:"
echo "   npm run dev"
echo

echo -e "${YELLOW}🌐 ACCESO:${NC}"
echo "   Una vez iniciado, abre: http://localhost:5173"
echo

echo -e "${YELLOW}📱 SOPORTE:${NC}"
echo "   - WhatsApp/Telegram: [NÚMERO_SOPORTE]"
echo "   - Email: mauricio@aiduxcare.com"
echo "   - Documentación: $AIDUXCARE_DIR/docs/"
echo

echo -e "${YELLOW}🛠 COMANDOS ÚTILES:${NC}"
echo "   - Iniciar: ./start-aiduxcare.sh"
echo "   - Parar: ./stop-aiduxcare.sh"
echo "   - Test Ollama: npm run test:ollama"
echo "   - Logs: tail -f ~/.ollama/logs/server.log"
echo

echo -e "${GREEN}¡AiDuxCare está listo para user testing! 🎯${NC}"
echo

# Preguntar si quiere iniciar ahora
read -p "¿Deseas iniciar AiDuxCare ahora? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    log "Iniciando AiDuxCare..."
    ./start-aiduxcare.sh
fi 