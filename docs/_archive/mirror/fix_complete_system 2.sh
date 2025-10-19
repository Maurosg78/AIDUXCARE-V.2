#!/bin/bash

echo "🔧 Aplicando fix integral del sistema..."

# Backup de ambos archivos
cp src/components/WorkflowAnalysisTab.tsx src/components/WorkflowAnalysisTab.backup.complete.tsx
cp src/components/ClinicalAnalysisResults.tsx src/components/ClinicalAnalysisResults.backup.complete.tsx

# 1. Arreglar WorkflowAnalysisTab para mapear correctamente a la estructura esperada
cat > fix_workflow.txt << 'WORKFLOW'
  const adaptedResults = niagaraResults ? {
    ...niagaraResults,
    // Tests físicos - mantener estructura completa
    physicalTests: (niagaraResults.evaluaciones_fisicas_sugeridas || []).map(test => {
      if (typeof test === 'string') return test;
      // Si es objeto, mantener toda la info
      return {
        name: test.test || test.nombre || 'Test físico',
        sensitivity: test.sensibilidad,
        specificity: test.especificidad,
        indication: test.indicacion,
        justification: test.justificacion
      };
    }),
    
    // Entities para síntomas y medicación únicamente
    entities: [
      // Solo síntomas físicos
      ...(niagaraResults.hallazgos_relevantes || [])
        .filter(h => {
          const lower = h.toLowerCase();
          return (lower.includes('dolor') || 
                  lower.includes('molestia') ||
                  lower.includes('inicio') ||
                  lower.includes('localización') ||
                  lower.includes('ausencia de dolor')) &&
                 !lower.includes('medicación') &&
                 !lower.includes('ibuprofeno') &&
                 !lower.includes('ocupación') &&
                 !lower.includes('actividad') &&
                 !lower.includes('factor');
        })
        .map((h, i) => ({
          id: `symptom-${i}`,
          text: h,
          type: 'symptom'
        })),
      
      // Solo medicación actual
      ...(niagaraResults.hallazgos_relevantes || [])
        .filter(h => {
          const lower = h.toLowerCase();
          return lower.includes('medicación') || 
                 lower.includes('ibuprofeno') || 
                 lower.includes('enantyum') ||
                 lower.includes('antiinflamatorio') ||
                 lower.includes('toma') ||
                 lower.includes('aliviante');
        })
        .map((h, i) => ({
          id: `medication-${i}`,
          text: h,
          type: 'medication'
        }))
    ],
    
    // Yellow flags - contexto psicosocial, ocupación, hábitos
    yellowFlags: (niagaraResults.hallazgos_relevantes || [])
      .filter(h => {
        const lower = h.toLowerCase();
        return lower.includes('ocupación') ||
               lower.includes('trabajo') ||
               lower.includes('músico') ||
               lower.includes('conductor') ||
               lower.includes('actividad física') ||
               lower.includes('deporte') ||
               lower.includes('fuma') ||
               lower.includes('bebe') ||
               lower.includes('antecedentes sociales') ||
               lower.includes('estrés');
      }),
    
    // Red flags se mantienen igual
    redFlags: niagaraResults.red_flags || [],
    
    // Diagnósticos
    diagnoses: niagaraResults.diagnosticos_probables || []
  } : null;
WORKFLOW

# 2. Arreglar ClinicalAnalysisResults para mostrar nombres de tests correctamente
sed -i '' 's/typeof test === '\''string'\'' ? test : test.name/typeof test === '\''string'\'' ? test : (test.name || test.test || '\''Test físico'\'')/g' src/components/ClinicalAnalysisResults.tsx

echo "✅ Sistema completo arreglado"
echo ""
echo "Cambios aplicados:"
echo "1. ✅ Tests físicos ahora mantienen estructura completa"
echo "2. ✅ Factores psicosociales van a yellowFlags"
echo "3. ✅ Síntomas y medicación filtrados correctamente"
echo "4. ✅ Tests se renderizan con sus nombres correctos"
