const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. ARREGLAR MEDICACIONES - Buscar campos correctos
const medicationsFunction = `medicacion_actual: (() => {
      const meds = [];
      // Intentar múltiples campos posibles
      const medFields = ['current_medications', 'suspected_medications', 'medications_reported', 'medications'];
      
      for (const field of medFields) {
        if (vertexData[field] && Array.isArray(vertexData[field])) {
          vertexData[field].forEach((med: any) => {
            if (typeof med === 'string') {
              meds.push(med);
            } else if (med && typeof med === 'object') {
              // Buscar el nombre del medicamento en cualquier campo posible
              const medName = med.inferred_medication || med.likely_medication || 
                            med.name || med.medication || med.drug || '';
              const description = med.patient_description || med.reported_as || '';
              const purpose = med.purpose || med.reason_for_use || med.indication || '';
              
              let fullMed = medName;
              if (description && description !== medName) {
                fullMed += \` (\${description})\`;
              }
              if (purpose) {
                fullMed += \` - \${purpose}\`;
              }
              
              if (fullMed.trim()) meds.push(fullMed);
            }
          });
          break; // Si encontramos medicaciones, parar
        }
      }
      return meds;
    })()`;

// 2. ARREGLAR HALLAZGOS CLÍNICOS - Procesar estructura anidada
const findingsFunction = `// Procesar hallazgos clínicos de forma inteligente
  const processFindings = () => {
    const findings = [];
    
    // Buscar en physical_exam_findings
    if (vertexData.physical_exam_findings) {
      const exam = vertexData.physical_exam_findings;
      
      // Si es un objeto plano
      if (typeof exam === 'object' && !Array.isArray(exam)) {
        Object.entries(exam).forEach(([key, value]) => {
          if (typeof value === 'string') {
            findings.push(value);
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Para objetos anidados como musculoskeletal
            Object.values(value).forEach(v => {
              if (v) findings.push(String(v));
            });
          }
        });
      }
    }
    
    // También buscar síntomas en history_of_present_illness
    if (vertexData.history_of_present_illness) {
      const hpi = vertexData.history_of_present_illness;
      if (hpi.mechanism_of_injury) findings.push('Mechanism: ' + hpi.mechanism_of_injury);
      if (hpi.falls_history) findings.push('Falls: ' + JSON.stringify(hpi.falls_history).substring(0, 50));
    }
    
    // Buscar en cualquier campo que contenga "findings" o "symptoms"
    Object.keys(vertexData).forEach(key => {
      if ((key.includes('finding') || key.includes('symptom')) && !key.includes('physical_exam')) {
        const val = vertexData[key];
        if (typeof val === 'string') findings.push(val.substring(0, 100));
      }
    });
    
    return findings.slice(0, 10); // Máximo 10 hallazgos
  };`;

// 3. ARREGLAR YELLOW FLAGS - Hacerlos dinámicos
const yellowFlagsFunction = `yellow_flags: (() => {
      const flags = [];
      const allText = JSON.stringify(vertexData).toLowerCase();
      
      // Detectar yellow flags basados en el contenido real
      if (allText.includes('chronic')) flags.push('Chronic condition');
      if (allText.includes('polypharmacy')) flags.push('Multiple medications');
      if (allText.includes('isolation')) flags.push('Social isolation');
      if (allText.includes('depression')) flags.push('Depression risk');
      if (allText.includes('adherence')) flags.push('Medication adherence issues');
      
      return flags;
    })()`;

// Reemplazar las secciones
content = content.replace(/medicacion_actual:[\s\S]*?\]\),/, medicationsFunction + ',');

// Insertar processFindings antes del return
if (!content.includes('processFindings')) {
  content = content.replace('return {', findingsFunction + '\n\n  return {');
}

// Reemplazar yellow_flags
content = content.replace(/yellow_flags:\s*\[[^\]]*\]/, yellowFlagsFunction);

fs.writeFileSync(file, content);
console.log('✅ Mapper fixed for generic use');
