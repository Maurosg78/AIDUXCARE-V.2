#!/bin/bash
# scripts/recreate-projects-complete.sh
# RECREACIÓN COMPLETA DE PROYECTOS FIREBASE
# ⚠️ ADVERTENCIA: ESTO BORRARÁ TODOS LOS DATOS

set -e

echo "🚨 RECREACIÓN COMPLETA DE PROYECTOS FIREBASE"
echo "⚠️  ADVERTENCIA: ESTO BORRARÁ TODOS LOS DATOS"
echo ""

# Confirmación final
read -p "¿Estás SEGURO de que quieres borrar ambos proyectos? (escribe 'SI, BORRAR TODO'): " confirm
if [ "$confirm" != "SI, BORRAR TODO" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo ""
echo "🔍 VERIFICANDO ESTADO ACTUAL..."

# 1. Verificar proyectos existentes
echo "📋 Proyectos Firebase actuales:"
firebase projects:list 2>/dev/null | grep -E "(aiduxcare-mvp-uat|aiduxcare-mvp-prod)" || echo "No se encontraron proyectos"

echo ""
echo "🗑️  INICIANDO BORRADO COMPLETO..."

# 2. Borrar proyecto UAT
echo "🗑️  Borrando proyecto UAT..."
firebase use aiduxcare-mvp-uat 2>/dev/null || echo "Proyecto UAT no encontrado"
firebase projects:delete aiduxcare-mvp-uat --force 2>/dev/null || echo "Error borrando UAT (puede que ya no exista)"

# 3. Borrar proyecto PROD
echo "🗑️  Borrando proyecto PROD..."
firebase use aiduxcare-mvp-prod 2>/dev/null || echo "Proyecto PROD no encontrado"
firebase projects:delete aiduxcare-mvp-prod --force 2>/dev/null || echo "Error borrando PROD (puede que ya no exista)"

echo ""
echo "✨ RECREANDO PROYECTOS DESDE CERO..."

# 4. Crear proyecto UAT
echo "🏗️  Creando proyecto UAT..."
firebase projects:create aiduxcare-mvp-uat --display-name "AiDuxCare MVP UAT" || echo "Error creando UAT"

# 5. Crear proyecto PROD
echo "🏗️  Creando proyecto PROD..."
firebase projects:create aiduxcare-mvp-prod --display-name "AiDuxCare MVP PROD" || echo "Error creando PROD"

echo ""
echo "🔧 CONFIGURANDO PROYECTOS..."

# 6. Configurar UAT
echo "⚙️  Configurando UAT..."
firebase use aiduxcare-mvp-uat
firebase init firestore --project aiduxcare-mvp-uat --yes
firebase init auth --project aiduxcare-mvp-uat --yes

# 7. Configurar PROD
echo "⚙️  Configurando PROD..."
firebase use aiduxcare-mvp-prod
firebase init firestore --project aiduxcare-mvp-prod --yes
firebase init auth --project aiduxcare-mvp-prod --yes

echo ""
echo "🔑 GENERANDO NUEVAS API KEYS..."

# 8. Obtener nuevas configuraciones
echo "📋 Configuración UAT:"
firebase apps:sdkconfig web --project aiduxcare-mvp-uat

echo ""
echo "📋 Configuración PROD:"
firebase apps:sdkconfig web --project aiduxcare-mvp-prod

echo ""
echo "✅ RECREACIÓN COMPLETA FINALIZADA"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "1. Copiar las nuevas configuraciones a .env.local"
echo "2. Habilitar Email/Password en ambos proyectos"
echo "3. Configurar dominios autorizados"
echo "4. Ejecutar smoke tests de validación"
echo ""
echo "⚠️  RECUERDA: Todos los datos anteriores se han perdido permanentemente"
