#!/bin/bash
echo "🔍 Verificando implementación V2..."
echo ""
files=(
  "src/orchestration/schemas/clinical-note-schema.ts"
  "src/orchestration/prompts/schema-constrained-prompt.ts"
  "src/orchestration/validation/response-validator.ts"
  "src/services/clinical-orchestration-service.ts"
  "src/hooks/useNiagaraProcessor-v2.ts"
  "src/hooks/useAutoSelection.ts"
  "src/components/ValidationMetrics.tsx"
  "functions/clinical-analysis-v2.js"
)

all_good=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file FALTA"
    all_good=false
  fi
done

if $all_good; then
  echo ""
  echo "✅ Todos los archivos están listos"
  echo ""
  echo "SIGUIENTE PASO:"
  echo "1. Actualizar WorkflowAnalysisTab.tsx manualmente"
  echo "2. Deploy: firebase deploy --only functions"
else
  echo ""
  echo "⚠️ Faltan archivos - revisar implementación"
fi
