const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Solo agregar detección de medical_history_inferred para medicaciones
content = content.replace(
  'medicacion_actual: toArray(vertexData.medications',
  `medicacion_actual: (() => {
    // Buscar medicaciones en CUALQUIER campo posible
    if (vertexData.medications_reported) {
      return toArray(vertexData.medications_reported).map((m: any) => 
        m.name || m.reported_as || m.suspected_medication || '');
    }
    if (vertexData.medical_history_inferred) {
      return toArray(vertexData.medical_history_inferred).map((m: any) => 
        m.medication_inferred || m.medication || '');
    }
    if (vertexData.medications || vertexData.current_medications) {
      return toArray(vertexData.medications || vertexData.current_medications);
    }
    return [];
  })()`
);

// Arreglar detección de red flags
content = content.replace(
  'const allText = JSON.stringify(vertexData);',
  `const allText = JSON.stringify(vertexData).toLowerCase();
  
  // Detectar red flags de concerns_and_red_flags
  const concerns = vertexData.concerns_and_red_flags || vertexData.concerns || [];
  toArray(concerns).forEach(flag => {
    if (typeof flag === 'string') {
      if (flag.toLowerCase().includes('fall')) {
        redFlags.push({ pattern: '⚠️ FALLS - Risk of fracture', urgency: 'high' });
      }
      if (flag.toLowerCase().includes('confusion')) {
        redFlags.push({ pattern: '⚠️ CONFUSION - Rule out delirium', urgency: 'high' });
      }
    }
  });`
);

fs.writeFileSync(file, content);
console.log('✅ Mapper fixed properly');
