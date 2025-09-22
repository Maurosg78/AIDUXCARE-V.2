const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Arreglar contexto psicosocial para extraer datos correctamente
const newContexto = `    contexto_psicosocial: (() => {
      const context = [];
      
      // Edad del paciente
      if (vertexData.patient_information?.age) {
        context.push(\`Age: \${vertexData.patient_information.age}\`);
      } else if (vertexData.age) {
        context.push(\`Age: \${vertexData.age}\`);
      }
      
      // Historia social
      if (vertexData.social_history) {
        if (vertexData.social_history.living_situation) {
          context.push(vertexData.social_history.living_situation);
        }
        if (vertexData.social_history.recent_loss) {
          context.push(\`Recent loss: \${vertexData.social_history.recent_loss}\`);
        }
        if (vertexData.social_history.alcohol_use) {
          context.push(\`Alcohol: \${vertexData.social_history.alcohol_use}\`);
        }
      }
      
      // Estado mental
      if (vertexData.mental_status_assessment?.mood_affect) {
        context.push(\`Mood: \${vertexData.mental_status_assessment.mood_affect}\`);
      }
      
      // Concerns psicosociales
      const concerns = vertexData.concerns_and_risk_factors || vertexData.concerns || [];
      toArray(concerns).forEach(concern => {
        if (typeof concern === 'string' && 
            (concern.includes('isolation') || concern.includes('depression') || 
             concern.includes('support') || concern.includes('grief'))) {
          context.push(concern);
        }
      });
      
      return context.slice(0, 8); // Max 8 items
    })(),`;

// Mejorar evaluaciones físicas sugeridas
const newEvaluaciones = `    evaluaciones_fisicas_sugeridas: (() => {
      const tests = [];
      const allText = JSON.stringify(vertexData).toLowerCase();
      
      // Tests basados en hallazgos
      if (allText.includes('fall')) {
        tests.push({ 
          test: 'Timed Up and Go Test', 
          objetivo: 'Assess fall risk',
          sensibilidad: 0.87,
          especificidad: 0.87
        });
      }
      
      if (allText.includes('hip') && allText.includes('pain')) {
        tests.push({ 
          test: 'Hip X-ray', 
          objetivo: 'Rule out fracture',
          sensibilidad: 0.90,
          especificidad: 0.95
        });
        tests.push({ 
          test: 'FABER Test', 
          objetivo: 'Hip pathology screening',
          sensibilidad: 0.77,
          especificidad: 0.84
        });
      }
      
      if (allText.includes('confusion') || allText.includes('confused')) {
        tests.push({ 
          test: 'Mini-Mental State Exam', 
          objetivo: 'Cognitive assessment',
          sensibilidad: 0.79,
          especificidad: 0.88
        });
      }
      
      if (allText.includes('dehydrat')) {
        tests.push({ 
          test: 'Orthostatic vital signs', 
          objetivo: 'Assess volume status',
          sensibilidad: 0.75,
          especificidad: 0.90
        });
      }
      
      // Si no hay tests específicos, agregar evaluación general
      if (tests.length === 0) {
        tests.push({ 
          test: 'Comprehensive physical assessment', 
          objetivo: 'Initial evaluation',
          sensibilidad: 0.75,
          especificidad: 0.85
        });
      }
      
      return tests;
    })(),`;

// Reemplazar las secciones
content = content.replace(/contexto_psicosocial:.*?\],/s, newContexto);
content = content.replace(/evaluaciones_fisicas_sugeridas:.*?\],/s, newEvaluaciones);

fs.writeFileSync(file, content);
console.log('✅ Fixed psychosocial context and physical evaluations');
