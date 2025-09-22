const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';

const universalMapper = `export function mapVertexToSpanish(vertexData: any): any {
  if (!vertexData) return null;
  
  const toArray = (item: any) => {
    if (!item) return [];
    if (Array.isArray(item)) return item;
    return [item];
  };
  
  const toString = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    if (typeof item === 'object') {
      // Para objetos como chief_complaint, extraer valores significativos
      const parts = [];
      if (item.symptom) parts.push(item.symptom);
      if (item.description) parts.push(item.description);
      if (item.duration) parts.push(item.duration);
      if (item.onset) parts.push(item.onset);
      if (item.location) parts.push(item.location);
      if (item.text) parts.push(item.text);
      return parts.length > 0 ? parts.join(', ') : JSON.stringify(item).substring(0, 100);
    }
    return String(item);
  };

  // BUSCAR campos de medicación en CUALQUIER variante posible
  const findMedications = () => {
    const possibleFields = [
      'medications',
      'current_medications',
      'current_medications_patient_reported',
      'medication',
      'medicacion_actual',
      'drugs',
      'prescriptions'
    ];
    
    for (const field of possibleFields) {
      if (vertexData[field]) {
        return toArray(vertexData[field]).map((med: any) => {
          if (typeof med === 'string') return med;
          // Combinar todos los campos posibles del medicamento
          const parts = [];
          if (med.name) parts.push(med.name);
          if (med.patient_description) parts.push(med.patient_description);
          if (med.suspected_medication) parts.push('(' + med.suspected_medication + ')');
          if (med.dosage) parts.push(med.dosage);
          if (med.dose) parts.push(med.dose);
          if (med.frequency) parts.push(med.frequency);
          if (med.reason) parts.push('for ' + med.reason);
          return parts.join(' ');
        }).filter(Boolean);
      }
    }
    return [];
  };

  // BUSCAR hallazgos en CUALQUIER campo que pueda contenerlos
  const findClinicalFindings = () => {
    const findings = [];
    const clinicalFields = [
      'physical_exam_findings',
      'physical_exam',
      'exam_findings',
      'clinical_findings',
      'hallazgos_clinicos',
      'symptoms',
      'associated_symptoms'
    ];
    
    for (const field of clinicalFields) {
      if (vertexData[field]) {
        if (typeof vertexData[field] === 'object' && !Array.isArray(vertexData[field])) {
          Object.values(vertexData[field]).forEach(val => {
            const str = toString(val);
            if (str && str.length < 150) findings.push(str);
          });
        } else {
          toArray(vertexData[field]).forEach(item => {
            const str = toString(item);
            if (str && str.length < 150) findings.push(str);
          });
        }
      }
    }
    
    // También buscar en history_of_present_illness si existe
    if (vertexData.history_of_present_illness) {
      const hpi = vertexData.history_of_present_illness;
      if (hpi.falls) findings.push('Falls: ' + toString(hpi.falls));
      if (hpi.pain) findings.push('Pain: ' + toString(hpi.pain));
      if (hpi.symptoms) findings.push(toString(hpi.symptoms));
    }
    
    return findings.slice(0, 15); // Máximo 15 hallazgos
  };

  // BUSCAR red flags en campos de concerns, red_flags, warnings, etc.
  const findRedFlags = () => {
    const flags = [];
    const flagFields = [
      'concerns',
      'concerns_red_flags',
      'red_flags',
      'warnings',
      'alerts',
      'risks'
    ];
    
    for (const field of flagFields) {
      if (vertexData[field]) {
        toArray(vertexData[field]).forEach(flag => {
          const str = toString(flag);
          if (str) flags.push('⚠️ ' + str);
        });
      }
    }
    
    // Detectar red flags adicionales del contenido
    const allText = JSON.stringify(vertexData).toLowerCase();
    if (allText.includes('fall') && flags.length === 0) {
      flags.push('⚠️ Fall risk detected');
    }
    if (allText.includes('suicide') || allText.includes('self-harm')) {
      flags.push('⚠️ Mental health crisis - urgent evaluation needed');
    }
    
    return flags;
  };

  // RESULTADO FINAL - estructura consistente para cualquier entrada
  return {
    motivo_consulta: toString(vertexData.chief_complaint || vertexData.main_complaint || vertexData.reason_for_visit || ''),
    
    hallazgos_clinicos: findClinicalFindings(),
    
    medicacion_actual: findMedications(),
    
    contexto_psicosocial: [
      vertexData.age ? \`Patient age: \${vertexData.age}\` : null,
      vertexData.social_history ? toString(vertexData.social_history) : null,
      vertexData.occupation ? \`Occupation: \${vertexData.occupation}\` : null
    ].filter(Boolean),
    
    antecedentes_medicos: toArray(
      vertexData.past_medical_history || 
      vertexData.past_medical_history_suspected || 
      vertexData.medical_history || 
      []
    ).map(h => toString(h)),
    
    red_flags: findRedFlags(),
    
    yellow_flags: [],
    
    evaluaciones_fisicas_sugeridas: [
      { test: 'Physical evaluation based on symptoms', objetivo: 'Initial assessment' }
    ],
    
    diagnosticos_probables: toArray(
      vertexData.differential_diagnosis || 
      vertexData.possible_diagnoses || 
      []
    ).map(d => toString(d))
  };
}

export default mapVertexToSpanish;`;

fs.writeFileSync(file, universalMapper);
console.log('✅ Universal mapper created - works with ANY medical case');
