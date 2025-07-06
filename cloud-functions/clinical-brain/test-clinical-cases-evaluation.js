const VertexAIClient = require('./src/services/VertexAIClient');
const PromptFactory = require('./src/services/PromptFactory');
const winston = require('winston');

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

/**
 * CASOS CLÍNICOS REALES PARA EVALUACIÓN EMPÍRICA
 * Diferentes complejidades, puntos ciegos y contraindicaciones
 */
const clinicalCases = {
  case1_simple_deceptive: {
    name: "CASO 1: Dolor Simple con Punto Ciego (Cervicalgia vs Cardíaco)",
    transcription: `
      Paciente masculino de 55 años consulta por dolor en cuello y hombro izquierdo desde hace 2 días.
      Refiere que empezó después de dormir mal. Dolor punzante que irradia al brazo izquierdo.
      También menciona que se siente un poco cansado y con sudoración ocasional.
      Trabaja en oficina, mucho estrés últimamente. Antecedente de hipertensión.
      
      Evaluación: contractura cervical, dolor a la palpación en trapecio.
      Movilidad cervical limitada por dolor. Paciente se ve ansioso.
    `,
    redFlags: ["Dolor irradiado a brazo izquierdo + sudoración en hombre >50 años con HTA"],
    expectedAlerts: ["Descartar origen cardíaco", "Evaluación médica urgente"],
    complexity: "simple_deceptive",
    description: "Caso aparentemente simple pero con banderas rojas cardíacas ocultas"
  },

  case2_moderate_contraindications: {
    name: "CASO 2: Lumbalgia con Contraindicaciones Múltiples",
    transcription: `
      Paciente femenina de 28 años, embarazada de 32 semanas, presenta dolor lumbar intenso 
      desde hace 5 días. Dolor constante que empeora al caminar y levantarse.
      También refiere hormigueo en pierna derecha y dificultad para orinar desde ayer.
      
      Sin trauma previo. Primer embarazo. Peso actual 78kg (ganancia 15kg).
      Evaluación: dolor a la palpación L4-L5, test de Lasègue positivo derecho.
      Fuerza muscular disminuida en flexión dorsal del pie derecho.
      
      Paciente muy preocupada por el bebé. Pide analgésicos fuertes.
    `,
    redFlags: ["Disfunción vesical", "Déficit neurológico", "Embarazo avanzado"],
    expectedAlerts: ["Síndrome de cola de caballo", "Contraindicaciones por embarazo", "Evaluación obstétrica urgente"],
    complexity: "moderate_high_risk",
    description: "Caso moderado con múltiples contraindicaciones y riesgo materno-fetal"
  },

  case3_complex_multisystem: {
    name: "CASO 3: Síndrome Complejo Multisistémico",
    transcription: `
      Paciente masculino de 67 años con antecedentes de diabetes tipo 2, fibrilación auricular 
      anticoagulado con warfarina, e insuficiencia renal crónica estadio 3.
      
      Consulta por dolor generalizado, fatiga extrema, pérdida de peso 8kg en 2 meses,
      dolor óseo nocturno en costillas y columna, y episodios de confusión mental.
      También refiere sangrado gingival frecuente y hematomas espontáneos.
      
      Examen: palidez marcada, adenopatías cervicales, hepatoesplenomegalia.
      Dolor óseo difuso a la palpación. Petequias en extremidades.
      Último INR: 4.2 (sobre-anticoagulado).
      
      Familiares reportan cambios de personalidad y olvidos recientes.
    `,
    redFlags: ["Pérdida de peso inexplicada", "Dolor óseo nocturno", "Adenopatías", "Sangrado", "Cambios cognitivos"],
    expectedAlerts: ["Sospecha neoplásica hematológica", "Sobre-anticoagulación", "Evaluación oncológica urgente", "Ajuste warfarina"],
    complexity: "high_multisystem",
    description: "Caso complejo multisistémico con alta sospecha oncológica"
  },

  case4_pediatric_tricky: {
    name: "CASO 4: Pediátrico con Presentación Atípica",
    transcription: `
      Niño de 8 años traído por madre por "dolores de crecimiento" en piernas desde hace 3 semanas.
      Dolor principalmente nocturno en rodillas y tobillos, que mejora con ibuprofeno.
      Madre refiere que el niño está más irritable, no quiere jugar fútbol como antes.
      
      También menciona que ha tenido algunas fiebres bajas vespertinas y pérdida de apetito.
      Sin trauma conocido. Vacunas al día. Desarrollo normal previo.
      
      Examen: niño pálido, se ve cansado. Dolor a la palpación en metáfisis de tibia y fémur.
      Marcha levemente antiálgica. Sin signos inflamatorios locales.
      Madre insiste que "son dolores de crecimiento normales".
    `,
    redFlags: ["Dolor óseo nocturno persistente", "Fiebre vespertina", "Cambio de comportamiento", "Palidez"],
    expectedAlerts: ["Descartar leucemia", "Evaluación hematológica urgente", "NO son dolores de crecimiento"],
    complexity: "pediatric_oncologic",
    description: "Caso pediátrico con alta sospecha oncológica disfrazado de dolores de crecimiento"
  },

  case5_emergency_disguised: {
    name: "CASO 5: Emergencia Disfrazada de Consulta Rutinaria",
    transcription: `
      Paciente femenina de 42 años consulta por "dolor de espalda común" desde hace 2 días.
      Refiere que empezó gradualmente, sin trauma. Dolor constante en zona dorsal media.
      Menciona que ha tenido algunos episodios de "acidez" y náuseas.
      
      Antecedentes: fumadora 20 años, uso de anticonceptivos orales, sedentarismo.
      Viajó en avión hace 1 semana (vuelo de 8 horas). IMC 32.
      
      Al examen: dolor a la palpación paravertebral T6-T8, pero también refiere dolor 
      al respirar profundo. Frecuencia respiratoria 22, se ve levemente ansiosa.
      Pantorrilla derecha con discreto edema y dolor a la palpación.
      
      Paciente minimiza síntomas, dice que "debe ser estrés del trabajo".
    `,
    redFlags: ["Dolor torácico + disnea", "Factores de riesgo TEP", "Edema unilateral"],
    expectedAlerts: ["Sospecha tromboembolismo pulmonar", "Evaluación cardiovascular urgente", "NO es dolor muscular"],
    complexity: "emergency_vascular",
    description: "Emergencia vascular disfrazada de dolor musculoesquelético común"
  }
};

