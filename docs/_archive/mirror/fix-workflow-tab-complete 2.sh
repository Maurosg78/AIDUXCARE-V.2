#!/bin/bash

FILE="src/components/WorkflowAnalysisTab.tsx"

# Hacer backup
cp $FILE ${FILE}.backup-fix-$(date +%Y%m%d-%H%M%S)

# Buscar dónde está la línea problemática
echo "Buscando línea con error en línea 7..."
sed -n '7p' $FILE

# Ver contexto alrededor de la línea 7
echo "Contexto líneas 5-10:"
sed -n '5,10p' $FILE

# Si el problema es que validation se usa antes de ser definido,
# necesitamos ver todo el componente
echo ""
echo "Buscando dónde se define validation..."
grep -n "validation" $FILE | head -5
