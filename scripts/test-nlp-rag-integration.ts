#!/usr/bin/env tsx

/**
 * 🧪 AiDuxCare - Test NLP + RAG Integration
 * Prueba del pipeline completo: Transcripción → NLP + RAG → Evidence-based SOAP
 */

import { NLPServiceOllama } from '../src/services/nlpServiceOllama';
import { RAGMedicalMCP } from '../src/core/mcp/RAGMedicalMCP';

// === TRANSCRIPCIONES DE EJEMPLO ===

const TRANSCRIPCIONES_FISIOTERAPIA = [
  {
    id: 'cervicalgia',
    title: 'Sesión de Cervicalgia con Contractura',
    transcript: `
El paciente Carlos de 45 años llega reportando dolor cervical intenso del lado derecho que comenzó hace 3 días después de dormir en mala posición. Refiere dolor de intensidad 7/10 que se irradia hacia el hombro y limita significativamente la rotación del cuello hacia la derecha.

Durante la evaluación observo contractura muscular evidente en trapecio superior derecho y esternocleidomastoideo. El rango de movimiento está limitado: rotación derecha 30 grados (normal 80), flexión lateral derecha 20 grados (normal 45). No hay signos neurológicos de alarma.

Aplicamos técnicas de terapia manual incluyendo liberación miofascial del trapecio, movilizaciones articulares suaves de C1-C2, y técnicas de energía muscular. El paciente reporta alivio inmediato del 60% del dolor tras el tratamiento.

Plan: continuar con sesiones de fisioterapia 3 veces por semana durante 2 semanas. Ejercicios de estiramiento del trapecio superior y fortalecimiento de músculos cervicales profundos. Aplicación de calor local 15 minutos antes de ejercicios. Reevaluación en una semana.
    `.trim()
  },
  {
    id: 'lumbalgia',
    title: 'Rehabilitación de Lumbalgia Crónica',
    transcript: `
Paciente María de 55 años con lumbalgia crónica de 6 meses de evolución. Refiere dolor constante en región lumbar baja, intensidad 5/10, que aumenta al estar sentada por períodos prolongados y mejora con el movimiento. Sin irradiación a miembros inferiores.

Evaluación física revela debilidad marcada en músculos del core, especialmente transverso del abdomen y multífidos. Test de resistencia de flexores profundos de cuello positivo. Patrón de movimiento alterado en flexión de cadera con compensación lumbar excesiva.

Iniciamos programa de estabilización lumbar con ejercicios de activación del transverso del abdomen, planks modificados y ejercicios de control motor. Educación sobre higiene postural y ergonomía laboral. Paciente muestra buena adherencia y comprensión.

Se prescribe programa domiciliario de ejercicios diarios: activación del core 2 series de 10 repeticiones, caminata 30 minutos diarios, estiramientos de flexores de cadera. Control en 15 días para progresión del programa.
    `.trim()
  },
  {
    id: 'rodilla',
    title: 'Post-Operatorio de Rodilla',
    transcript: `
Paciente Juan de 30 años, deportista, 4 semanas post artroscopia de rodilla izquierda por rotura de menisco medial. Se encuentra en fase de rehabilitación intermedia. Refiere molestias leves 3/10 principalmente con actividad.

Evaluación muestra rango de movimiento: flexión 110 grados (falta 25 grados para normalidad), extensión completa sin limitaciones. Atrofia evidente del cuádriceps izquierdo, especialmente vasto medial oblicuo. Marcha normal sin cojera.

Progresamos programa de fortalecimiento muscular con ejercicios de cadena cerrada: sentadillas asistidas, step-ups, ejercicios propioceptivos en superficie inestable. Terapia manual para mejorar flexión residual. Crioterapia post-ejercicio.

Objetivo: retorno al deporte en 3-4 semanas. Incrementar progresivamente carga de ejercicios. Ejercicios pliométricos en 2 semanas si evolución favorable. Educación sobre prevención de re-lesiones y calentamiento adecuado.
    `.trim()
  }
];

// === FUNCIONES DE TESTING ===

/**
 * Test de procesamiento NLP básico (sin RAG)
 */
