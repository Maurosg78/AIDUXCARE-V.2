const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';

// Leer contenido actual
let content = fs.readFileSync(file, 'utf8');

// Reemplazar la función findMedications para incluir medications_reported
content = content.replace(
  /const possibleFields = \[[^\]]*\];/,
  `const possibleFields = [
      'medications',
      'medications_reported',  // AGREGAR ESTE
      'current_medications',
      'current_medications_patient_reported',
      'medication',
      'medicacion_actual',
      'drugs',
      'prescriptions'
    ];`
);

// Arreglar el mapeo de medicaciones para manejar reported_name/inferred_name
content = content.replace(
  /if \(med\.name\) parts\.push\(med\.name\);/,
  `if (med.name) parts.push(med.name);
          if (med.reported_name) parts.push(med.reported_name);`
);

content = content.replace(
  /if \(med\.suspected_medication\)/,
  `if (med.inferred_name) parts.push('(' + med.inferred_name + ')');
          if (med.suspected_medication)`
);

// Arreglar toString para NO mostrar JSON crudo
content = content.replace(
  /return parts\.length > 0 \? parts\.join\(', '\) : JSON\.stringify\(item\)\.substring\(0, 100\);/,
  `return parts.length > 0 ? parts.join(', ') : '';`
);

fs.writeFileSync(file, content);
console.log('✅ Fixed medications_reported detection');