/**
 * Función para evaluar un caso con un modelo específico
 */
async function evaluateCase(caseData, modelName, vertexClient, promptFactory) {
  console.log(`\n🔬 EVALUANDO CON MODELO: ${modelName}`);
  console.log('-'.repeat(50));
  
  const startTime = Date.now();
  
  try {
    // Generar prompt
    const prompt = promptFactory.generatePrompt(caseData.transcription);
    
    // Procesar con modelo específico
    const result = await vertexClient.processTranscription(
      caseData.transcription, 
      prompt, 
      { forceModel: modelName }
    );
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Extraer JSON
    let analysis;
    try {
      const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(result.text);
    } catch (parseError) {
      console.log('❌ Error parseando JSON:', parseError.message);
      return null;
    }
    
    // Evaluar calidad de la respuesta
    const evaluation = evaluateResponse(analysis, caseData);
    
    return {
      model: modelName,
      processingTime: processingTime,
      analysis: analysis,
      evaluation: evaluation,
      costInfo: result.costOptimization
    };
    
  } catch (error) {
    console.log(`❌ Error con modelo ${modelName}:`, error.message);
    return {
      model: modelName,
      error: error.message,
      processingTime: (Date.now() - startTime) / 1000
    };
  }
}

/**
 * Evaluar la calidad de la respuesta del modelo
 */
