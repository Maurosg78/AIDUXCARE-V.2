#!/bin/bash

set -euo pipefail

# ────────────────────────────────────────────────────────────────
#  AiDuxCare · Verificación de entorno (Vertex + Whisper)
# ────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓] $1${NC}"; }
warn()  { echo -e "${YELLOW}[⚠] $1${NC}"; }
error() { echo -e "${RED}[✗] $1${NC}"; }
info()  { echo -e "${BLUE}[ℹ] $1${NC}"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              AiDuxCare · Verificación de Entorno             ║"
echo "║            Vertex AI + OpenAI Whisper (pipeline 2025)        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo

# 1. Node y npm
info "1/5 · Verificando Node.js y npm..."
if ! command -v node >/dev/null; then
  error "Node.js no está instalado. Requiere >= 20.19.0"
  exit 1
fi
if ! command -v npm >/dev/null; then
  error "npm no está disponible en el PATH"
  exit 1
fi
log "Node.js $(node --version) · npm $(npm --version)"

# 2. Dependencias del proyecto
info "2/5 · Verificando dependencias npm..."
if [[ ! -f package.json ]]; then
  error "package.json no existe en ${PROJECT_ROOT}"
  exit 1
fi
if [[ ! -d node_modules ]]; then
  warn "node_modules no encontrado → instalando dependencias"
  npm install
fi
log "Dependencias instaladas"

# 3. Variables de entorno
info "3/5 · Verificando .env.local..."
if [[ ! -f .env.local ]]; then
  warn ".env.local no existe → generando plantilla mínima"
  cat > .env.local <<'EOF'
# ── Vertex AI (Cloud Function proxy) ────────────────────────────
VITE_VERTEX_AI_URL=
VITE_VERTEX_AI_FUNCTION=vertexAIProxy
VITE_VERTEX_AI_REGION=us-central1
VITE_VERTEX_AI_API_KEY=

# ── OpenAI Whisper (audio → texto) ──────────────────────────────
VITE_OPENAI_API_KEY=
VITE_WHISPER_MODEL=whisper-1

# ── Firebase (Auth + Firestore) ─────────────────────────────────
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# ── Supabase (metadatos/telemetría) ────────────────────────────
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# ── App ─────────────────────────────────────────────────────────
VITE_APP_ENVIRONMENT=development
EOF
  log "Plantilla .env.local creada. Completa tus credenciales antes de continuar."
fi

# Cargar variables para validación (sin exportarlas globalmente)
set -a
source .env.local
set +a

REQUIRED_VARS=(
  VITE_VERTEX_AI_URL
  VITE_VERTEX_AI_API_KEY
  VITE_OPENAI_API_KEY
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
)

MISSING=()
for VAR in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!VAR:-}" ]]; then
    MISSING+=("$VAR")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  error "Variables de entorno faltantes: ${MISSING[*]}"
  echo "Edita .env.local y ejecuta nuevamente el script."
  exit 1
fi
log ".env.local completo"

# 4. Salud de Vertex AI
info "4/5 · Probando conectividad con Vertex AI..."
if command -v curl >/dev/null; then
  HEALTH_URL="${VITE_VERTEX_AI_URL%/}/clinicalBrain/health"
  HTTP_STATUS=$(curl -s -o /tmp/vertex-health.json -w "%{http_code}" \
    -H "Authorization: Bearer ${VITE_VERTEX_AI_API_KEY}" \
    "${HEALTH_URL}" || true)
  if [[ "$HTTP_STATUS" == "200" ]]; then
    log "Vertex AI responde (health check OK)"
  else
    warn "Vertex AI no respondió 200 (HTTP ${HTTP_STATUS}). Revisa URL/API key."
  fi
else
  warn "curl no disponible → omitiendo health check de Vertex AI"
fi

# 5. Build en frío
info "5/5 · Ejecutando build de verificación (vite build)..."
if npm run build >/tmp/aidux-build.log 2>&1; then
  log "Build completado correctamente"
else
  warn "Build falló. Revisa /tmp/aidux-build.log para detalles. El modo dev puede seguir funcionando."
fi

echo
echo -e "${BLUE}Resumen rápido:${NC}"
echo "  • Vertex AI URL: ${VITE_VERTEX_AI_URL}"
echo "  • Firebase Project: ${VITE_FIREBASE_PROJECT_ID}"
echo "  • Supabase URL: ${VITE_SUPABASE_URL}"
echo
echo -e "${GREEN}Todo listo. Ejecuta \`npm run dev\` para arrancar AiDuxCare.${NC}"