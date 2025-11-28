#!/bin/bash

# Script de validación de imports canónicos
# Verifica que no se importen archivos de cuarentena, deprecados, o backups

set -e

echo "🔍 Validando imports canónicos..."
echo ""

ERRORS=0
WARNINGS=0

# Función para reportar error
error() {
  echo "❌ ERROR: $1"
  ERRORS=$((ERRORS + 1))
}

# Función para reportar warning
warning() {
  echo "⚠️  WARNING: $1"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Verificar imports de cuarentena
echo "📋 Verificando imports de _quarantine/..."
QUARANTINE_IMPORTS=$(grep -r "from.*_quarantine" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$QUARANTINE_IMPORTS" ]; then
  echo "$QUARANTINE_IMPORTS" | while read -r line; do
    # Permitir solo este README
    if ! echo "$line" | grep -q "README.md"; then
      error "Import de _quarantine encontrado: $line"
    fi
  done
else
  echo "✅ No hay imports de _quarantine/"
fi

# 2. Verificar imports de _deprecated
echo ""
echo "📋 Verificando imports de _deprecated/..."
DEPRECATED_IMPORTS=$(grep -r "from.*_deprecated" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$DEPRECATED_IMPORTS" ]; then
  error "Imports de _deprecated encontrados:"
  echo "$DEPRECATED_IMPORTS"
else
  echo "✅ No hay imports de _deprecated/"
fi

# 3. Verificar imports de backups
echo ""
echo "📋 Verificando imports de backups/..."
BACKUP_IMPORTS=$(grep -r "from.*backups" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$BACKUP_IMPORTS" ]; then
  error "Imports de backups/ encontrados:"
  echo "$BACKUP_IMPORTS"
else
  echo "✅ No hay imports de backups/"
fi

# 4. Verificar router canónico
echo ""
echo "📋 Verificando router canónico..."
ROUTER_IMPORTS=$(grep -r "from.*router/router" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$ROUTER_IMPORTS" ]; then
  warning "No se encontró import de router/router (¿App.tsx está usando router canónico?)"
else
  echo "✅ Router canónico en uso:"
  echo "$ROUTER_IMPORTS" | head -5
fi

# Verificar router duplicado en raíz
if [ -f "src/router.tsx" ]; then
  error "src/router.tsx existe en raíz (debe moverse a _quarantine/)"
fi

# 5. Verificar LoginPage canónico
echo ""
echo "📋 Verificando LoginPage canónico..."
LOGIN_IMPORTS=$(grep -r "from.*pages/LoginPage" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$LOGIN_IMPORTS" ]; then
  warning "No se encontró import de pages/LoginPage"
else
  echo "✅ LoginPage canónico en uso:"
  echo "$LOGIN_IMPORTS" | head -5
fi

# Verificar LoginPage deprecado
DEPRECATED_LOGIN=$(grep -r "from.*features/auth/LoginPage\|from.*auth/LoginPage" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$DEPRECATED_LOGIN" ]; then
  warning "Posibles imports de LoginPage deprecado encontrados:"
  echo "$DEPRECATED_LOGIN" | head -5
fi

# 6. Verificar uso de alias @
echo ""
echo "📋 Verificando uso de alias @..."
RELATIVE_IMPORTS=$(grep -r "from ['\"]\.\." src/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v "node_modules" | head -10 || true)
if [ -n "$RELATIVE_IMPORTS" ]; then
  echo "⚠️  Algunos imports relativos encontrados (recomendado usar alias @):"
  echo "$RELATIVE_IMPORTS" | head -5
  WARNINGS=$((WARNINGS + 1))
fi

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Errores: $ERRORS"
echo "⚠️  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo "❌ VALIDACIÓN FALLIDA - Corrige los errores antes de hacer commit"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "⚠️  VALIDACIÓN EXITOSA CON WARNINGS"
  exit 0
else
  echo "✅ VALIDACIÓN EXITOSA - Todos los imports son canónicos"
  exit 0
fi

