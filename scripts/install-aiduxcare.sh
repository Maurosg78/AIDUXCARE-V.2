#!/usr/bin/env bash
set -euo pipefail

# AiDuxCare installer (Vertex AI only)
# Removes legacy Ollama/local requirements.

APP_DIR="$HOME/AiDuxCare"
REPO_URL="https://github.com/mauriciosobarzo/AIDUXCARE-V.2.git"
NODE_VERSION="20"

log() { printf "[%%s] %s\n" "$(date '+%H:%M:%S')" "$1"; }
info() { printf "\n🚀 %s\n\n" "$1"; }
error() { printf "\n❌ %s\n" "$1"; exit 1; }
warning() { printf "⚠️ %s\n" "$1"; }

info "AiDuxCare Installer (Vertex AI Canada)"

log "Detectando arquitectura..."
ARCH=$(uname -m)
log "Arquitectura: $ARCH"

info "Paso 1/4 · Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  log "Instalando Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ "$ARCH" == "arm64" ]]; then
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$($(brew --prefix)/bin/brew shellenv)"
  fi
else
  log "Homebrew ya instalado"
fi
brew update || warning "No se pudo actualizar Homebrew"

info "Paso 2/4 · Node.js"
if ! command -v node >/dev/null 2>&1; then
  log "Instalando Node.js $NODE_VERSION..."
  brew install node@${NODE_VERSION}
  brew link node@${NODE_VERSION}
else
  log "Node.js presente: $(node -v)"
fi
command -v npm >/dev/null 2>&1 || error "npm no disponible después de instalar Node"

info "Paso 3/4 · Obtener AiDuxCare"
if [[ -d "$APP_DIR" ]]; then
  warning "Directorio $APP_DIR existe"
  read -p "¿Reinstalar? (y/N): " -n 1 -r
echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$APP_DIR"
  fi
fi
if [[ ! -d "$APP_DIR" ]]; then
  git clone "$REPO_URL" "$APP_DIR" || error "No se pudo clonar el repositorio"
fi
cd "$APP_DIR"
log "Instalando dependencias..."
npm install || error "npm install falló"

info "Paso 4/4 · Configuración"
ENV_FILE=".env.local"
cat > "$ENV_FILE" <<'ENV'
# AiDuxCare local config (Vertex AI)
VITE_APP_ENVIRONMENT=development
VITE_AIDUX_ASSISTANT_PROVIDER=vertex-ai
VITE_AIDUX_ASSISTANT_BASE_URL=https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy
VITE_AIDUX_ASSISTANT_MODEL=gemini-2.5-flash
VITE_AIDUX_ASSISTANT_TIMEOUT=30000

# Supabase placeholders
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
ENV
log "Archivo $ENV_FILE actualizado (Vertex AI only)"

cat <<'SUMMARY'
=====================================================
✅ Instalación completada
- Vertex AI es el único motor permitido (datos en Canadá)
- No se requiere Ollama/local LLM
- Para iniciar: npm run dev
=====================================================
SUMMARY
