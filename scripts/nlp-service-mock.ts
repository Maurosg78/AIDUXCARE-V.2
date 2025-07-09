/**
 * 🧪 Mock NLP Service para Testing
 * Simula las funciones principales del NLPServiceOllama para scripts
 */

import { ollamaNode } from './ollama-client-node';
import { RAGMedicalMCP, MedicalSpecialty } from '../src/core/mcp/RAGMedicalMCP';

// === INTERFACES ===

export interface ClinicalEntity {
  text: string;
  type: 'symptom' | 'diagnosis' | 'treatment' | 'medication' | 'anatomy' | 'measurement' | 'temporal';
  confidence: number;
  start_position?: number;
  end_position?: number;
}

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence_score?: number;
}

export interface NLPProcessingResult {
  entities: ClinicalEntity[];
  soapNotes: SOAPNotes;
  ragUsed: boolean;
  metrics: {
    total_processing_time_ms: number;
    entities_extraction_time_ms: number;
    soap_generation_time_ms: number;
    rag_time_ms: number;
    overall_confidence: number;
    requires_review: boolean;
  };
}

// === MOCK NLP SERVICE ===

export class MockNLPService {
  
  /**
   * Procesa transcripción completa con opción RAG
   */
  static async processTranscript(
    transcript: string, 
    options: { useRAG?: boolean } = {}
  ): Promise<NLPProcessingResult> {
    const startTime = Date.now();
    
    console.log(`🧠 Procesando transcripción (RAG: ${options.useRAG ? 'ON' : 'OFF'})...`);
    
    // 1. Extraer entidades clínicas
    const entitiesStart = Date.now();
    const entities = await this.extractClinicalEntities(transcript, options.useRAG || false);
    const entitiesTime = Date.now() - entitiesStart;
    
    // 2. Generar notas SOAP
    const soapStart = Date.now();
    const soapNotes = await this.generateSOAPNotes(transcript, entities, options.useRAG || false);
    const soapTime = Date.now() - soapStart;
    
    const totalTime = Date.now() - startTime;
    const ragTime = options.useRAG ? Math.floor(totalTime * 0.3) : 0; // Simular tiempo RAG
    
    return {
      entities,
      soapNotes,
      ragUsed: options.useRAG || false,
      metrics: {
        total_processing_time_ms: totalTime,
        entities_extraction_time_ms: entitiesTime,
        soap_generation_time_ms: soapTime,
        rag_time_ms: ragTime,
        overall_confidence: this.calculateOverallConfidence(entities, soapNotes),
        requires_review: entities.length < 3 || (soapNotes.confidence_score || 0) < 0.7
      }
    };
  }
  
