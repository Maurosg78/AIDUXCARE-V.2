/**
 * AI: SERVICIO VERTEX AI - GEMINI 1.5 PRO
 * Procesamiento avanzado de lenguaje natural médico con IA de última generación
 */

import { VertexAI } from '@google-cloud/vertexai';

export interface MedicalAnalysisRequest {
  text: string;
  context?: string;
  specialty?: 'orthopedics' | 'neurology' | 'cardiology' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
}

export interface MedicalAnalysisResponse {
  sessionId: string;
  entities: MedicalEntity[];
  soapSections: SOAPSection[];
  clinicalSummary: ClinicalSummary;
  riskAssessment: RiskAssessment;
  recommendations: Recommendation[];
  confidence: number;
  processingTime: number;
  modelUsed: string;
  tokensUsed: number;
}

export interface MedicalEntity {
  text: string;
  type: 'SYMPTOM' | 'DIAGNOSIS' | 'MEDICATION' | 'PROCEDURE' | 'BODY_PART' | 'VITAL_SIGN' | 'LAB_RESULT';
  confidence: number;
  startOffset: number;
  endOffset: number;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
}

export interface EntityAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface EntityRelationship {
  targetEntity: string;
  relationship: string;
  confidence: number;
}

export interface SOAPSection {
  type: 'SUBJECTIVE' | 'OBJECTIVE' | 'ASSESSMENT' | 'PLAN';
  content: string;
  entities: string[];
  confidence: number;
  reasoning: string;
}

export interface ClinicalSummary {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  comorbidities: string[];
  riskFactors: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
}

export interface Recommendation {
  type: 'diagnostic' | 'therapeutic' | 'preventive' | 'referral';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  confidence: number;
}

