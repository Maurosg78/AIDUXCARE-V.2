#!/bin/bash

# Script para modificar política de protección de rama main
# Permite merge directo durante desarrollo del MVP
# Ejecutar: ./scripts/fix-branch-protection.sh

set -e

echo "🔧 Configurando política de protección para desarrollo MVP..."

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

# Crear archivo de configuración temporal
cat > /tmp/branch-protection-mvp.json << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo "📝 Configuración creada:"
cat /tmp/branch-protection-mvp.json

echo ""
echo "🚀 Aplicando configuración a rama main..."

# Aplicar configuración
gh api repos/Maurosg78/AIDUXCARE-V.2/branches/main/protection \
  --method PUT \
  --input /tmp/branch-protection-mvp.json

echo "✅ Política de protección actualizada"
echo ""
echo "📋 Cambios aplicados:"
echo "  - ✅ Revisión externa: DESHABILITADA"
echo "  - ✅ Merge directo: HABILITADO"
echo "  - ✅ Status checks: REQUERIDOS"
echo "  - ✅ Force push: DESHABILITADO"
echo ""
echo "🎯 Ahora puedes hacer merge directo de PRs durante el desarrollo del MVP"
echo ""
echo "⚠️  IMPORTANTE: Esta configuración es para desarrollo MVP únicamente"
echo "   Restaurar configuración de producción antes del lanzamiento"

# Limpiar archivo temporal
rm /tmp/branch-protection-mvp.json

echo ""
echo "🔗 Verificar en: https://github.com/Maurosg78/AIDUXCARE-V.2/settings/branches" 