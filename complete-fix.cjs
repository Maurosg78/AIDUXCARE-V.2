const fs = require('fs');

// 1. ARREGLAR MAPPER
let mapper = fs.readFileSync('src/utils/vertexFieldMapper.ts', 'utf8');

// Reemplazar TODO el procesamiento de medicaciones
mapper = mapper.replace(
  /medicacion_actual:[\s\S]*?\]\),/,
  `medicacion_actual: (() => {
      const meds = [];
      // Vertex puede enviar medicaciones en CUALQUIER campo
      const possibleFields = [
        'medical_history_reported',  // ESTE ES EL CAMPO QUE VIENE
        'current_medications',
        'suspected_medications',
        'medications_reported',
        'medications'
      ];
      
      for (const field of possibleFields) {
        if (vertexData[field]) {
          toArray(vertexData[field]).forEach((item: any) => {
            if (typeof item === 'string') {
              meds.push(item);
            } else if (item) {
              // Extraer medicación de cualquier estructura
              const med = item.medication_inferred || item.inferred_medication || 
                         item.medication || item.drug || item.name || '';
              const condition = item.condition || item.reason || '';
              
              if (med) {
                meds.push(condition ? \`\${med} (for \${condition})\` : med);
              }
            }
          });
          if (meds.length > 0) break;
        }
      }
      return meds;
    })(),`
);

// Arreglar processFindings para que realmente procese
mapper = mapper.replace(
  'hallazgos_clinicos: processFindings(),',
  `hallazgos_clinicos: (() => {
      const findings = [];
      
      // Extraer de physical_exam_findings
      if (vertexData.physical_exam_findings) {
        Object.entries(vertexData.physical_exam_findings).forEach(([key, value]) => {
          if (value) findings.push(String(value));
        });
      }
      
      // Extraer de current_concerns
      if (vertexData.current_concerns) {
        toArray(vertexData.current_concerns).slice(0, 5).forEach(concern => {
          findings.push(String(concern));
        });
      }
      
      return findings;
    })(),`
);

// Cambiar contexto psicosocial hardcodeado a inglés
mapper = mapper.replace(
  /contexto_psicosocial:[\s\S]*?\]\.filter\(Boolean\),/,
  `contexto_psicosocial: [
      vertexData.age ? \`Age: \${vertexData.age}\` : null,
      vertexData.social_history?.living_situation || null,
      vertexData.social_history?.family_support || null,
      'Functional impact assessment needed'
    ].filter(Boolean),`
);

// Cambiar antecedentes a inglés
mapper = mapper.replace(
  "'Hipercolesterolemia controlada'",
  "'Medical history from report'"
);

fs.writeFileSync('src/utils/vertexFieldMapper.ts', mapper);

// 2. CAMBIAR cleanVertexResponse.ts para valores por defecto en inglés
const cleanFile = 'src/utils/cleanVertexResponse.ts';
if (fs.existsSync(cleanFile)) {
  let clean = fs.readFileSync(cleanFile, 'utf8');
  clean = clean.replace(/Paciente de/g, 'Age:');
  clean = clean.replace(/Alto impacto en calidad de vida/g, 'High functional impact');
  clean = clean.replace(/Riesgo de dependencia funcional/g, 'Risk of functional dependency');
  fs.writeFileSync(cleanFile, clean);
}

// 3. CAMBIAR responseParser.ts para valores por defecto en inglés
const parserFile = 'src/services/responseParser.ts';
if (fs.existsSync(parserFile)) {
  let parser = fs.readFileSync(parserFile, 'utf8');
  parser = parser.replace(/Evaluación neurológica urgente/g, 'Urgent neurological evaluation');
  parser = parser.replace(/Descartar síndrome de cauda equina/g, 'Rule out cauda equina syndrome');
  parser = parser.replace(/Cuantificar riesgo de caídas/g, 'Quantify fall risk');
  parser = parser.replace(/Documentar déficit motor/g, 'Document motor deficit');
  parser = parser.replace(/Confirmar compresión nerviosa/g, 'Confirm nerve compression');
  fs.writeFileSync(parserFile, parser);
}

console.log('✅ Complete fix applied - English only, dynamic data extraction');