  /**
   * Extrae entidades clínicas del texto
   */
  static async extractClinicalEntities(transcript: string, useRAG: boolean = false): Promise<ClinicalEntity[]> {
    const prompt = `
Analiza la siguiente transcripción médica y extrae entidades clínicas importantes.
Identifica síntomas, diagnósticos, tratamientos, medicamentos, anatomía y mediciones.

TRANSCRIPCIÓN:
${transcript}

Responde en formato JSON con el siguiente esquema:
{
  "entities": [
    {
      "text": "dolor cervical",
      "type": "symptom", 
      "confidence": 0.95
    }
  ]
}

TIPOS VÁLIDOS: symptom, diagnosis, treatment, medication, anatomy, measurement, temporal
`;

    try {
      const response = await ollamaNode.generateCompletion(prompt, {
        temperature: 0.1,
        max_tokens: 1000
      });
      
      // Parsear respuesta JSON
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.entities || [];
      }
      
      // Fallback: entidades básicas extraídas por regex
      return this.extractEntitiesBasic(transcript);
      
    } catch (error) {
      console.error('Error extrayendo entidades:', error);
      return this.extractEntitiesBasic(transcript);
    }
  }
  
  /**
   * Genera notas SOAP con opcional enriquecimiento RAG
   */
  static async generateSOAPNotes(
    transcript: string, 
    entities: ClinicalEntity[], 
    useRAG: boolean = false
  ): Promise<SOAPNotes> {
    
    let ragContext = '';
    
    // Si RAG está habilitado, buscar evidencia científica
    if (useRAG && entities.length > 0) {
      console.log('🔬 Buscando evidencia científica con RAG...');
      
      const symptoms = entities.filter(e => e.type === 'symptom' || e.type === 'diagnosis');
      if (symptoms.length > 0) {
        const query = `${symptoms.map(s => s.text).join(' ')} evidence based treatment physiotherapy`;
        
        try {
          const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(query, 'fisioterapia', 3);
          
          if (ragResult.citations.length > 0) {
            ragContext = `\n\nEVIDENCIA CIENTÍFICA DISPONIBLE:
${ragResult.medical_context}

REFERENCIAS:
${ragResult.citations.slice(0, 2).map(c => 
  `- ${c.title} (${c.authors}, ${c.journal} ${c.year})`
).join('\n')}`;
          }
        } catch (error) {
          console.warn('Error en búsqueda RAG:', error);
        }
      }
    }
    
    const prompt = `
Genera notas SOAP profesionales basadas en la siguiente transcripción de fisioterapia.

TRANSCRIPCIÓN:
${transcript}

ENTIDADES IDENTIFICADAS:
${entities.map(e => `- ${e.type}: ${e.text}`).join('\n')}${ragContext}

Genera notas SOAP estructuradas y profesionales:

SUBJECTIVE:
[Información reportada por el paciente]

OBJECTIVE:
[Hallazgos clínicos objetivos y evaluación física]

ASSESSMENT:
[Análisis clínico y diagnóstico]

PLAN:
[Plan de tratamiento detallado${useRAG ? ' basado en evidencia científica' : ''}]
`;

    try {
      const response = await ollamaNode.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 1500
      });
      
      return this.parseSOAPFromResponse(response.response, useRAG);
      
    } catch (error) {
      console.error('Error generando SOAP:', error);
      return this.generateBasicSOAP(transcript, useRAG);
    }
  }
  
  /**
   * Extracción básica de entidades por regex
   */
  private static extractEntitiesBasic(transcript: string): ClinicalEntity[] {
    const entities: ClinicalEntity[] = [];
    
    // Patrones básicos
    const patterns = {
      symptom: /dolor|molestia|rigidez|inflamación|contractura|debilidad/gi,
      anatomy: /cervical|lumbar|rodilla|hombro|trapecio|cuádriceps|columna/gi,
      measurement: /\d+\/10|\d+\s*grados|\d+\s*años/gi,
      treatment: /fisioterapia|ejercicios|terapia manual|movilización|estiramiento/gi
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = transcript.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match.toLowerCase(),
            type: type as ClinicalEntity['type'],
            confidence: 0.8
          });
        });
      }
    }
    
    return entities;
  }
  
  /**
   * Parsea respuesta SOAP del LLM
   */
  private static parseSOAPFromResponse(response: string, hasRAG: boolean): SOAPNotes {
    const sections = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    };
    
    // Extraer secciones SOAP
    const subjectiveMatch = response.match(/SUBJECTIVE:?\s*(.*?)(?=OBJECTIVE:|$)/is);
    const objectiveMatch = response.match(/OBJECTIVE:?\s*(.*?)(?=ASSESSMENT:|$)/is);
    const assessmentMatch = response.match(/ASSESSMENT:?\s*(.*?)(?=PLAN:|$)/is);
    const planMatch = response.match(/PLAN:?\s*(.*?)$/is);
    
    if (subjectiveMatch) sections.subjective = subjectiveMatch[1].trim();
    if (objectiveMatch) sections.objective = objectiveMatch[1].trim();
    if (assessmentMatch) sections.assessment = assessmentMatch[1].trim();
    if (planMatch) sections.plan = planMatch[1].trim();
    
    // Calcular confianza basada en completitud
    const completeness = Object.values(sections).filter(s => s.length > 10).length / 4;
    const ragBonus = hasRAG ? 0.1 : 0;
    
    return {
      ...sections,
      confidence_score: Math.min(completeness + ragBonus, 1.0)
    };
  }
  
  /**
   * Genera SOAP básico de fallback
   */
  private static generateBasicSOAP(transcript: string, hasRAG: boolean): SOAPNotes {
    return {
      subjective: 'Paciente reporta síntomas según transcripción.',
      objective: 'Evaluación física documentada en sesión.',
      assessment: 'Análisis clínico basado en hallazgos objetivos.',
      plan: `Plan de tratamiento ${hasRAG ? 'basado en evidencia científica' : 'según evaluación clínica'}.`,
      confidence_score: hasRAG ? 0.6 : 0.5
    };
  }
  
  /**
   * Calcula confianza general del procesamiento
   */
  private static calculateOverallConfidence(entities: ClinicalEntity[], soap: SOAPNotes): number {
    const entityConfidence = entities.length > 0 
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length 
      : 0.5;
    
    const soapConfidence = soap.confidence_score || 0.5;
    
    return (entityConfidence + soapConfidence) / 2;
  }
} 