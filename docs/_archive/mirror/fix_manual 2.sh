#!/bin/bash

echo "🔧 Aplicando correcciones manuales..."

# Backup
cp src/components/WorkflowAnalysisTab.tsx src/components/WorkflowAnalysisTab.backup.manual.tsx

# Crear archivo temporal con cambios
cp src/components/WorkflowAnalysisTab.tsx temp_file.tsx

# FIX 1: Corregir filtro de síntomas (línea 95)
# Reemplazar toda la línea problemática
sed -i '' '95s/.*/      ...(niagaraResults.hallazgos_relevantes || []).filter(h => !h.includes("Medicación actual") \&\& !h.toLowerCase().includes("ibuprofeno") \&\& !h.toLowerCase().includes("enantyum")).map((h, i) => ({/' temp_file.tsx

# FIX 2: Insertar contexto psicosocial después de medication (después de línea 104)
# Primero crear el texto a insertar
cat > psico_insert.txt << 'PSICO'
      })),
      // Contexto psicosocial
      ...(niagaraResults.hallazgos_relevantes || []).filter(h => {
        const lower = h.toLowerCase();
        return lower.includes("músico") || lower.includes("ocupación") ||
               lower.includes("trabajo") || lower.includes("furgoneta") ||
               lower.includes("profesión") || lower.includes("actividad");
      }).map((h, i) => ({
        id: `psychosocial-${i}`,
        text: h,
        type: "psychosocial"
PSICO

# Insertar después de la línea 104
sed -i '' '104r psico_insert.txt' temp_file.tsx

# Mover el archivo temporal al original
mv temp_file.tsx src/components/WorkflowAnalysisTab.tsx

# Limpiar
rm -f psico_insert.txt

echo "✅ Correcciones aplicadas"
