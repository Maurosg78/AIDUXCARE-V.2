#!/bin/bash

echo "🧪 BACKEND PIPELINE STRESS TEST - AiDuxCare V.2"
echo "=================================================="

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
LOG_FILE="logs/stress-test-${TIMESTAMP}.log"

echo "📝 Log file: $LOG_FILE"
echo "🚀 Iniciando stress test..."

# Ejecutar el stress test
npx tsx scripts/backend-pipeline-stress-test.ts 2>&1 | tee "$LOG_FILE"

# Verificar el resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ STRESS TEST COMPLETADO EXITOSAMENTE"
    echo "📊 Revisa el log completo en: $LOG_FILE"
    
    # Mostrar resumen del log
    echo ""
    echo "📋 RESUMEN DEL LOG:"
    echo "=================="
    grep -E "(📊|✅|❌|🏆|📈|⏱️)" "$LOG_FILE" | tail -20
else
    echo ""
    echo "❌ STRESS TEST FALLÓ"
    echo "📊 Revisa el log completo en: $LOG_FILE"
    exit 1
fi

echo ""
echo "🎯 Próximos pasos:"
echo "1. Revisar métricas de performance"
echo "2. Analizar errores si los hay"
echo "3. Ajustar configuración según resultados"
echo "4. Ejecutar tests específicos si es necesario" 