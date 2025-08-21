/**
 * @fileoverview Transcript Processor Service - Clinical Entity Extraction
 * @version 1.0.0 Enterprise
 * @author AiDuxCare Development Team
 */

import { ClinicalEntity } from '../types/nlp';
import { ClinicalInsight } from '../types/clinical-analysis';

export class TranscriptProcessor {
  /**
   * Procesar transcripción y extraer entidades clínicas
   */
  public static extractClinicalEntities(transcript: string): ClinicalEntity[] {
    const entities: ClinicalEntity[] = [];
    
    // Análisis básico de texto para extraer entidades
    const words = transcript.toLowerCase().split(/\s+/);
    
    // Detectar síntomas
    const symptomKeywords = ['dolor', 'molestia', 'rigidez', 'inflamación', 'hinchazón'];
    words.forEach((word, index) => {
      if (symptomKeywords.includes(word)) {
        entities.push({
          id: `symptom_${index}`,
          text: word,
          type: 'symptom',
          confidence: 0.8,
          position: { start: index, end: index + 1 }
        });
      }
    });

    // Detectar anatomía
    const anatomyKeywords = ['cervical', 'lumbar', 'hombro', 'rodilla', 'columna'];
    words.forEach((word, index) => {
      if (anatomyKeywords.includes(word)) {
        entities.push({
          id: `anatomy_${index}`,
          text: word,
          type: 'anatomy',
          confidence: 0.9,
          position: { start: index, end: index + 1 }
        });
      }
    });

    return entities;
  }

  /**
   * Generar insights clínicos basados en entidades
   */
  public static generateClinicalInsights(entities: ClinicalEntity[]): ClinicalInsight[] {
    const insights: ClinicalInsight[] = [];
    
    // Analizar entidades para generar insights
    const symptoms = entities.filter(e => e.type === 'symptom');
    const anatomy = entities.filter(e => e.type === 'anatomy');
    
    // Insight 1: Síntomas dolorosos
    if (symptoms.length > 0) {
      insights.push({
        id: 'insight_1',
        title: 'Síntomas dolorosos identificados',
        description: `Se identificaron ${symptoms.length} síntomas dolorosos en la transcripción`,
        confidence: 0.85,
        category: 'diagnosis',
        severity: 'medium',
        timestamp: new Date()
      });
    }
    
    // Insight 2: Compromiso de estructuras
    if (anatomy.length > 0) {
      insights.push({
        id: 'insight_2',
        title: 'Compromiso de estructuras anatómicas',
        description: `Se identificaron ${anatomy.length} estructuras anatómicas afectadas`,
        confidence: 0.9,
        category: 'diagnosis',
        severity: 'high',
        timestamp: new Date()
      });
    }
    
    // Insight 3: Limitaciones funcionales
    if (symptoms.length > 0 && anatomy.length > 0) {
      insights.push({
        id: 'insight_3',
        title: 'Limitaciones funcionales detectadas',
        description: 'Combinación de síntomas y estructuras afectadas sugiere limitaciones funcionales',
        confidence: 0.75,
        category: 'diagnosis',
        severity: 'medium',
        timestamp: new Date()
      });
    }
    
    // Insight 4: Factores ocupacionales
    const occupationalKeywords = ['trabajo', 'laboral', 'postura', 'movimiento'];
    const hasOccupationalFactors = entities.some(e => 
      occupationalKeywords.some(keyword => e.text.includes(keyword))
    );
    
    if (hasOccupationalFactors) {
      insights.push({
        id: 'insight_4',
        title: 'Factores ocupacionales identificados',
        description: 'Se detectaron factores ocupacionales que pueden contribuir a la condición',
        confidence: 0.7,
        category: 'diagnosis',
        severity: 'low',
        timestamp: new Date()
      });
    }
    
    return insights;
  }

  /**
   * Procesar transcripción completa
   */
  public static processTranscript(transcript: string): {
    entities: ClinicalEntity[];
    insights: ClinicalInsight[];
  } {
    const entities = this.extractClinicalEntities(transcript);
    const insights = this.generateClinicalInsights(entities);
    
    return {
      entities,
      insights
    };
  }
}
