/**
 * @fileoverview Manual Clinical Test - Transcripción Real de Óscar
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { SOAPGenerationService } from '../services/SOAPGenerationService';
import { ClinicalEntity } from '../types/nlp';
import { ClinicalInsight, SOAPGenerationResult } from '../types/clinical-analysis';

// Transcripción real del paciente Óscar
const TRANSCRIPT_OSCAR = `
Oscar seguí nuevo paciente, abro micrófono: Oscar por favor para que me comentes y me cuentes qué te trae por estos lados, cuál es tu mayor molestia, cuál es tu mayor valor, por favor. Espolón calcáneo bilaterales a los dos lados, si tiene un informe. Has tenido que modificar la marcha tanto por el dolor en tus piernas pero dijo el médico le dijo el 4 L5, que el dolor local o se irradia, se va por el glúteo, por la pierna y es más hacia acá esta zona, a veces en esa zona, esto que si siempre... ¿En qué trabajas? De hostelería, estás de pie durante mucho rato y cargando peso. A lo de calcáneo, nuevos otra vez estuviste ahí y ahora un poquito... pero ¿qué es lo que más te molesta y te duele en este minuto que vamos a priorizar? La zona lumbar es lo que más. Igual vamos a ver lo de los pies, ningún problema, pero quiero priorizar lo que más te esté molestando a ti en este minuto. ¿Es más hacia tu derecha o más hacia tu izquierda o es muy central? Es justo en la zona central. ¿Y actividades normales como aprovecharte los zapatos o recoger cosas del suelo te genera mucho dolor y te quedas así como trabado? ¿No tienes algún uniforme que pueda...? Ganemos algo. Voy a dejar esto por acá. Acuéstate.
`.trim();

/**
 * Servicio para extraer entidades clínicas de transcripciones de texto
 */
class TranscriptProcessor {
  
  /**
   * Extrae entidades clínicas del texto transcrito
   */
  public static extractClinicalEntities(transcript: string): ClinicalEntity[] {
    const entities: ClinicalEntity[] = [];
    let entityId = 1;

    // Patrones para detectar síntomas
    const symptomPatterns = [
      { pattern: /espolón calcáneo bilaterales?/gi, text: 'espolón calcáneo bilateral', confidence: 0.95 },
      { pattern: /dolor.*lumbar|zona lumbar|dolor.*piernas?/gi, text: 'dolor lumbar irradiado', confidence: 0.90 },
      { pattern: /dolor.*glúteo/gi, text: 'dolor irradiado a glúteo', confidence: 0.85 },
      { pattern: /modificar.*marcha/gi, text: 'alteración de la marcha', confidence: 0.88 },
      { pattern: /dolor.*pies?/gi, text: 'dolor en pies', confidence: 0.80 }
    ];

    // Patrones para anatomía
    const anatomyPatterns = [
      { pattern: /L5|L4/gi, text: 'vértebra L4-L5', confidence: 0.85 },
      { pattern: /calcáneo/gi, text: 'hueso calcáneo', confidence: 0.90 },
      { pattern: /zona lumbar|lumbar/gi, text: 'región lumbar', confidence: 0.92 },
      { pattern: /glúteo/gi, text: 'músculo glúteo', confidence: 0.88 },
      { pattern: /piernas?/gi, text: 'extremidades inferiores', confidence: 0.85 }
    ];

    // Patrones para hallazgos
    const findingPatterns = [
      { pattern: /dolor central|zona central/gi, text: 'dolor de localización central', confidence: 0.87 },
      { pattern: /trabado|rigidez/gi, text: 'limitación funcional severa', confidence: 0.85 },
      { pattern: /de pie.*mucho rato/gi, text: 'prolongada bipedestación laboral', confidence: 0.90 }
    ];

    // Extraer síntomas
    for (const pattern of symptomPatterns) {
      const matches = transcript.match(pattern.pattern);
      if (matches) {
        entities.push({
          id: `entity_${entityId++}`,
          type: 'symptom',
          text: pattern.text,
          confidence: pattern.confidence,
          context: matches[0]
        });
      }
    }

    // Extraer anatomía
    for (const pattern of anatomyPatterns) {
      const matches = transcript.match(pattern.pattern);
      if (matches) {
        entities.push({
          id: `entity_${entityId++}`,
          type: 'anatomy',
          text: pattern.text,
          confidence: pattern.confidence,
          context: matches[0]
        });
      }
    }

    // Extraer hallazgos
    for (const pattern of findingPatterns) {
      const matches = transcript.match(pattern.pattern);
      if (matches) {
        entities.push({
          id: `entity_${entityId++}`,
          type: 'finding',
          text: pattern.text,
          confidence: pattern.confidence,
          context: matches[0]
        });
      }
    }

    // Agregar ocupación como hallazgo relevante
    if (transcript.toLowerCase().includes('hostelería')) {
      entities.push({
        id: `entity_${entityId++}`,
        type: 'finding',
        text: 'trabajo en hostelería con bipedestación prolongada',
        confidence: 0.95,
        context: 'De hostelería, estás de pie durante mucho rato y cargando peso'
      });
    }

    return entities;
  }

