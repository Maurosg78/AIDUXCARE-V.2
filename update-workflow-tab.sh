#!/bin/bash

FILE="src/components/WorkflowAnalysisTab.tsx"

echo "Actualizando $FILE..."

# Reemplazar useNiagaraProcessor con useNiagaraProcessorV2
sed -i '' 's/useNiagaraProcessor()/useNiagaraProcessorV2()/g' $FILE

# Buscar y actualizar la desestructuración del hook
sed -i '' 's/const { processTranscript, results, isProcessing }/const { processTranscript, results, validation, metrics, isProcessing, error }/g' $FILE

echo "✅ WorkflowAnalysisTab actualizado"
echo ""
echo "NOTA: Aún necesitas agregar manualmente el componente ValidationMetrics en el JSX:"
echo ""
echo '{validation && metrics && ('
echo '  <ValidationMetrics validation={validation} metrics={metrics} />'
echo ')}'
echo ""
echo "Justo antes de <ClinicalAnalysisResults />"
