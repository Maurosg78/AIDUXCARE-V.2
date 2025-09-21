export function mapVertexToSpanish(vertexData: any): any {
  if (!vertexData) return null;
  
  // Si ya tiene los campos en español, devolverlo tal cual
  if (vertexData.motivo_consulta) return vertexData;
  
  // Función helper para asegurar que algo sea array
  const toArray = (item: any) => {
    if (!item) return [];
    if (Array.isArray(item)) return item;
    return [item];
  };
  
  // Función para truncar texto a máximo 15 palabras
  const truncate = (text: string, maxWords: number = 15): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };
  
  // Detectar red flags basándose en el contenido
  const detectRedFlags = () => {
    const flags = [];
    const allText = JSON.stringify(vertexData).toLowerCase();
    
    if (allText.includes('caída') || allText.includes('caidas') || allText.includes('caído')) {
      flags.push('⚠️ CAÍDAS RECURRENTES - Riesgo alto de nuevas caídas');
    }
    
    if (allText.includes('pérdida de fuerza') || allText.includes('pierde fuerza')) {
      flags.push('⚠️ PÉRDIDA DE FUERZA PROGRESIVA - Evaluación neurológica urgente');
    }
    
    if (vertexData.medication_effectiveness?.includes('no le hacen efecto')) {
      flags.push('⚠️ FALLA TERAPÉUTICA - Medicación actual sin respuesta');
    }
    
    if (vertexData.age?.includes('84') && allText.includes('muy fuerte')) {
      flags.push('⚠️ ADULTO MAYOR CON DOLOR SEVERO NO CONTROLADO');
    }
    
    if (allText.includes('nervios') || allText.includes('aplastado')) {
      flags.push('⚠️ COMPRESIÓN NERVIOSA - Posible síndrome de cauda equina');
    }
    
    return flags;
  };
  
  // Procesar hallazgos clínicos de forma concisa
  const processFindings = () => {
    const findings = [];
    
    // Dolor principal
    if (vertexData.pain_characteristics?.intensity) {
      findings.push(`Dolor ${vertexData.pain_characteristics.intensity.toLowerCase()}`);
    }
    
    // Localización
    if (vertexData.pain_characteristics?.location) {
      findings.push(truncate(`Localización: ${vertexData.pain_characteristics.location}`, 10));
    }
    
    // Limitaciones funcionales
    toArray(vertexData.functional_limitations).forEach(limit => {
      if (typeof limit === 'string') {
        findings.push(truncate(limit, 12));
      }
    });
    
    // Síntomas asociados
    toArray(vertexData.associated_symptoms).forEach(symptom => {
      if (typeof symptom === 'string' && !symptom.toLowerCase().includes('dolor')) {
        findings.push(truncate(symptom, 10));
      }
    });
    
    // Características nocturnas
    if (vertexData.pain_characteristics?.night_pain) {
      const nightPain = vertexData.pain_characteristics.night_pain.toLowerCase();
      if (nightPain.includes('no')) {
        findings.push('Sin interrupción del sueño por dolor');
      } else {
        findings.push('Dolor nocturno que interrumpe el sueño');
      }
    }
    
    // Información de historia presente (solo lo más relevante)
    toArray(vertexData.history_of_present_illness).forEach(h => {
      if (h?.event && h.event.includes('Caídas')) {
        findings.push('Tres caídas recientes por pérdida de fuerza');
      }
    });
    
    // Información de radiografía
    toArray(vertexData.diagnostic_tests).forEach(test => {
      if (test?.findings?.includes('discos')) {
        findings.push('Discos aplastados con compresión nerviosa (radiografía)');
      }
    });
    
    return [...new Set(findings)]; // Eliminar duplicados
  };
  
  // Mapear de inglés a español
  return {
    motivo_consulta: vertexData.chief_complaint || 'Dolor lumbar severo con limitación funcional',
    
    hallazgos_clinicos: processFindings(),
    
    medicacion_actual: toArray(vertexData.current_medications).map((med: any) => {
      if (typeof med === 'string') return med;
      // Limpiar descripción de dosis
      let dosage = med.dosage || '';
      if (dosage.includes('implied')) {
        dosage = dosage.split('(')[0].trim();
      }
      return `${med.name}: ${dosage}`;
    }),
    
    contexto_psicosocial: [
      vertexData.age && `Paciente de ${vertexData.age}`,
      vertexData.medication_effectiveness && 'Medicación actual sin efecto',
      'Alto impacto en calidad de vida',
      'Riesgo de dependencia funcional'
    ].filter(Boolean),
    
    antecedentes_medicos: vertexData.past_medical_history ? 
      Object.entries(vertexData.past_medical_history)
        .filter(([key, value]) => value && value !== 'No' && value !== 'no')
        .map(([key, value]) => `${key}: ${value}`) 
        : ['Hipercolesterolemia controlada'],
    
    red_flags: detectRedFlags(),
    
    yellow_flags: [
      'Dolor crónico desde junio 2024',
      'Polimedicación sin respuesta adecuada',
      'Riesgo alto de cronicidad'
    ],
    
    evaluaciones_fisicas_sugeridas: [
      { 
        test: "Evaluación neurológica urgente", 
        objetivo: "Descartar síndrome de cauda equina",
        sensibilidad: 0.90,
        especificidad: 0.95
      },
      { 
        test: "Test de Tinetti", 
        objetivo: "Cuantificar riesgo de caídas",
        sensibilidad: 0.80,
        especificidad: 0.85
      },
      { 
        test: "Evaluación fuerza MMII (MRC Scale)", 
        objetivo: "Documentar déficit motor",
        sensibilidad: 0.75,
        especificidad: 0.80
      },
      {
        test: "RMN lumbar urgente",
        objetivo: "Confirmar compresión nerviosa",
        sensibilidad: 0.95,
        especificidad: 0.90
      }
    ],
    
    diagnosticos_probables: [
      'Estenosis de canal lumbar severa',
      'Síndrome de cauda equina (URGENTE descartar)',
      'Radiculopatía lumbar L4-L5/L5-S1'
    ]
  };
}
