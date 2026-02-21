#!/bin/bash
#
# Deploy Pilot VPS — igualar pilot.aiduxcare.com al código en origin/main
#
# IMPORTANTE: Antes de ejecutar en el VPS, desde tu máquina LOCAL:
#   git push origin main
#
# Ejecutar ESTE script EN EL VPS (o vía: gcloud compute ssh pilot-vps --zone=us-central1-a --project=aiduxcare-v2-uat-dev -- 'bash -s' < scripts/deploy-pilot-vps.sh)
#
# Uso en el VPS:
#   cd /var/www/pilot && bash scripts/deploy-pilot-vps.sh
#
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err() { echo -e "${RED}❌ $1${NC}"; }

APP_DIR="${DEPLOY_DIR:-/var/www/pilot}"
cd "$APP_DIR" || { err "No existe $APP_DIR"; exit 1; }

echo "🚀 Deploy Pilot VPS — sync con origin/main + build + restart"
echo "   Directorio: $APP_DIR"
echo ""

# 1) Salir de git bisect si estaba en curso (evita que main quede en commit viejo)
if git bisect log >/dev/null 2>&1; then
  warn "Git bisect en curso; reseteando..."
  git bisect reset
  success "Bisect reset"
fi

# 2) Forzar rama main y sincronizar exactamente con origin/main
git fetch origin
git checkout main
git reset --hard origin/main

COMMIT=$(git log -1 --oneline)
success "Código sincronizado: $COMMIT"
echo ""

# 3) Build limpio (evita cache de Vite/build viejo)
warn "Limpiando dist y cache de Vite..."
rm -rf dist
rm -rf node_modules/.vite 2>/dev/null || true
success "Limpieza hecha"
echo ""

# 4) Build
echo "📦 Build..."
if ! npm run build; then
  err "Build falló"
  exit 1
fi
success "Build OK"
echo ""

# 5) Verificación rápida: SOAP (no SCAP) en el bundle
if grep -rq "SOAP Note" dist/ 2>/dev/null; then
  success "Verificación: 'SOAP Note' presente en dist/"
else
  warn "No se encontró 'SOAP Note' en dist/ (revisar si el texto está en otro formato)"
fi
if grep -rq "SCAP Note" dist/ 2>/dev/null; then
  err "Encontrado 'SCAP Note' en dist/ — build podría ser incorrecto"
  exit 1
fi
echo ""

# 6) Reiniciar PM2
if command -v pm2 &>/dev/null; then
  pm2 restart pilot-web
  success "PM2 restart pilot-web"
else
  warn "pm2 no encontrado; reinicia manualmente: pm2 restart pilot-web"
fi
echo ""
success "Deploy pilot VPS completado. Revisa https://pilot.aiduxcare.com"
