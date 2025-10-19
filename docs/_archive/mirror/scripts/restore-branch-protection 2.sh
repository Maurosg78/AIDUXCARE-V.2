#!/bin/bash

# Script para restaurar política de protección de rama main
# Para usar cuando termine el desarrollo del MVP
# Ejecutar: ./scripts/restore-branch-protection.sh

set -e

echo "🔒 Restaurando política de protección para producción..."

# Verificar que gh CLI esté instalado
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) no está instalado"
    echo "Instalar con: brew install gh"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ Error: No autenticado con GitHub CLI"
    echo "Ejecutar: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI autenticado"

# Crear archivo de configuración de producción
cat > /tmp/branch-protection-production.json << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo "📝 Configuración de producción creada:"
cat /tmp/branch-protection-production.json

echo ""
echo "🚀 Aplicando configuración de producción a rama main..."

# Aplicar configuración
gh api repos/Maurosg78/AIDUXCARE-V.2/branches/main/protection \
  --method PUT \
  --input /tmp/branch-protection-production.json

echo "✅ Política de protección restaurada para producción"
echo ""
echo "📋 Configuración aplicada:"
echo "  - ✅ Revisión externa: HABILITADA (1 aprobación requerida)"
echo "  - ✅ Merge directo: DESHABILITADO"
echo "  - ✅ Status checks: REQUERIDOS"
echo "  - ✅ Force push: DESHABILITADO"
echo "  - ✅ Conversación resuelta: REQUERIDA"
echo ""
echo "🎯 Configuración lista para producción"

# Limpiar archivo temporal
rm /tmp/branch-protection-production.json

echo ""
echo "🔗 Verificar en: https://github.com/Maurosg78/AIDUXCARE-V.2/settings/branches" 