export class VertexAIService {
  private vertexAI: VertexAI;
  private model: any;
  private projectId: string;
  private location: string;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'aiduxcare-mvp-prod';
    this.location = 'us-central1';
    
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });

    this.model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generation_config: {
        max_output_tokens: 8192,
        temperature: 0.1,
        top_p: 0.8,
        top_k: 40,
      },
    });
  }

  /**
   * Análisis médico avanzado con Gemini 1.5 Pro
   */
  async analyzeMedicalText(request: MedicalAnalysisRequest): Promise<MedicalAnalysisResponse> {
    const startTime = Date.now();

    try {
      const prompt = this.buildMedicalPrompt(request);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;
      
      // Parsear respuesta estructurada
      const analysis = this.parseStructuredResponse(text);
      
      const endTime = Date.now();
      
      return {
        ...analysis,
        sessionId: request.sessionId,
        processingTime: endTime - startTime,
        modelUsed: 'gemini-1.5-pro',
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      };

    } catch (error) {
      console.error('Error en análisis médico con Vertex AI:', error);
      throw new Error(`Error de análisis médico: ${error.message}`);
    }
  }

  /**
   * Construye prompt médico especializado
   */
  private buildMedicalPrompt(request: MedicalAnalysisRequest): string {
    const specialtyContext = this.getSpecialtyContext(request.specialty);
    
    return `
Eres un asistente médico especializado en ${request.specialty || 'medicina general'} con acceso a las últimas investigaciones médicas.

ANÁLISIS MÉDICO AVANZADO
=======================

CONTEXTO ESPECIALIDAD: ${specialtyContext}

TEXTO DEL PACIENTE:
${request.text}

${request.context ? `CONTEXTO ADICIONAL: ${request.context}` : ''}

INSTRUCCIONES:
1. Analiza el texto usando criterios médicos actualizados
2. Identifica entidades médicas con precisión clínica
3. Genera secciones SOAP detalladas con razonamiento
4. Evalúa riesgos y urgencia clínica
5. Proporciona recomendaciones basadas en evidencia

RESPONDE EN FORMATO JSON ESTRUCTURADO:
{
  "entities": [
    {
      "text": "texto de la entidad",
      "type": "SYMPTOM|DIAGNOSIS|MEDICATION|PROCEDURE|BODY_PART|VITAL_SIGN|LAB_RESULT",
      "confidence": 0.95,
      "startOffset": 0,
      "endOffset": 10,
      "attributes": [
        {"name": "severity", "value": "moderate", "confidence": 0.9}
      ],
      "relationships": [
        {"targetEntity": "otra_entidad", "relationship": "causes", "confidence": 0.8}
      ]
    }
  ],
  "soapSections": [
    {
      "type": "SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN",
      "content": "contenido detallado",
      "entities": ["entidad1", "entidad2"],
      "confidence": 0.9,
      "reasoning": "razonamiento clínico"
    }
  ],
  "clinicalSummary": {
    "primaryDiagnosis": "diagnóstico principal",
    "differentialDiagnoses": ["diagnóstico1", "diagnóstico2"],
    "severity": "mild|moderate|severe|critical",
    "urgency": "routine|urgent|emergency",
    "comorbidities": ["comorbilidad1"],
    "riskFactors": ["factor_riesgo1"]
  },
  "riskAssessment": {
    "overallRisk": "low|medium|high|critical",
    "riskFactors": [
      {
        "factor": "factor de riesgo",
        "severity": "low|medium|high",
        "evidence": "evidencia clínica"
      }
    ],
    "recommendations": ["recomendación1"]
  },
  "recommendations": [
    {
      "type": "diagnostic|therapeutic|preventive|referral",
      "description": "descripción detallada",
      "priority": "low|medium|high|critical",
      "evidence": "evidencia científica",
      "confidence": 0.9
    }
  ],
  "confidence": 0.95
}

IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional.
    `;
  }

  /**
   * Obtiene contexto de especialidad médica
   */
  private getSpecialtyContext(specialty?: string): string {
    const contexts = {
      orthopedics: 'Especialista en traumatología y ortopedia. Enfoque en lesiones musculoesqueléticas, fracturas, artritis, y rehabilitación.',
      neurology: 'Especialista en neurología. Enfoque en trastornos del sistema nervioso, dolor neuropático, y condiciones neurológicas.',
      cardiology: 'Especialista en cardiología. Enfoque en enfermedades cardiovasculares, arritmias, y factores de riesgo cardíaco.',
      general: 'Médico general con amplia experiencia en diagnóstico diferencial y manejo integral del paciente.'
    };

    return contexts[specialty as keyof typeof contexts] || contexts.general;
  }

  /**
   * Parsea respuesta estructurada del modelo
   */
  private parseStructuredResponse(text: string): Omit<MedicalAnalysisResponse, 'sessionId' | 'processingTime' | 'modelUsed' | 'tokensUsed'> {
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        entities: parsed.entities || [],
        soapSections: parsed.soapSections || [],
        clinicalSummary: parsed.clinicalSummary || {
          primaryDiagnosis: '',
          differentialDiagnoses: [],
          severity: 'mild',
          urgency: 'routine',
          comorbidities: [],
          riskFactors: []
        },
        riskAssessment: parsed.riskAssessment || {
          overallRisk: 'low',
          riskFactors: [],
          recommendations: []
        },
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.8
      };

    } catch (error) {
      console.error('Error parseando respuesta estructurada:', error);
      
      // Respuesta de fallback
      return {
        entities: [],
        soapSections: [],
        clinicalSummary: {
          primaryDiagnosis: 'Análisis no disponible',
          differentialDiagnoses: [],
          severity: 'mild',
          urgency: 'routine',
          comorbidities: [],
          riskFactors: []
        },
        riskAssessment: {
          overallRisk: 'low',
          riskFactors: [],
          recommendations: ['Consultar con médico especialista']
        },
        recommendations: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Análisis de múltiples casos en lote
   */
  async analyzeBatch(requests: MedicalAnalysisRequest[]): Promise<MedicalAnalysisResponse[]> {
    const results: MedicalAnalysisResponse[] = [];
    
    // Procesar en lotes para optimizar uso de tokens
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(request => this.analyzeMedicalText(request))
      );
      
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : this.createFallbackResponse(batch[0])
      ));
      
      // Pausa entre lotes para evitar rate limiting
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Crea respuesta de fallback
   */
  private createFallbackResponse(request: MedicalAnalysisRequest): MedicalAnalysisResponse {
    return {
      sessionId: request.sessionId,
      entities: [],
      soapSections: [],
      clinicalSummary: {
        primaryDiagnosis: 'Análisis temporalmente no disponible',
        differentialDiagnoses: [],
        severity: 'mild',
        urgency: 'routine',
        comorbidities: [],
        riskFactors: []
      },
      riskAssessment: {
        overallRisk: 'low',
        riskFactors: [],
        recommendations: ['Reintentar análisis o consultar manualmente']
      },
      recommendations: [],
      confidence: 0.3,
      processingTime: 0,
      modelUsed: 'fallback',
      tokensUsed: 0
    };
  }
} 