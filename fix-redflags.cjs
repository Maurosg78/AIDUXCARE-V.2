const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Reemplazar la función findRedFlags con criterios médicos correctos
const newRedFlags = `  // BUSCAR red flags MÉDICOS reales (no sociales)
  const findRedFlags = () => {
    const flags = [];
    const allText = JSON.stringify(vertexData).toLowerCase();
    
    // RED FLAGS MÉDICOS VERDADEROS para fisioterapia
    
    // Caídas recurrentes
    if (allText.includes('fall') && allText.includes('recurrent')) {
      flags.push('⚠️ RECURRENT FALLS - High risk of fracture');
    }
    
    // Confusión aguda (posible delirium)
    if (allText.includes('confused') || allText.includes('confusion')) {
      flags.push('⚠️ ACUTE CONFUSION - Rule out delirium/infection');
    }
    
    // Signos de fractura
    if (allText.includes('bruising') && allText.includes('hip')) {
      flags.push('⚠️ HIP BRUISING + PAIN - Rule out fracture');
    }
    
    // Síndrome de cauda equina
    if (allText.includes('bladder') || allText.includes('bowel') || allText.includes('saddle')) {
      flags.push('⚠️ CAUDA EQUINA SIGNS - Emergency referral');
    }
    
    // Dolor torácico
    if (allText.includes('chest pain') || allText.includes('chest pressure')) {
      flags.push('⚠️ CHEST PAIN - Cardiac evaluation needed');
    }
    
    // Signos neurológicos progresivos
    if (allText.includes('weakness') && (allText.includes('progressive') || allText.includes('sudden'))) {
      flags.push('⚠️ PROGRESSIVE WEAKNESS - Neurological emergency');
    }
    
    // Fiebre con dolor de espalda
    if (allText.includes('fever') && allText.includes('back')) {
      flags.push('⚠️ FEVER + BACK PAIN - Rule out infection');
    }
    
    return flags;
  };`;

// Reemplazar la función completa
content = content.replace(/const findRedFlags = \(\) => \{[\s\S]*?return flags;\s*\};/m, newRedFlags);

// Mover los problemas sociales a yellow flags
const newYellowFlags = `    yellow_flags: [
      vertexData.concerns?.includes('Social isolation') ? 'Social isolation' : null,
      vertexData.concerns?.includes('Depression') ? 'Depression/grief' : null,
      vertexData.concerns?.includes('Alcohol') ? 'Increased alcohol use' : null,
      vertexData.concerns?.includes('Malnutrition') ? 'Poor nutrition' : null,
      vertexData.concerns?.includes('Medication non-adherence') ? 'Medication adherence issues' : null
    ].filter(Boolean),`;

content = content.replace(/yellow_flags: \[\],/, newYellowFlags);

fs.writeFileSync(file, content);
console.log('✅ Red flags now show MEDICAL emergencies only');
