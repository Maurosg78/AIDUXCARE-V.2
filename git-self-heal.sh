#!/bin/bash

echo "🔧 AUTO-REPARACIÓN GIT - AiDuxCare V.2"
echo "=========================================="

# 1. DETECCIÓN
echo "🔍 Verificando estado del repositorio..."

# Verificar si estamos en un repositorio Git
if [ ! -d ".git" ]; then
    echo "❌ Error: No estás en un repositorio Git"
    exit 1
fi

# Verificar locks
LOCKS_FOUND=false
if [ -f ".git/index.lock" ] || [ -f ".git/index*.lock" ] || [ -f ".git/gc*.pid" ]; then
    echo "⚠️  Locks detectados - procediendo a eliminación..."
    LOCKS_FOUND=true
fi

# Verificar si .git/index está ausente o corrupto
INDEX_CORRUPT=false
if [ ! -f ".git/index" ] || [ ! -s ".git/index" ]; then
    echo "⚠️  .git/index ausente o corrupto - procediendo a restauración..."
    INDEX_CORRUPT=true
fi

# Verificar si git status se cuelga
echo "⏱️  Verificando respuesta de git status..."
if timeout 5s git status --porcelain > /dev/null 2>&1; then
    echo "✅ git status responde correctamente"
else
    echo "⚠️  git status se cuelga - procediendo a reparación..."
    INDEX_CORRUPT=true
fi

# 2. REPARACIÓN AUTOMÁTICA
if [ "$LOCKS_FOUND" = true ] || [ "$INDEX_CORRUPT" = true ]; then
    echo "🛠️  Iniciando reparación automática..."
    
    # Eliminar locks
    if [ "$LOCKS_FOUND" = true ]; then
        echo "🗑️  Eliminando locks..."
        rm -f .git/index.lock .git/index*.lock .git/gc*.pid
        echo "✅ Locks eliminados"
    fi
    
    # Restaurar .git/index
    if [ "$INDEX_CORRUPT" = true ]; then
        echo "🔄 Restaurando .git/index..."
        if git read-tree HEAD; then
            echo "✅ .git/index restaurado exitosamente"
        else
            echo "❌ Error al restaurar .git/index"
            exit 1
        fi
    fi
else
    echo "✅ No se detectaron problemas - repositorio saludable"
fi

# 3. VERIFICACIÓN
echo "🔍 Verificando reparación..."

# Verificar que git status responde en menos de 2 segundos
if timeout 2s git status --porcelain > /dev/null 2>&1; then
    # Contar archivos pendientes
    FILE_COUNT=$(git status --porcelain | wc -l)
    echo "✅ Git reparado y funcional. Archivos pendientes: $FILE_COUNT"
    
    # Verificación final con time
    echo "⏱️  Verificación final de rendimiento..."
    if timeout 2s bash -c "time git status --porcelain | wc -l" > /dev/null 2>&1; then
        echo "✅ Confirmo que Git quedó 100% reparado y funcional"
        exit 0
    else
        echo "❌ Verificación final falló"
        exit 1
    fi
else
    echo "❌ No se pudo reparar automáticamente. Revisión manual necesaria."
    exit 1
fi
