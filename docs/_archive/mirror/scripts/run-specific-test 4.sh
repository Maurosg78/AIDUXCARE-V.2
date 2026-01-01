#!/bin/bash

echo "🧪 SPECIFIC PIPELINE TESTING - AiDuxCare V.2"
echo "=============================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Verificar dependencias
echo "📋 Verificando dependencias..."
if ! command -v tsx &> /dev/null; then
    echo "📦 Instalando tsx..."
    npm install -g tsx
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Timestamp para el log
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/specific-test-${TIMESTAMP}.log"

echo "📝 Log file: $LOG_FILE"
echo "🚀 Iniciando testing específico..."

# Ejecutar el testing específico
npx tsx scripts/test-specific-pipeline.ts 2>&1 | tee "$LOG_FILE"

# Verificar el resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TESTING ESPECÍFICO COMPLETADO EXITOSAMENTE"
    echo "📊 Revisa el log completo en: $LOG_FILE"
    
    # Mostrar resumen del log
    echo ""
    echo "📋 RESUMEN DEL LOG:"
    echo "=================="
    grep -E "(📊|✅|❌|🏆|📈|⏱️)" "$LOG_FILE" | tail -15
else
    echo ""
    echo "❌ TESTING ESPECÍFICO FALLÓ"
    echo "📊 Revisa el log completo en: $LOG_FILE"
    exit 1
fi

echo ""
echo "🎯 Próximos pasos:"
echo "1. Revisar componentes que fallaron"
echo "2. Analizar métricas de performance"
echo "3. Ejecutar stress test si todo está OK"
echo "4. Corregir errores específicos si los hay" 