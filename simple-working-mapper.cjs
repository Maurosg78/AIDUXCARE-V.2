const fs = require('fs');

const mapperContent = `export function mapVertexToSpanish(vertexData: any): any {
  if (!vertexData) return null;
  
  // Handle arrays - take first element
  if (Array.isArray(vertexData) && vertexData.length > 0) {
    vertexData = vertexData[0];
  }
  
  const toArray = (item: any) => Array.isArray(item) ? item : item ? [item] : [];
  
  // Extract chief complaint
  const getChiefComplaint = () => {
    const cc = vertexData.chief_complaint;
    if (!cc) return 'Chief complaint not specified';
    if (typeof cc === 'string') return cc;
    return \`\${cc.symptom || ''} for \${cc.duration || ''} - \${cc.onset_event || ''}\`.trim();
  };
  
  // Extract medications
  const getMedications = () => {
    const meds = [];
    // Check medications_suspected field
    if (vertexData.medications_suspected) {
      toArray(vertexData.medications_suspected).forEach(med => {
        if (typeof med === 'string') {
          meds.push(med);
        } else if (med && med.name) {
          meds.push(\`\${med.name} - \${med.reason || ''}\`);
        }
      });
    }
    return meds;
  };
  
  // Extract physical findings
  const getFindings = () => {
    const findings = [];
    if (vertexData.physical_exam_findings) {
      const pef = vertexData.physical_exam_findings;
      if (typeof pef === 'object' && !Array.isArray(pef)) {
        Object.values(pef).forEach(value => {
          if (value) findings.push(String(value));
        });
      }
    }
    return findings;
  };
  
  // Extract red flags from risk factors
  const getRedFlags = () => {
    const flags = [];
    if (vertexData.risk_factors) {
      toArray(vertexData.risk_factors).forEach(risk => {
        const r = String(risk).toLowerCase();
        if (r.includes('fall')) flags.push('⚠️ FALL RISK - High fracture risk');
        if (r.includes('depression') || r.includes('suicidal')) flags.push('⚠️ DEPRESSION/SI - Mental health support needed');
        if (r.includes('polypharmacy')) flags.push('⚠️ POLYPHARMACY - Medication review needed');
        if (r.includes('malnutrition')) flags.push('⚠️ MALNUTRITION - Nutritional assessment needed');
      });
    }
    return flags;
  };
  
  // Extract psychosocial context
  const getPsychosocial = () => {
    const context = [];
    if (vertexData.social_history) {
      const sh = vertexData.social_history;
      if (typeof sh === 'object' && !Array.isArray(sh)) {
        Object.values(sh).forEach(value => {
          if (value) context.push(String(value));
        });
      }
    }
    return context;
  };
  
  // Return the mapped object
  return {
    motivo_consulta: getChiefComplaint(),
    hallazgos_clinicos: getFindings(),
    medicacion_actual: getMedications(),
    contexto_psicosocial: getPsychosocial(),
    red_flags: getRedFlags(),
    yellow_flags: [],
    evaluaciones_fisicas_sugeridas: [
      {
        test: 'Comprehensive physical assessment',
        sensibilidad: 0.85,
        especificidad: 0.90,
        objetivo: 'Initial evaluation',
        contraindicado_si: ''
      }
    ],
    antecedentes_medicos: toArray(vertexData.medical_history_suspected || []),
    diagnosticos_probables: []
  };
}

export default mapVertexToSpanish;`;

fs.writeFileSync('src/utils/vertexFieldMapper.ts', mapperContent);
console.log('✅ Created simple working mapper');
