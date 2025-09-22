const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Cambiar detección de red flags a INGLÉS
content = content.replace(
  "if (allText.includes('caída') || allText.includes('caidas') || allText.includes('caído'))",
  "if (allText.includes('fall') || allText.includes('falls') || allText.includes('falling'))"
);

content = content.replace(
  "flags.push('⚠️ CAÍDAS RECURRENTES - Riesgo alto de nuevas caídas');",
  "flags.push('⚠️ RECURRENT FALLS - High risk of fracture');"
);

content = content.replace(
  "if (allText.includes('pérdida de fuerza') || allText.includes('pierde fuerza'))",
  "if (allText.includes('weakness') || allText.includes('loss of strength'))"
);

content = content.replace(
  "flags.push('⚠️ PÉRDIDA DE FUERZA PROGRESIVA - Evaluación neurológica urgente');",
  "flags.push('⚠️ PROGRESSIVE WEAKNESS - Urgent neurological evaluation');"
);

content = content.replace(
  "if (allText.includes('nervios') || allText.includes('aplastado'))",
  "if (allText.includes('nerve') || allText.includes('compression') || allText.includes('cauda'))"
);

content = content.replace(
  "flags.push('⚠️ COMPRESIÓN NERVIOSA - Posible síndrome de cauda equina');",
  "flags.push('⚠️ NERVE COMPRESSION - Possible cauda equina syndrome');"
);

// Agregar detección de confusion
content = content.replace(
  "return flags;",
  `if (allText.includes('confusion') || allText.includes('confused')) {
      flags.push('⚠️ CONFUSION - Rule out delirium/infection');
    }
    
    return flags;`
);

// 2. Arreglar extracción de medicaciones para incluir suspected_medications
content = content.replace(
  "medicacion_actual: toArray(vertexData.current_medications)",
  `medicacion_actual: (() => {
      // Buscar en suspected_medications primero
      if (vertexData.suspected_medications) {
        return toArray(vertexData.suspected_medications).map((med: any) => {
          if (typeof med === 'string') return med;
          const name = med.likely_medication || med.name || '';
          const desc = med.patient_description ? \` (\${med.patient_description})\` : '';
          const reason = med.reason_for_use ? \` - \${med.reason_for_use}\` : '';
          return name + desc + reason;
        });
      }
      // Si no, buscar en current_medications
      if (vertexData.current_medications) {
        return toArray(vertexData.current_medications).map((med: any) => {
          if (typeof med === 'string') return med;
          return \`\${med.name}: \${med.dosage || ''}\`;
        });
      }
      return [];
    })()`
);

// 3. Arreglar chief complaint para manejar objetos
content = content.replace(
  "motivo_consulta: vertexData.chief_complaint || 'Dolor lumbar severo con limitación funcional',",
  `motivo_consulta: (() => {
      const cc = vertexData.chief_complaint;
      if (typeof cc === 'string') return cc;
      if (cc && typeof cc === 'object') {
        return \`\${cc.symptom || cc} for \${vertexData.onset_duration || cc.duration || ''} - \${vertexData.onset_event || cc.onset || ''}\`.trim();
      }
      return 'Chief complaint';
    })(),`
);

fs.writeFileSync(file, content);
console.log('✅ Mapper adapted for English data');