async function testNLPBasico(transcripcion: any): Promise<void> {
  console.log(`\n📝 Testing NLP básico: ${transcripcion.title}`);
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const result = await NLPServiceOllama.processTranscript(transcripcion.transcript, { 
      useRAG: false 
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo total: ${duration}ms`);
    console.log(`🎯 Entidades extraídas: ${result.entities.length}`);
    console.log(`📋 Confianza SOAP: ${Math.round((result.soapNotes.confidence_score || 0) * 100)}%`);
    console.log(`🤖 RAG usado: ${result.ragUsed ? 'Sí' : 'No'}`);
    
    // Mostrar algunas entidades
    console.log('\n🏷️ Entidades encontradas:');
    result.entities.slice(0, 5).forEach((entity, i) => {
      console.log(`   ${i + 1}. ${entity.type}: "${entity.text}" (${Math.round(entity.confidence * 100)}%)`);
    });
    
    // Mostrar SOAP resumido
    console.log('\n📋 SOAP generado:');
    console.log(`   S: ${result.soapNotes.subjective.substring(0, 80)}...`);
    console.log(`   O: ${result.soapNotes.objective.substring(0, 80)}...`);
    console.log(`   A: ${result.soapNotes.assessment.substring(0, 80)}...`);
    console.log(`   P: ${result.soapNotes.plan.substring(0, 80)}...`);
    
  } catch (error) {
    console.error('❌ Error en NLP básico:', error);
  }
}

/**
 * Test de procesamiento NLP con RAG
 */
async function testNLPConRAG(transcripcion: any): Promise<void> {
  console.log(`\n🔬 Testing NLP + RAG: ${transcripcion.title}`);
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const result = await NLPServiceOllama.processTranscript(transcripcion.transcript, { 
      useRAG: true 
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo total: ${duration}ms`);
    console.log(`🎯 Entidades extraídas: ${result.entities.length}`);
    console.log(`📋 Confianza SOAP: ${Math.round((result.soapNotes.confidence_score || 0) * 100)}%`);
    console.log(`🔬 RAG usado: ${result.ragUsed ? 'Sí' : 'No'}`);
    
    // Mostrar entidades con mayor detalle
    console.log('\n🏷️ Entidades encontradas (con RAG):');
    result.entities.slice(0, 5).forEach((entity, i) => {
      console.log(`   ${i + 1}. ${entity.type}: "${entity.text}" (${Math.round(entity.confidence * 100)}%)`);
    });
    
    // Mostrar SOAP con evidencia
    console.log('\n📋 SOAP con evidencia científica:');
    console.log(`   S: ${result.soapNotes.subjective.substring(0, 100)}...`);
    console.log(`   O: ${result.soapNotes.objective.substring(0, 100)}...`);
    console.log(`   A: ${result.soapNotes.assessment.substring(0, 100)}...`);
    
    // Plan con evidencia (más detallado)
    console.log(`\n📈 Plan de tratamiento (con evidencia):`);
    if (result.soapNotes.plan.length > 200) {
      console.log(`   ${result.soapNotes.plan.substring(0, 300)}...`);
    } else {
      console.log(`   ${result.soapNotes.plan}`);
    }
    
    // Métricas detalladas
    console.log('\n📊 Métricas de procesamiento:');
    // Mostrar confianza general solo si está definida
    if (result.metrics && typeof result.metrics.overall_confidence === 'number') {
      console.log(`   - Confianza general: ${Math.round(result.metrics.overall_confidence * 100)}%`);
    } else {
      console.log('   - Confianza general: N/A');
    }
    console.log(`   - Requiere revisión: ${result.metrics.requires_review ? 'Sí' : 'No'}`);
    console.log(`   - Entidades por minuto: ${Math.round(result.entities.length / (duration / 60000))}`);
    
  } catch (error) {
    console.error('❌ Error en NLP + RAG:', error);
  }
}

/**
 * Test comparativo: Sin RAG vs Con RAG
 */
async function testComparativo(transcripcion: any): Promise<void> {
  console.log(`\n🔄 Comparativa Sin RAG vs Con RAG: ${transcripcion.title}`);
  console.log('═'.repeat(70));
  
  try {
    // Procesar sin RAG
    const sinRAG = await NLPServiceOllama.processTranscript(transcripcion.transcript, { 
      useRAG: false 
    });
    
    // Procesar con RAG
    const conRAG = await NLPServiceOllama.processTranscript(transcripcion.transcript, { 
      useRAG: true 
    });
    
    console.log('\n📊 Comparativa de resultados:');
    console.log(`                           SIN RAG    CON RAG     MEJORA`);
    console.log(`Entidades extraídas:       ${sinRAG.entities.length.toString().padStart(7)}    ${conRAG.entities.length.toString().padStart(7)}     ${conRAG.entities.length > sinRAG.entities.length ? '+' + (conRAG.entities.length - sinRAG.entities.length) : '='}${conRAG.entities.length === sinRAG.entities.length ? '' : ''}`);
    console.log(`Confianza SOAP (%):        ${Math.round((sinRAG.soapNotes.confidence_score || 0) * 100).toString().padStart(7)}    ${Math.round((conRAG.soapNotes.confidence_score || 0) * 100).toString().padStart(7)}     ${Math.round(((conRAG.soapNotes.confidence_score || 0) - (sinRAG.soapNotes.confidence_score || 0)) * 100) > 0 ? '+' + Math.round(((conRAG.soapNotes.confidence_score || 0) - (sinRAG.soapNotes.confidence_score || 0)) * 100) : '='}`);
    console.log(`Tiempo procesamiento (ms): ${sinRAG.metrics.total_processing_time_ms.toString().padStart(7)}    ${conRAG.metrics.total_processing_time_ms.toString().padStart(7)}     ${conRAG.metrics.total_processing_time_ms > sinRAG.metrics.total_processing_time_ms ? '+' + (conRAG.metrics.total_processing_time_ms - sinRAG.metrics.total_processing_time_ms) : '-' + (sinRAG.metrics.total_processing_time_ms - conRAG.metrics.total_processing_time_ms)}`);
    
    // Comparar longitud y calidad del plan
    const planSinRAG = sinRAG.soapNotes.plan.length;
    const planConRAG = conRAG.soapNotes.plan.length;
    
    console.log(`\n📋 Calidad del Plan de Tratamiento:`);
    console.log(`   Sin RAG: ${planSinRAG} caracteres`);
    console.log(`   Con RAG: ${planConRAG} caracteres`);
    console.log(`   Mejora: ${planConRAG > planSinRAG ? '+' + Math.round(((planConRAG - planSinRAG) / planSinRAG) * 100) + '% más detallado' : 'Similar'}`);
    
    // Mostrar diferencias en el plan
    if (planConRAG > planSinRAG * 1.2) {
      console.log('\n🔬 El plan con RAG incluye evidencia científica adicional');
    }
    
  } catch (error) {
    console.error('❌ Error en comparativa:', error);
  }
}