function evaluateResponse(analysis, caseData) {
  const evaluation = {
    redFlagsDetected: 0,
    expectedAlertsFound: 0,
    criticalMissed: [],
    appropriateAlerts: [],
    overallScore: 0,
    clinicalSafety: 'unknown'
  };
  
  // Verificar detección de banderas rojas
  const warningsText = JSON.stringify(analysis.warnings || []).toLowerCase();
  const suggestionsText = JSON.stringify(analysis.suggestions || []).toLowerCase();
  const combinedText = warningsText + ' ' + suggestionsText;
  
  // Contar banderas rojas detectadas
  caseData.redFlags.forEach(redFlag => {
    const flagWords = redFlag.toLowerCase().split(' ');
    const detected = flagWords.some(word => combinedText.includes(word.replace(/[^a-z]/g, '')));
    if (detected) {
      evaluation.redFlagsDetected++;
    } else {
      evaluation.criticalMissed.push(redFlag);
    }
  });
  
  // Verificar alertas esperadas
  caseData.expectedAlerts.forEach(expectedAlert => {
    const alertWords = expectedAlert.toLowerCase().split(' ');
    const found = alertWords.some(word => combinedText.includes(word.replace(/[^a-z]/g, '')));
    if (found) {
      evaluation.expectedAlertsFound++;
      evaluation.appropriateAlerts.push(expectedAlert);
    }
  });
  
  // Calcular score general
  const redFlagScore = (evaluation.redFlagsDetected / caseData.redFlags.length) * 50;
  const alertScore = (evaluation.expectedAlertsFound / caseData.expectedAlerts.length) * 30;
  const warningCount = (analysis.warnings?.length || 0);
  const warningScore = Math.min(warningCount * 5, 20); // Máximo 20 puntos por warnings
  
  evaluation.overallScore = Math.round(redFlagScore + alertScore + warningScore);
  
  // Determinar seguridad clínica
  if (evaluation.redFlagsDetected === caseData.redFlags.length && evaluation.expectedAlertsFound >= 1) {
    evaluation.clinicalSafety = 'SAFE';
  } else if (evaluation.redFlagsDetected >= caseData.redFlags.length * 0.7) {
    evaluation.clinicalSafety = 'ACCEPTABLE';
  } else {
    evaluation.clinicalSafety = 'UNSAFE';
  }
  
  return evaluation;
}

/**
 * Función principal de evaluación
 */
