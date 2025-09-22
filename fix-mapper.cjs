const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Buscar la función processFindings y reemplazarla
const newProcessFindings = `
  // Procesar hallazgos clínicos de forma universal
  const processFindings = () => {
    const findings = [];
    
    // From physical exam findings
    if (vertexData.physical_exam_findings) {
      Object.values(vertexData.physical_exam_findings).forEach(finding => {
        if (typeof finding === 'string') {
          findings.push(finding);
        }
      });
    }
    
    // From history of present illness  
    if (vertexData.history_of_present_illness) {
      Object.values(vertexData.history_of_present_illness).forEach(item => {
        if (typeof item === 'string' && item.length < 100) {
          findings.push(item);
        }
      });
    }
    
    // From concerns (important!)
    toArray(vertexData.concerns || vertexData.concerns_and_red_flags).forEach(concern => {
      if (typeof concern === 'string' && concern.length < 80) {
        findings.push(concern);
      }
    });
    
    return findings.slice(0, 10); // Max 10 findings
  };`;

// Reemplazar la función medicacion_actual
const newMedications = `
    medicacion_actual: toArray(vertexData.medications || vertexData.current_medications).map((med: any) => {
      if (typeof med === 'string') return med;
      // Handle both Spanish and English formats
      const name = med.name || med.patient_description || med.suspected_medication || med.inferred_medication;
      const dose = med.dosage || med.dose || med.reason || '';
      return name ? \`\${name}\${dose ? ': ' + dose : ''}\` : null;
    }).filter(Boolean),`;

// Aplicar cambios
content = content.replace(/const processFindings[^}]*\};/s, newProcessFindings);
content = content.replace(/medicacion_actual:[^,]*,/s, newMedications);

fs.writeFileSync(file, content);
console.log('✅ Mapper fixed for English data');
