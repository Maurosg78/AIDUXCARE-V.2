#!/bin/bash

# Script para crear backup completo de Firestore antes de migración
# Autorizado por CTO Approval - W1-001

set -e

PROJECT_ID="${PROJECT_ID:-aiduxcare-v2-uat-dev}"
DATABASE_ID="${DATABASE_ID:-"(default)"}"
BACKUP_BUCKET="${BACKUP_BUCKET:-aiduxcare-firestore-backups}"
BACKUP_REGION="${BACKUP_REGION:-northamerica-northeast1}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="gs://${BACKUP_BUCKET}/backup-${TIMESTAMP}"
LOG_DIR="docs/audit-trail/W1-001/04-deployment/backup-logs"
LOG_FILE="${LOG_DIR}/backup-${TIMESTAMP}.log"

# Crear directorio de logs
mkdir -p "$LOG_DIR"

echo "════════════════════════════════════════════════════════════"
echo "  🔄 CREANDO BACKUP COMPLETO DE FIRESTORE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Proyecto: $PROJECT_ID"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Backup Path: $BACKUP_PATH"
echo "📝 Log File: $LOG_FILE"
echo ""

# Verificar autenticación
echo "1. Verificando autenticación..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "   ❌ No hay cuentas activas. Ejecutando login..."
    gcloud auth login
else
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
    echo "   ✅ Cuenta activa: $ACTIVE_ACCOUNT"
fi
echo ""

# Verificar proyecto activo
echo "2. Verificando proyecto activo..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "   🔄 Configurando proyecto: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
else
    echo "   ✅ Proyecto activo: $PROJECT_ID"
fi
echo ""

# Crear bucket de backup si no existe
echo "3. Verificando bucket de backup..."
if ! gsutil ls -b "gs://${BACKUP_BUCKET}" &> /dev/null; then
    echo "   📦 Creando bucket: gs://${BACKUP_BUCKET}"
    gsutil mb -p $PROJECT_ID -l $BACKUP_REGION "gs://${BACKUP_BUCKET}" 2>&1 | tee -a "$LOG_FILE"
    echo "   ✅ Bucket creado exitosamente"
else
    echo "   ✅ Bucket ya existe: gs://${BACKUP_BUCKET}"
fi
echo ""

# Verificar región del bucket
echo "4. Verificando región del bucket..."
BUCKET_REGION=$(gsutil ls -L -b "gs://${BACKUP_BUCKET}" 2>/dev/null | grep -i "location constraint" | awk '{print $3}' || echo "")
if [ -n "$BUCKET_REGION" ]; then
    echo "   📍 Región del bucket: $BUCKET_REGION"
    if [[ "$BUCKET_REGION" == *"northamerica-northeast1"* ]] || [[ "$BUCKET_REGION" == *"CANADA"* ]]; then
        echo "   ✅ Bucket en región canadiense"
    else
        echo "   ⚠️  Bucket no está en región canadiense (pero es solo para backup)"
    fi
fi
echo ""

# Iniciar exportación
echo "5. Iniciando exportación de Firestore..."
echo "   📊 Database: $DATABASE_ID"
echo "   📁 Destino: $BACKUP_PATH"
echo ""

START_TIME=$(date +%s)

gcloud firestore export $BACKUP_PATH \
  --project=$PROJECT_ID \
  --database=$DATABASE_ID \
  2>&1 | tee -a "$LOG_FILE"

EXPORT_EXIT_CODE=${PIPESTATUS[0]}
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📊 RESULTADO DE EXPORTACIÓN"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $EXPORT_EXIT_CODE -eq 0 ]; then
    echo "✅ Exportación completada exitosamente"
    echo "⏱️  Duración: ${DURATION} segundos ($(($DURATION / 60)) minutos)"
    echo "📁 Ubicación: $BACKUP_PATH"
    echo ""
    
    # Verificar que el backup existe
    echo "6. Verificando backup..."
    if gsutil ls "$BACKUP_PATH" &> /dev/null; then
        BACKUP_SIZE=$(gsutil du -sh "$BACKUP_PATH" 2>/dev/null | awk '{print $1}' || echo "N/A")
        echo "   ✅ Backup verificado"
        echo "   📊 Tamaño: $BACKUP_SIZE"
    else
        echo "   ⚠️  No se pudo verificar backup automáticamente"
    fi
    echo ""
    
    # Guardar información del backup
    BACKUP_INFO_FILE="${LOG_DIR}/backup-info-${TIMESTAMP}.json"
    cat > "$BACKUP_INFO_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "projectId": "$PROJECT_ID",
  "databaseId": "$DATABASE_ID",
  "backupPath": "$BACKUP_PATH",
  "backupRegion": "$BACKUP_REGION",
  "durationSeconds": $DURATION,
  "status": "SUCCESS",
  "backupSize": "$BACKUP_SIZE"
}
EOF
    echo "   📄 Información guardada en: $BACKUP_INFO_FILE"
    echo ""
    
    echo "✅ BACKUP COMPLETADO EXITOSAMENTE"
    echo ""
    echo "📋 Próximos pasos:"
    echo "   1. Verificar integridad del backup"
    echo "   2. Documentar en plan de migración"
    echo "   3. Proceder con preparación de migración"
    
else
    echo "❌ ERROR en exportación"
    echo "⏱️  Duración antes de error: ${DURATION} segundos"
    echo ""
    echo "📝 Revisar logs en: $LOG_FILE"
    echo ""
    echo "🚨 ACCIÓN REQUERIDA:"
    echo "   1. Revisar logs de error"
    echo "   2. Verificar permisos de Cloud Storage"
    echo "   3. Reintentar exportación"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"