  /**
   * Genera insights clínicos basados en las entidades extraídas
   */
  public static generateClinicalInsights(entities: ClinicalEntity[]): ClinicalInsight[] {
    const insights: ClinicalInsight[] = [];

    // Determinar diagnóstico principal basado en síntomas
    const hasLumbarPain = entities.some(e => e.text.includes('lumbar'));
    const hasCalcanealSpur = entities.some(e => e.text.includes('calcáneo'));
    const hasRadiation = entities.some(e => e.text.includes('irradiado'));

    if (hasLumbarPain && hasRadiation) {
      insights.push({
        id: 'diagnosis_1',
        title: 'Lumbalgia mecánica con irradiación',
        description: 'Dolor lumbar de origen mecánico con irradiación a glúteo y extremidades inferiores, compatible con compresión radicular L4-L5',
        confidence: 0.88,
        category: 'diagnosis',
        severity: 'medium',
        timestamp: new Date(),
        evidence: {
          source: 'Anamnesis clínica',
          publicationDate: new Date().toISOString()
        }
      });
    }

    if (hasCalcanealSpur) {
      insights.push({
        id: 'diagnosis_2',
        title: 'Espolón calcáneo bilateral',
        description: 'Presencia confirmada de espolones calcáneos bilaterales que contribuyen al dolor en extremidades inferiores',
        confidence: 0.95,
        category: 'diagnosis',
        severity: 'medium',
        timestamp: new Date()
      });
    }

    // Tratamientos recomendados
    insights.push({
      id: 'treatment_1',
      title: 'Terapia manual lumbar',
      description: 'Técnicas de terapia manual para descompresión lumbar y mejora de la movilidad',
      confidence: 0.85,
      category: 'intervention',
      severity: 'low',
      timestamp: new Date()
    });

    insights.push({
      id: 'treatment_2',
      title: 'Ejercicios de fortalecimiento core',
      description: 'Programa de ejercicios para fortalecimiento de musculatura profunda y estabilización lumbar',
      confidence: 0.90,
      category: 'exercise',
      severity: 'low',
      timestamp: new Date()
    });

    insights.push({
      id: 'treatment_3',
      title: 'Modificación ergonómica laboral',
      description: 'Recomendaciones ergonómicas para trabajo en hostelería y reducción de bipedestación prolongada',
      confidence: 0.92,
      category: 'education',
      severity: 'low',
      timestamp: new Date()
    });

    insights.push({
      id: 'treatment_4',
      title: 'Plantillas ortopédicas',
      description: 'Prescripción de plantillas personalizadas para manejo de espolones calcáneos',
      confidence: 0.88,
      category: 'intervention',
      severity: 'low',
      timestamp: new Date()
    });

    // Diagnóstico diferencial
    insights.push({
      id: 'differential_1',
      title: 'Síndrome facetario lumbar',
      description: 'Considerar afectación de articulaciones facetarias como causa de dolor lumbar central',
      confidence: 0.75,
      category: 'differential',
      severity: 'low',
      timestamp: new Date()
    });

    return insights;
  }
}

