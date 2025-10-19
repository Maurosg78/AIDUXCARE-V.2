#!/bin/bash

FILE="src/components/ClinicalAnalysisResults.tsx"

# Agregar import
sed -i '' '1a\
import { EditableCheckbox } from "./EditableCheckbox";
' $FILE

echo "✅ Import agregado"
echo ""
echo "NOTA: Necesitas actualizar manualmente los checkboxes en ClinicalAnalysisResults.tsx"
echo "Cambiar de:"
echo '  <input type="checkbox" ... />'
echo '  <span>{item.text}</span>'
echo ""
echo "A:"
echo '  <EditableCheckbox'
echo '    id={item.id}'
echo '    text={item.text}'
echo '    checked={selectedIds.includes(item.id)}'
echo '    onToggle={handleToggle}'
echo '    onTextChange={handleTextChange}'
echo '  />'