async function runClinicalEvaluation() {
  console.log('🏥 INICIANDO EVALUACIÓN EMPÍRICA DE MODELOS CLÍNICOS');
  console.log('='.repeat(80));
  
  // Inicializar servicios
  const vertexClient = new VertexAIClient();
  const promptFactory = new PromptFactory();
  
  // Modelos a evaluar
  const modelsToTest = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
  
  // Resultados generales
  const overallResults = {
    modelPerformance: {},
    caseResults: {},
    recommendations: []
  };
  
  // Evaluar cada caso con cada modelo
  for (const [caseKey, caseData] of Object.entries(clinicalCases)) {
    console.log(`\n📋 EVALUANDO: ${caseData.name}`);
    console.log('='.repeat(80));
    console.log(`Complejidad: ${caseData.complexity}`);
    console.log(`Banderas rojas esperadas: ${caseData.redFlags.length}`);
    console.log(`Alertas críticas esperadas: ${caseData.expectedAlerts.length}`);
    
    overallResults.caseResults[caseKey] = {
      caseName: caseData.name,
      complexity: caseData.complexity,
      modelResults: {}
    };
    
    for (const modelName of modelsToTest) {
      const result = await evaluateCase(caseData, modelName, vertexClient, promptFactory);
      
      if (result && !result.error) {
        console.log(`\n✅ RESULTADO ${modelName.toUpperCase()}:`);
        console.log(`   ⏱️  Tiempo: ${result.processingTime.toFixed(1)}s`);
        console.log(`   🚩 Banderas rojas detectadas: ${result.evaluation.redFlagsDetected}/${caseData.redFlags.length}`);
        console.log(`   ⚠️  Alertas apropiadas: ${result.evaluation.expectedAlertsFound}/${caseData.expectedAlerts.length}`);
        console.log(`   📊 Score general: ${result.evaluation.overallScore}/100`);
        console.log(`   🏥 Seguridad clínica: ${result.evaluation.clinicalSafety}`);
        console.log(`   ⚠️  Warnings generadas: ${result.analysis.warnings?.length || 0}`);
        
        if (result.evaluation.criticalMissed.length > 0) {
          console.log(`   ❌ CRÍTICOS PERDIDOS: ${result.evaluation.criticalMissed.join(', ')}`);
        }
        
        // Guardar resultado
        overallResults.caseResults[caseKey].modelResults[modelName] = result;
        
        // Acumular estadísticas por modelo
        if (!overallResults.modelPerformance[modelName]) {
          overallResults.modelPerformance[modelName] = {
            totalCases: 0,
            totalScore: 0,
            totalTime: 0,
            safetyRecord: { SAFE: 0, ACCEPTABLE: 0, UNSAFE: 0 },
            redFlagsDetected: 0,
            redFlagsTotal: 0
          };
        }
        
        const modelStats = overallResults.modelPerformance[modelName];
        modelStats.totalCases++;
        modelStats.totalScore += result.evaluation.overallScore;
        modelStats.totalTime += result.processingTime;
        modelStats.safetyRecord[result.evaluation.clinicalSafety]++;
        modelStats.redFlagsDetected += result.evaluation.redFlagsDetected;
        modelStats.redFlagsTotal += caseData.redFlags.length;
        
      } else {
        console.log(`\n❌ FALLO ${modelName.toUpperCase()}: ${result?.error || 'Error desconocido'}`);
      }
      
      // Pausa entre modelos para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // ANÁLISIS FINAL Y RECOMENDACIONES
  console.log('\n📊 ANÁLISIS FINAL DE RENDIMIENTO');
  console.log('='.repeat(80));
  
  for (const [modelName, stats] of Object.entries(overallResults.modelPerformance)) {
    const avgScore = (stats.totalScore / stats.totalCases).toFixed(1);
    const avgTime = (stats.totalTime / stats.totalCases).toFixed(1);
    const redFlagRate = ((stats.redFlagsDetected / stats.redFlagsTotal) * 100).toFixed(1);
    const safetyRate = ((stats.safetyRecord.SAFE / stats.totalCases) * 100).toFixed(1);
    
    console.log(`\n🤖 ${modelName.toUpperCase()}:`);
    console.log(`   📈 Score promedio: ${avgScore}/100`);
    console.log(`   ⏱️  Tiempo promedio: ${avgTime}s`);
    console.log(`   🚩 Detección banderas rojas: ${redFlagRate}%`);
    console.log(`   🏥 Casos seguros: ${safetyRate}%`);
    console.log(`   ✅ Seguros: ${stats.safetyRecord.SAFE} | ⚠️ Aceptables: ${stats.safetyRecord.ACCEPTABLE} | ❌ Inseguros: ${stats.safetyRecord.UNSAFE}`);
  }
  
  // GENERAR RECOMENDACIONES
  console.log('\n💡 RECOMENDACIONES BASADAS EN EVIDENCIA:');
  console.log('='.repeat(80));
  
  // Encontrar el mejor modelo por seguridad
  let bestSafetyModel = null;
  let bestSafetyRate = 0;
  
  for (const [modelName, stats] of Object.entries(overallResults.modelPerformance)) {
    const safetyRate = stats.safetyRecord.SAFE / stats.totalCases;
    if (safetyRate > bestSafetyRate) {
      bestSafetyRate = safetyRate;
      bestSafetyModel = modelName;
    }
  }
  
  console.log(`\n🏆 MODELO RECOMENDADO PARA PRODUCCIÓN: ${bestSafetyModel?.toUpperCase()}`);
  console.log(`   Razón: Mayor tasa de seguridad clínica (${(bestSafetyRate * 100).toFixed(1)}%)`);
  
  // Recomendaciones específicas
  const flash25Stats = overallResults.modelPerformance['gemini-2.5-flash'];
  const proStats = overallResults.modelPerformance['gemini-2.5-pro'];
  
  if (flash25Stats && proStats) {
    const timeDiff = ((proStats.totalTime - flash25Stats.totalTime) / flash25Stats.totalTime * 100).toFixed(1);
    const scoreDiff = ((proStats.totalScore - flash25Stats.totalScore) / flash25Stats.totalScore * 100).toFixed(1);
    
    console.log(`\n📊 COMPARACIÓN FLASH 2.5 vs PRO 2.5:`);
    console.log(`   ⏱️  Pro es ${timeDiff}% más lento que Flash`);
    console.log(`   📈 Pro es ${scoreDiff}% mejor en score que Flash`);
    
    if (Math.abs(parseFloat(scoreDiff)) < 10 && parseFloat(timeDiff) > 50) {
      console.log(`\n✅ RECOMENDACIÓN: Usar GEMINI-2.5-FLASH como estándar`);
      console.log(`   Razón: Diferencia de calidad mínima con latencia significativamente menor`);
    }
  }
  
  return overallResults;
}

// Ejecutar evaluación
runClinicalEvaluation().catch(console.error); 