#!/bin/bash

echo "🚨 RECUPERACIÓN AUTOMÁTICA DEL REPOSITORIO AIDUXCARE-V.2 🚨"
echo "================================================================"

# 1. Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo "❌ Error: No estás en un repositorio Git"
    exit 1
fi

# 2. Obtener información del repositorio
REMOTE_URL=$(git config --get remote.origin.url)
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
WORKING_DIR=$(pwd)

echo "📍 Repositorio: $REMOTE_URL"
echo "📍 Rama actual: $CURRENT_BRANCH"
echo "📍 Directorio: $WORKING_DIR"

# 3. Crear backup de cambios no committeados
echo "💾 Creando backup de cambios no committeados..."
BACKUP_DIR="../AIDUXCARE-V.2-BACKUP-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copiar archivos modificados (excluyendo .git)
rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' . "$BACKUP_DIR/" 2>/dev/null || cp -r . "$BACKUP_DIR/"

echo "✅ Backup creado en: $BACKUP_DIR"

# 4. Eliminar directorio .git corrupto
echo "🗑️ Eliminando directorio .git corrupto..."
rm -rf .git

# 5. Reclonar el repositorio
echo "🔄 Reclonando repositorio limpio..."
cd ..
rm -rf "AIDUXCARE-V.2-TEMP"
git clone "$REMOTE_URL" "AIDUXCARE-V.2-TEMP"

if [ $? -ne 0 ]; then
    echo "❌ Error al clonar el repositorio"
    exit 1
fi

# 6. Cambiar a la rama correcta
cd "AIDUXCARE-V.2-TEMP"
git checkout "$CURRENT_BRANCH" 2>/dev/null || git checkout main

# 7. Restaurar cambios del backup
echo "🔄 Restaurando cambios del backup..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' "$BACKUP_DIR/" . 2>/dev/null || cp -r "$BACKUP_DIR"/* .

# 8. Verificar estado
echo "🔍 Verificando estado del repositorio..."
git status

echo ""
echo "✅ RECUPERACIÓN COMPLETADA"
echo "📍 Repositorio limpio en: $(pwd)"
echo "📍 Backup de cambios en: $BACKUP_DIR"
echo "📍 Rama actual: $(git symbolic-ref --short HEAD 2>/dev/null || echo 'main')"
echo ""
echo "🚀 Ahora puedes continuar con tus operaciones Git normalmente"
