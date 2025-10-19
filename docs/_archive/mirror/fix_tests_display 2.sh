#!/bin/bash

# Backup
cp src/components/ClinicalAnalysisResults.tsx src/components/ClinicalAnalysisResults.backup.tests.tsx

# Modificar la línea donde se muestra el texto del test
sed -i '' 's/text={`${i + 1}\. ${typeof test === '\''string'\'' ? test : (test\.name || test\.test || '\''Test físico'\'')`}/text={`${i + 1}. ${typeof test === '\''string'\'' ? test : (test.name || test.test || '\''Test físico'\'')}${(test.sensitivity || test.sensibilidad) ? ` (Sens: ${Math.round((test.sensitivity || test.sensibilidad) * 100)}%, Esp: ${Math.round((test.specificity || test.especificidad) * 100)}%)` : '\'''\''}`}/' src/components/ClinicalAnalysisResults.tsx

echo "✅ Tests ahora mostrarán sensibilidad/especificidad"
