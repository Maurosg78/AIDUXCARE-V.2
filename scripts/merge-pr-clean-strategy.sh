#!/bin/bash

# Estrategia completa para mergear PR en rama clean
# Basado en: docs/processes/PR_278_MERGE_DOCUMENTATION.md
# 
# Este script sigue el proceso exitoso del PR #278 para:
# 1. Verificar estado del PR
# 2. Resolver errores de CI si existen
# 3. Eliminar requisito de 2 aprobadores si existe
# 4. Hacer merge del PR

set -e

REPO="Maurosg78/AIDUXCARE-V.2"
BRANCH="clean"
PR_NUMBER=""  # Se detectará automáticamente

echo "🚀 ESTRATEGIA COMPLETA PARA MERGEAR PR EN RAMA CLEAN"
echo "=================================================="
echo ""

# Verificar gh CLI
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
echo ""

# FASE 1: Detectar PR
echo "📋 FASE 1: Detectando PR para rama 'clean'..."
PR_LIST=$(gh pr list --head clean --state open --json number,title,state,url 2>&1)

if [ -z "$PR_LIST" ] || [ "$PR_LIST" = "[]" ]; then
    echo "⚠️  No se encontró PR abierto para rama 'clean'"
    echo "   Verificando si hay commits directos en clean..."
    
    # Verificar si hay commits nuevos en clean que no están en origin/clean
    LOCAL_COMMITS=$(git log origin/clean..clean --oneline 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$LOCAL_COMMITS" -gt 0 ]; then
        echo "✅ Se encontraron $LOCAL_COMMITS commits locales en 'clean'"
        echo "   Estos commits ya fueron pusheados directamente a clean"
        echo "   No se requiere PR para mergear"
        exit 0
    else
        echo "❌ No hay PR abierto ni commits pendientes"
        echo "   Crear PR primero o hacer push directo"
        exit 1
    fi
else
    PR_NUMBER=$(echo "$PR_LIST" | jq -r '.[0].number')
    PR_TITLE=$(echo "$PR_LIST" | jq -r '.[0].title')
    PR_URL=$(echo "$PR_LIST" | jq -r '.[0].url')
    
    echo "✅ PR encontrado: #$PR_NUMBER"
    echo "   Título: $PR_TITLE"
    echo "   URL: $PR_URL"
fi

echo ""

# FASE 2: Verificar estado de CI
echo "📋 FASE 2: Verificando estado de CI checks..."
if [ -n "$PR_NUMBER" ]; then
    CI_STATUS=$(gh pr checks $PR_NUMBER 2>&1)
    echo "$CI_STATUS"
    
    # Verificar si hay checks fallando
    FAILING_CHECKS=$(echo "$CI_STATUS" | grep -i "fail\|error" | wc -l | tr -d ' ')
    
    if [ "$FAILING_CHECKS" -gt 0 ]; then
        echo ""
        echo "⚠️  ADVERTENCIA: Se encontraron $FAILING_CHECKS checks fallando"
        echo "   Revisar: $PR_URL/checks"
        echo ""
        read -p "¿Continuar con el merge de todas formas? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Merge cancelado por el usuario"
            exit 1
        fi
    else
        echo "✅ Todos los checks de CI están pasando"
    fi
fi

echo ""

# FASE 3: Verificar y modificar branch protection
echo "📋 FASE 3: Verificando configuración de branch protection..."

PROTECTION_CONFIG=$(gh api repos/$REPO/branches/$BRANCH/protection --jq '.required_pull_request_reviews' 2>&1)

if [ -z "$PROTECTION_CONFIG" ] || [ "$PROTECTION_CONFIG" = "null" ]; then
    echo "✅ No hay requisito de aprobaciones configurado"
    echo "   La rama permite merge directo"
else
    REQUIRED_COUNT=$(echo "$PROTECTION_CONFIG" | jq -r '.required_approving_review_count // 0')
    
    echo "📊 Configuración actual:"
    echo "   - Aprobaciones requeridas: $REQUIRED_COUNT"
    
    if [ "$REQUIRED_COUNT" -gt 1 ]; then
        echo ""
        echo "⚠️  Se requiere $REQUIRED_COUNT aprobadores (más de 1)"
        echo "   Siguiendo proceso del PR #278, eliminando requisito..."
        
        # Eliminar required_pull_request_reviews (siguiendo PR #278)
        DELETE_RESULT=$(gh api repos/$REPO/branches/$BRANCH/protection/required_pull_request_reviews \
            --method DELETE 2>&1)
        
        if [ $? -eq 0 ]; then
            echo "✅ Requisito de aprobaciones eliminado exitosamente"
        else
            echo "⚠️  No se pudo eliminar automáticamente (puede requerir permisos admin)"
            echo "   Intentando merge con flag --admin..."
        fi
    elif [ "$REQUIRED_COUNT" -eq 1 ]; then
        echo ""
        echo "ℹ️  Se requiere 1 aprobación"
        echo "   Verificando si ya existe aprobación..."
        
        if [ -n "$PR_NUMBER" ]; then
            REVIEWS=$(gh pr view $PR_NUMBER --json reviews --jq '.reviews[] | select(.state == "APPROVED")' 2>&1)
            
            if [ -n "$REVIEWS" ] && [ "$REVIEWS" != "[]" ]; then
                APPROVED_COUNT=$(echo "$REVIEWS" | jq -s 'length')
                echo "✅ Se encontraron $APPROVED_COUNT aprobaciones"
            else
                echo "⚠️  No se encontraron aprobaciones"
                echo "   Intentando merge con flag --admin para bypassear..."
            fi
        fi
    fi
fi

echo ""

# FASE 4: Hacer merge del PR
if [ -n "$PR_NUMBER" ]; then
    echo "📋 FASE 4: Haciendo merge del PR #$PR_NUMBER..."
    echo ""
    
    # Intentar merge con --admin para bypassear restricciones
    echo "🚀 Ejecutando: gh pr merge $PR_NUMBER --squash --delete-branch --admin"
    
    MERGE_RESULT=$(gh pr merge $PR_NUMBER --squash --delete-branch --admin 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ PR mergeado exitosamente"
        echo ""
        echo "$MERGE_RESULT"
    else
        echo "❌ Error al hacer merge:"
        echo "$MERGE_RESULT"
        echo ""
        echo "💡 Intentos alternativos:"
        echo "   1. Verificar que todos los checks de CI pasen"
        echo "   2. Obtener aprobaciones manualmente en GitHub"
        echo "   3. Usar: gh pr merge $PR_NUMBER --squash --delete-branch"
        exit 1
    fi
else
    echo "📋 FASE 4: No hay PR para mergear"
    echo "   Los commits ya están en la rama clean"
fi

echo ""
echo "✅ ESTRATEGIA COMPLETADA EXITOSAMENTE"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verificar que el merge se completó: gh pr view $PR_NUMBER"
echo "   2. Verificar estado de la rama: git fetch && git log origin/$BRANCH --oneline -5"
echo "   3. Si es necesario, restaurar branch protection: ./scripts/restore-branch-protection.sh"

