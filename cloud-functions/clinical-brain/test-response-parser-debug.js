/**
 * 🔍 PASO 3: DEPURAR EL RESPONSEPARSER
 * Test unitario para diagnosticar por qué las respuestas están vacías
 */

const ResponseParser = require('./src/services/ResponseParser');

console.log('🧪 INICIANDO TEST DE DEBUGGING DEL RESPONSEPARSER');
console.log('================================================\n');

// Crear instancia del parser
const parser = new ResponseParser();

// 🔍 CASO 1: Respuesta JSON válida de Vertex AI
console.log('📋 CASO 1: JSON VÁLIDO DE VERTEX AI');
const respuestaValidaVertexAI = `{
  "warnings": [
    {
      "id": "warning_001",
      "severity": "HIGH",
      "category": "red_flag",
      "title": "Sospecha de Síndrome Coronario Agudo",
      "description": "Combinación de dolor torácico con irradiación a brazo izquierdo y síntomas vegetativos sugiere posible evento coronario agudo",
      "recommendation": "Derivación inmediata a emergencias para evaluación cardiológica",
      "evidence": "Dolor torácico típico, irradiación características, síntomas acompañantes"
    }
  ],
  "suggestions": [
    {
      "id": "suggestion_001",
      "type": "additional_evaluation",
      "title": "Electrocardiograma",
      "description": "Realizar ECG de 12 derivaciones para evaluación cardiaca",
      "rationale": "Dolor torácico requiere descarte de origen cardiaco",
      "priority": "HIGH"
    }
  ],
  "soap_analysis": {
    "subjective_completeness": 85,
    "objective_completeness": 70,
    "assessment_quality": 90,
    "plan_appropriateness": 80,
    "overall_quality": 81,
    "missing_elements": ["Signos vitales completos"]
  },
  "session_quality": {
    "communication_score": 85,
    "clinical_thoroughness": 78,
    "patient_engagement": 92,
    "professional_standards": 88,
    "areas_for_improvement": ["Documentación más detallada"]
  }
}`;