/**
 * Función principal de procesamiento
 */
async function processOscarTranscript(): Promise<void> {
  try {
    console.log('Iniciando análisis de transcripción clínica de Óscar...\n');

    // 1. Extraer entidades clínicas del texto
    console.log('Extrayendo entidades clínicas...');
    const entities = TranscriptProcessor.extractClinicalEntities(TRANSCRIPT_OSCAR);
    console.log(`Extraídas ${entities.length} entidades clínicas\n`);

    // 2. Generar insights clínicos
    console.log('Generando insights clínicos...');
    const insights = TranscriptProcessor.generateClinicalInsights(entities);
    console.log(`Generados ${insights.length} insights clínicos\n`);

    // 3. Generar SOAP estructurado
    console.log('Generando estructura SOAP...');
    const soapResult: SOAPGenerationResult = await SOAPGenerationService.generateSOAP(
      entities,
      insights,
      'therapist_test',
      'oscar_session_001'
    );
    console.log('SOAP generado exitosamente\n');

    // 4. Preparar resultado final
    const finalResult = {
      patient: "Óscar Seguí",
      transcript_length: TRANSCRIPT_OSCAR.length,
      entities_extracted: entities.length,
      insights_generated: insights.length,
      soap: {
        subjective: soapResult.soap.subjective.chiefComplaint,
        objective: soapResult.soap.objective.inspection,
        assessment: soapResult.soap.assessment.primaryDiagnosis,
        plan: soapResult.soap.plan.interventions.slice(0, 3) // Primeras 3 intervenciones
      },
      metadata: {
        qualityScore: soapResult.qualityScore,
        reviewRequired: soapResult.reviewRequired,
        processingTime: soapResult.processingTime,
        complianceFlags: soapResult.complianceFlags,
        criticalFindings: soapResult.analysisMetadata.criticalFindingsCount
      },
      clinical_entities: entities.map(e => ({
        type: e.type,
        text: e.text,
        confidence: Math.round(e.confidence * 100)
      })),
      treatment_plan: insights
        .filter(i => i.category === 'intervention' || i.category === 'exercise')
        .map(i => i.title)
    };

    // 5. Mostrar resultado en consola
    console.log('RESULTADO FINAL DEL ANÁLISIS CLÍNICO:');
    console.log('=====================================\n');
    console.log(JSON.stringify(finalResult, null, 2));

    console.log('\nRESUMEN DE ANÁLISIS:');
    console.log('======================');
    console.log(`Paciente: ${finalResult.patient}`);
    console.log(`Calidad SOAP: ${finalResult.metadata.qualityScore}/100`);
    console.log(`Revisión requerida: ${finalResult.metadata.reviewRequired ? 'SÍ' : 'NO'}`);
    console.log(`Flags de compliance: ${finalResult.metadata.complianceFlags.join(', ')}`);
    console.log(`Tiempo procesamiento: ${Math.round(finalResult.metadata.processingTime)}ms`);
    console.log(`Entidades extraídas: ${finalResult.entities_extracted}`);
    console.log(`Insights generados: ${finalResult.insights_generated}`);
    console.log(`Hallazgos críticos: ${finalResult.metadata.criticalFindings}`);

  } catch (error) {
    console.error('Error en el procesamiento:', error);
    // No usar process.exit en entorno de testing
  }
}

// Ejecutar el análisis
processOscarTranscript();

export { TranscriptProcessor, processOscarTranscript };
