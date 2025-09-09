#!/bin/bash
# Comandos rápidos para el día de la demo

echo "🚀 Preparando demo de AiduxCare..."

# Configurar entorno de producción
export VITE_ENV=production
export VITE_PROMPT_VERSION=1.1.0
export VITE_LOG_LEVEL=error

# Verificar que todo funcione
echo "✅ Verificando tests..."
npm run test:ci

echo "✅ Construyendo para producción..."
npm run build

echo "✅ Iniciando servidor de preview..."
npm run preview

echo """
🎯 Demo Ready!
- URL: http://localhost:4173
- Backup: https://aiduxcare-v2-uat-dev.web.app
- Runbook: docs/runbooks/niagara-demo.md
"""
