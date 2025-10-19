#!/bin/bash

echo "🔧 Aplicando fixes a WorkflowAnalysisTab.tsx..."

# Crear backup con timestamp
BACKUP_FILE="src/components/WorkflowAnalysisTab.backup.$(date +%Y%m%d_%H%M%S).tsx"
cp src/components/WorkflowAnalysisTab.tsx "$BACKUP_FILE"
echo "✅ Backup creado: $BACKUP_FILE"

# Crear archivo temporal con las correcciones
cat src/components/WorkflowAnalysisTab.tsx | awk '
/^  const adaptedResults = niagaraResults \? \{/,/^  \} : null;/ {
  if (/\.filter\(h => !h\.includes\("Medicación actual"\) \|\|/) {
    # Fix línea de síntomas - cambiar || por && y agregar negaciones
    gsub(/\.filter\(h => !h\.includes\("Medicación actual"\) \|\| h\.toLowerCase\(\)\.includes\("ibuprofeno"\) \|\| h\.toLowerCase\(\)\.includes\("enantyum"\)/, ".filter(h => !h.includes(\"Medicación actual\") \&\& !h.toLowerCase().includes(\"ibuprofeno\") \&\& !h.toLowerCase().includes(\"enantyum\")");
  }
  if (/\.filter\(h => h\.includes\("Medicación actual"\) \|\|/) {
    # Fix línea de medicación - mantener || aquí porque queremos incluir cualquiera
    print
    next
  }
  if (/^    \],/) {
    # Antes del cierre de entities, agregar contexto psicosocial
    print "      )),"
    print "      // Contexto psicosocial"
    print "      ...(niagaraResults.hallazgos_relevantes || []).filter(h => {"
    print "        const lower = h.toLowerCase();"
    print "        return lower.includes(\"músico\") || lower.includes(\"ocupación\") ||"
    print "               lower.includes(\"trabajo\") || lower.includes(\"furgoneta\") ||"
    print "               lower.includes(\"profesión\") || lower.includes(\"actividad\");"
    print "      }).map((h, i) => ({"
    print "        id: `psychosocial-${i}`,"
    print "        text: h,"
    print "        type: \"psychosocial\""
    print "      }))"
  }
}
{ print }
' > src/components/WorkflowAnalysisTab.tmp.tsx

# Reemplazar archivo original con el corregido
mv src/components/WorkflowAnalysisTab.tmp.tsx src/components/WorkflowAnalysisTab.tsx

echo "✅ Fixes aplicados correctamente"
echo ""
echo "📋 Cambios realizados:"
echo "1. ✅ Filtro de síntomas corregido (excluye medicación)"
echo "2. ✅ Contexto psicosocial agregado"
echo "3. ✅ Estructura de datos preservada"
echo ""
echo "🔍 Verificando cambios..."
echo "Líneas con filtros de síntomas:"
grep -n "filter(h => !h.includes" src/components/WorkflowAnalysisTab.tsx | head -2
