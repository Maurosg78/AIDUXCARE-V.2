#!/bin/bash
# Deploy a pilot VPS - AiDuxCare
# Uso: ejecutar desde tu máquina local (conecta por SSH y despliega)

set -e

VPS_USER="mauriciosobarzo"
VPS_IP="35.239.23.162"
PROJECT_PATH="/var/www/pilot"
BRANCH="release/pilot-cmdctr-searchbar-20260209"
PM2_APP="pilot-web"

echo "=== Deploy AiDuxCare Pilot VPS ==="
echo "VPS: $VPS_USER@$VPS_IP"
echo "Path: $PROJECT_PATH"
echo "Branch: $BRANCH"
echo ""

# 1. Conectar y ejecutar comandos remotos
ssh $VPS_USER@$VPS_IP << EOF
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
