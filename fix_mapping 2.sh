#!/bin/bash

echo "🔧 Arreglando mapeo de datos en WorkflowAnalysisTab..."

# Backup
cp src/components/WorkflowAnalysisTab.tsx src/components/WorkflowAnalysisTab.backup.mapping.tsx

# Reemplazar toda la sección de adaptedResults (líneas ~92-117)
cat > temp_mapping.txt << 'MAPPING'
  // Adaptar estructura de datos para componente legacy
  console.log("niagaraResults estructura:", JSON.stringify(niagaraResults, null, 2));
  
  const adaptedResults = niagaraResults ? {
    ...niagaraResults,
    physicalTests: niagaraResults.evaluaciones_fisicas_sugeridas || [],
    entities: [
      // SÍNTOMAS - Solo dolor y síntomas físicos
      ...(niagaraResults.hallazgos_relevantes || [])
        .filter(h => {
          const lower = h.toLowerCase();
          return (lower.includes("dolor") || 
                  lower.includes("irradiación") ||
                  lower.includes("inicio") ||
                  lower.includes("antecedentes de dolor")) &&
                 !lower.includes("medicación") &&
                 !lower.includes("ibuprofeno") &&
                 !lower.includes("enantyum") &&
                 !lower.includes("ocupación") &&
                 !lower.includes("conductor") &&
                 !lower.includes("músico") &&
                 !lower.includes("fuma") &&
                 !lower.includes("bebe") &&
                 !lower.includes("deporte");
        })
        .map((h, i) => ({
          id: `symptom-${i}`,
          text: h,
          type: "symptom"
        })),
      
      // MEDICACIÓN - Solo medicamentos
      ...(niagaraResults.hallazgos_relevantes || [])
        .filter(h => {
          const lower = h.toLowerCase();
          return lower.includes("medicación") || 
                 lower.includes("ibuprofeno") || 
                 lower.includes("enantyum") ||
                 lower.includes("antiinflamatorio") ||
                 lower.includes("toma");
        })
        .map((h, i) => ({
          id: `medication-${i}`,
          text: h,
          type: "medication"
        })),
      
      // CONTEXTO PSICOSOCIAL - Ocupación, actividades, hábitos
      ...(niagaraResults.hallazgos_relevantes || [])
        .filter(h => {
          const lower = h.toLowerCase();
          return (lower.includes("ocupación") ||
                  lower.includes("conductor") ||
                  lower.includes("músico") ||
                  lower.includes("trabajo") ||
                  lower.includes("actividad física") ||
                  lower.includes("deporte") ||
                  lower.includes("fuma") ||
                  lower.includes("bebe") ||
                  lower.includes("antecedentes sociales")) &&
                 !lower.includes("dolor") &&
                 !lower.includes("medicación");
        })
        .map((h, i) => ({
          id: `psychosocial-${i}`,
          text: h,
          type: "psychosocial"
        }))
    ],
    redFlags: niagaraResults.red_flags || [],
    diagnoses: niagaraResults.diagnosticos_probables || []
  } : null;
MAPPING

# Buscar y reemplazar la sección de adaptedResults
# Esto es complejo, mejor usar un approach diferente
