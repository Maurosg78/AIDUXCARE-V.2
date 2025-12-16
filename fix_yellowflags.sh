#!/bin/bash

# Reemplazar las líneas 200-207 con un filtro más inteligente
sed -i '' '200,207d' src/components/WorkflowAnalysisTab.tsx
sed -i '' '199a\
    yellowFlags: (niagaraResults.hallazgos_relevantes || [])\
      .filter(h => {\
        const lower = h.toLowerCase();\
        // Capturar contexto ocupacional y psicosocial\
        const isOccupational = lower.includes("paciente es") || \
                              lower.includes("trabaja") || \
                              lower.includes("ocupación");\
        const isLifestyle = lower.includes("deporte") || \
                           lower.includes("realiza") || \
                           lower.includes("actividad");\
        const isSocial = (lower.includes("fuma") || lower.includes("bebe")) || \
                        (lower.includes("antecedentes") && !lower.includes("dolor"));\
        const isModifier = lower.includes("agrava") || lower.includes("alivia");\
        \
        return (isOccupational || isLifestyle || isSocial || isModifier) && \
               !lower.includes("toma antiinflamatorio");\
      }),' src/components/WorkflowAnalysisTab.tsx

echo "✅ yellowFlags mejorado"