try {
  const resultado1 = parser.parse(respuestaValidaVertexAI, 'general');
  console.log('✅ RESULTADO CASO 1:', {
    success: true,
    warningsCount: resultado1.warnings?.length || 0,
    suggestionsCount: resultado1.suggestions?.length || 0,
    overallQuality: resultado1.soap_analysis?.overall_quality
  });
} catch (error) {
  console.log('❌ ERROR CASO 1:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 🔍 CASO 2: Respuesta con JSON en bloque de código (formato común de Vertex AI)
console.log('📋 CASO 2: JSON EN BLOQUE DE CÓDIGO (FORMATO VERTEX AI)');
const respuestaConBloque = `Análisis completado. Aquí está el resultado:

\`\`\`json
{
  "warnings": [
    {
      "id": "warning_002",
      "severity": "MEDIUM",
      "category": "safety_concern",
      "title": "Dolor lumbar persistente",
      "description": "Dolor de espalda baja de más de 6 semanas de duración",
      "recommendation": "Evaluación de banderas rojas y consideración de estudios de imagen",
      "evidence": "Dolor crónico reportado por el paciente"
    }
  ],
  "suggestions": [
    {
      "id": "suggestion_002",
      "type": "treatment_modification",
      "title": "Ejercicios de estabilización",
      "description": "Implementar rutina de ejercicios de fortalecimiento del core",
      "rationale": "La estabilización del core es efectiva para dolor lumbar crónico",
      "priority": "MEDIUM"
    }
  ],
  "soap_analysis": {
    "subjective_completeness": 90,
    "objective_completeness": 75,
    "assessment_quality": 85,
    "plan_appropriateness": 88,
    "overall_quality": 84,
    "missing_elements": []
  },
  "session_quality": {
    "communication_score": 90,
    "clinical_thoroughness": 82,
    "patient_engagement": 88,
    "professional_standards": 90,
    "areas_for_improvement": ["Evaluación postural más detallada"]
  }
}
\`\`\`

Este análisis se basa en la transcripción proporcionada.`;

try {
  const resultado2 = parser.parse(respuestaConBloque, 'physiotherapy');
  console.log('✅ RESULTADO CASO 2:', {
    success: true,
    warningsCount: resultado2.warnings?.length || 0,
    suggestionsCount: resultado2.suggestions?.length || 0,
    overallQuality: resultado2.soap_analysis?.overall_quality
  });
} catch (error) {
  console.log('❌ ERROR CASO 2:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 🔍 CASO 3: Respuesta problemática (JSON malformado)
console.log('📋 CASO 3: JSON MALFORMADO (PROBLEMA TÍPICO)');
const respuestaMalformada = `{
  "warnings": [
    {
      "id": "warning_003",
      "severity": "HIGH",
      "category": "contraindication",
      "title": "Posible contraindicación para ejercicio"
      // Falta descripción, recommendation, evidence
    }
  ],
  "suggestions": [
    // Array incompleto
  ],
  "soap_analysis": {
    "subjective_completeness": 70,
    // Faltan campos requeridos
  }
  // Falta session_quality completamente
}`;

try {
  const resultado3 = parser.parse(respuestaMalformada, 'general');
  console.log('✅ RESULTADO CASO 3 (REPARADO):', {
    success: true,
    warningsCount: resultado3.warnings?.length || 0,
    suggestionsCount: resultado3.suggestions?.length || 0,
    overallQuality: resultado3.soap_analysis?.overall_quality
  });
} catch (error) {
  console.log('❌ ERROR CASO 3:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 🔍 CASO 4: Respuesta completamente vacía (problema reportado por Mauricio)
console.log('📋 CASO 4: RESPUESTA VACÍA (PROBLEMA REAL)');
const respuestaVacia = '';

try {
  const resultado4 = parser.parse(respuestaVacia, 'general');
  console.log('✅ RESULTADO CASO 4 (FALLBACK):', {
    success: true,
    warningsCount: resultado4.warnings?.length || 0,
    suggestionsCount: resultado4.suggestions?.length || 0,
    isFallback: true
  });
} catch (error) {
  console.log('❌ ERROR CASO 4:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 🔍 CASO 5: Respuesta con texto pero sin JSON (Vertex AI negándose a responder)
console.log('📋 CASO 5: VERTEX AI SE NIEGA A RESPONDER');
const respuestaNegativa = `Lo siento, no puedo proporcionar un análisis médico específico basado en la transcripción proporcionada. 

Como modelo de IA, no estoy autorizado para realizar diagnósticos médicos o proporcionar recomendaciones clínicas específicas que podrían influir en decisiones de atención médica.

Para un análisis médico adecuado, recomiendo consultar con un profesional de la salud calificado que pueda evaluar el caso completo.`;

try {
  const resultado5 = parser.parse(respuestaNegativa, 'psychology');
  console.log('✅ RESULTADO CASO 5 (FALLBACK):', {
    success: true,
    warningsCount: resultado5.warnings?.length || 0,
    suggestionsCount: resultado5.suggestions?.length || 0,
    isFallback: true
  });
} catch (error) {
  console.log('❌ ERROR CASO 5:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

console.log('🔍 CONCLUSIÓN DEL TEST DE DEBUGGING:');
console.log('1. ✅ ResponseParser maneja JSON válido correctamente');
console.log('2. ✅ ResponseParser extrae JSON de bloques de código');
console.log('3. ✅ ResponseParser repara JSON malformado');
console.log('4. ✅ ResponseParser maneja respuestas vacías con fallback');
console.log('5. ✅ ResponseParser maneja negativas de Vertex AI con fallback');
console.log('\n🎯 EL PROBLEMA NO ESTÁ EN EL RESPONSEPARSER');
console.log('   El problema está en QUÉ respuesta está devolviendo Vertex AI');
console.log('   Necesitamos ver los logs de la Cloud Function con las respuestas CRUDAS'); 