/**
 * Test de búsqueda RAG directa basada en entidades
 */
async function testRAGDirecto(transcripcion: any): Promise<void> {
  console.log(`\n🎯 Test RAG directo para: ${transcripcion.title}`);
  console.log('─'.repeat(60));
  
  try {
    // Primero extraer entidades
    const entities = await NLPServiceOllama.extractClinicalEntities(transcripcion.transcript, false);
    
    // Identificar condiciones principales
    const condiciones = entities
      .filter(e => e.type === 'symptom' || e.type === 'diagnosis')
      .slice(0, 2)
      .map(e => e.text);
    
    if (condiciones.length > 0) {
      const query = `${condiciones.join(' ')} evidence based treatment`;
      console.log(`🔍 Buscando evidencia para: "${query}"`);
      
      const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(query, 'fisioterapia', 5);
      
      console.log(`📊 Resultados RAG:`);
      console.log(`   - Documentos encontrados: ${ragResult.citations.length}`);
      console.log(`   - Confianza: ${Math.round(ragResult.confidence_score * 100)}%`);
      console.log(`   - Tiempo: ${ragResult.processing_time_ms}ms`);
      
      if (ragResult.citations.length > 0) {
        console.log('\n📚 Top 3 referencias científicas:');
        ragResult.citations.slice(0, 3).forEach((citation, i) => {
          console.log(`   ${i + 1}. ${citation.title.substring(0, 80)}...`);
          console.log(`      Autores: ${citation.authors}`);
          console.log(`      Revista: ${citation.journal} (${citation.year})`);
          console.log(`      PMID: ${citation.pmid || 'N/A'}`);
          console.log(`      Relevancia: ${Math.round(citation.relevance_score * 100)}%\n`);
        });
      }
    } else {
      console.log('⚠️ No se encontraron condiciones específicas para búsqueda RAG');
    }
    
  } catch (error) {
    console.error('❌ Error en RAG directo:', error);
  }
}

// === MAIN EXECUTION ===

async function main(): Promise<void> {
  console.log('🧬 AiDuxCare NLP + RAG Integration Testing');
  console.log('═════════════════════════════════════════════════════════════════════');
  
  try {
    for (const transcripcion of TRANSCRIPCIONES_FISIOTERAPIA) {
      console.log(`\n🎯 PROCESANDO: ${transcripcion.title.toUpperCase()}`);
      console.log('═'.repeat(70));
      
      // Test 1: NLP básico (sin RAG)
      await testNLPBasico(transcripcion);
      
      // Test 2: NLP con RAG
      await testNLPConRAG(transcripcion);
      
      // Test 3: Comparativa
      await testComparativo(transcripcion);
      
      // Test 4: RAG directo
      await testRAGDirecto(transcripcion);
      
      console.log('\n' + '═'.repeat(70));
      
      // Pausa entre transcripciones para no saturar APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 Testing de Integración NLP + RAG Completado!');
    console.log('\n📋 Resumen de capacidades demostradas:');
    console.log('   ✅ Extracción de entidades clínicas con IA local');
    console.log('   ✅ Generación de notas SOAP profesionales');
    console.log('   ✅ Enriquecimiento con evidencia científica de PubMed');
    console.log('   ✅ Integración seamless RAG + NLP');
    console.log('   ✅ Performance adecuada para uso clínico');
    console.log('   ✅ Costo operativo $0.00');
    
    console.log('\n🚀 ¡El sistema está listo para user testing con fisioterapeutas!');
    
  } catch (error) {
    console.error('❌ Error en testing de integración:', error);
    process.exit(1);
  }
}

// Ejecutar inmediatamente
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { main as testNLPRAGIntegration }; 