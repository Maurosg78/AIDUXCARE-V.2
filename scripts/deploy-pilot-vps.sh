#!/bin/bash
# Deploy a pilot VPS - AiDuxCare
# Uso: ejecutar desde tu máquina local (conecta por gcloud compute ssh)
# Requiere: gcloud auth login + gcloud config set project aiduxcare-v2-uat-dev

set -e

INSTANCE_NAME="pilot-vps"
ZONE="us-central1-a"
PROJECT="aiduxcare-v2-uat-dev"
PROJECT_PATH="/var/www/pilot"
BRANCH="fix/followup-language-en-ca"
PM2_APP="pilot-web"

echo "=== Deploy AiDuxCare Pilot VPS ==="
echo "Instance: $INSTANCE_NAME (zone: $ZONE, project: $PROJECT)"
echo "Path: $PROJECT_PATH"
echo "Branch: $BRANCH"
echo ""

# 0. Verificar que gcloud está configurado
if ! command -v gcloud &>/dev/null; then
  echo "ERROR: gcloud CLI no encontrado. Instala: https://cloud.google.com/sdk/docs/install"
  exit 1
fi
echo ">>> Usando gcloud compute ssh (evita Permission denied con SSH directo)"
echo ""

# 1. Conectar y ejecutar comandos remotos vía gcloud compute ssh
gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --project="$PROJECT" -- -T << EOF
  set -e
  echo ">>> Conectado al VPS"
  
  # 2. Navegar al directorio del proyecto
  cd $PROJECT_PATH
  echo ">>> Directorio: \$(pwd)"
  
  # 3. Pull de los cambios
  git fetch origin
  git checkout $BRANCH
  git pull origin $BRANCH
  echo ">>> Branch $BRANCH actualizado"
  
  # 4. Instalar dependencias (si hay nuevas)
  npm install
  echo ">>> Dependencias instaladas"
  
  # 5. Build (con límite de memoria para VMs pequeñas)
  NODE_OPTIONS="--max-old-space-size=1536" npm run build
  echo ">>> Build completado"
  
  # 6. Restart PM2
  pm2 restart $PM2_APP
  pm2 save
  echo ">>> PM2 reiniciado: $PM2_APP"
  
  # Verificar
  pm2 list
  echo ""
  echo ">>> Deploy completado. Verificar: curl -s -o /dev/null -w '%{http_code}' http://localhost:5174"
EOF

echo ""
echo "=== Deploy finalizado ==="
echo "App: https://pilot.aiduxcare.com"
