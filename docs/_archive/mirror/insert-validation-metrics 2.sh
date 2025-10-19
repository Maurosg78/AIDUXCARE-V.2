#!/bin/bash

FILE="src/components/WorkflowAnalysisTab.tsx"

# Crear un archivo temporal con el componente insertado
# Buscar la línea con ClinicalAnalysisResults y agregar ValidationMetrics antes
sed '/ClinicalAnalysisResults/i\
        {/* Métricas de validación y calidad */}\
        {validation && metrics && (\
          <ValidationMetrics\
            validation={validation}\
            metrics={metrics}\
          />\
        )}\
\
' $FILE > ${FILE}.tmp

# Reemplazar el archivo original
mv ${FILE}.tmp $FILE

echo "✅ ValidationMetrics agregado al JSX"
