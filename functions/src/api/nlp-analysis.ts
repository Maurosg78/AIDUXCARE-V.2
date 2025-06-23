/**
 * 🧠 NLP ANALYSIS API - GOOGLE CLOUD HEALTHCARE NLP
 * Endpoint para análisis de entidades médicas - Prioridad #4
 * Procesa transcripciones y extrae entidades clínicas estructuradas
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import { healthcare } from '@googleapis/healthcare';
import { GoogleAuth } from 'google-auth-library';

// === CONFIGURACIÓN REAL DE GOOGLE CLOUD HEALTHCARE NLP ===
const initializeHealthcareClient = () => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-mvp-prod';
    
    // Autenticación automática para Google Cloud Functions
    // En producción, Google Cloud Functions maneja la autenticación automáticamente
    const auth = new GoogleAuth();

    // Inicializar cliente de Healthcare API con la autenticación explícita
    const healthcareClient = healthcare({
      version: 'v1beta1',
      auth: auth as any,
    });

    console.log(`✅ Healthcare NLP Client inicializado explícitamente para proyecto: ${projectId}`);
    return healthcareClient;
  } catch (error) {
    console.error('❌ Error inicializando Healthcare Client explícitamente:', error);
    throw new Error(`Error de configuración de Google Cloud Healthcare: ${error}`);
  }
};

// Inicializar cliente global
const healthcareClient = initializeHealthcareClient();

// === INTERFACES PARA ENTIDADES MÉDICAS ===
interface MedicalEntity {
  id: string;
  text: string;
  category: 'SYMPTOM' | 'MEDICATION' | 'BODY_PART' | 'CONDITION' | 'TREATMENT' | 
           'VITAL_SIGN' | 'TEMPORAL' | 'SEVERITY' | 'FREQUENCY' | 'OTHER';
  confidence: number;
  startOffset: number;
  endOffset: number;
  linkedEntities?: Array<{
    entityId: string;
    textExtraction: string;
  }>;
  attributes?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

interface SOAPSection {
  section: 'SUBJECTIVE' | 'OBJECTIVE' | 'ASSESSMENT' | 'PLAN';
  content: string;
  entities: MedicalEntity[];
  confidence: number;
  speakerRole: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
}

interface NLPAnalysisResult {
  sessionId: string;
  entities: MedicalEntity[];
  soapSections: SOAPSection[];
  clinicalSummary: {
    primarySymptoms: string[];
    medications: string[];
    bodyParts: string[];
    treatments: string[];
    assessments: string[];
  };
  processingTime: number;
  overallConfidence: number;
}

// === MAPEO DE CATEGORÍAS DE ENTIDADES ===
const mapEntityCategory = (googleCategory: string): MedicalEntity['category'] => {
  const categoryMap: Record<string, MedicalEntity['category']> = {
    'SYMPTOM': 'SYMPTOM',
    'SIGN_SYMPTOM': 'SYMPTOM',
    'MEDICATION': 'MEDICATION',
    'MEDICINE': 'MEDICATION',
    'ANATOMY': 'BODY_PART',
    'BODY_PART': 'BODY_PART',
    'MEDICAL_CONDITION': 'CONDITION',
    'CONDITION': 'CONDITION',
    'MEDICAL_PROCEDURE': 'TREATMENT',
    'PROCEDURE': 'TREATMENT',
    'TREATMENT': 'TREATMENT',
    'VITAL_SIGN': 'VITAL_SIGN',
    'TIME': 'TEMPORAL',
    'TEMPORAL': 'TEMPORAL',
    'SEVERITY': 'SEVERITY',
    'FREQUENCY': 'FREQUENCY'
  };
  
  return categoryMap[googleCategory.toUpperCase()] || 'OTHER';
};

// === ANÁLISIS INTELIGENTE DE SECCIONES SOAP ===
const classifySOAPSection = (text: string, speakerRole: 'PATIENT' | 'THERAPIST' | 'UNKNOWN'): SOAPSection['section'] => {
  const subjectivePatterns = [
    /me duele/i, /siento/i, /tengo/i, /desde hace/i, /cuando/i, /dolor/i,
    /molesta/i, /incomoda/i, /no puedo/i, /dificultad/i
  ];
  
  const objectivePatterns = [
    /observo/i, /palpo/i, /examino/i, /rango de movimiento/i, /flexión/i,
    /extensión/i, /contractura/i, /inflamación visible/i, /edema/i
  ];
  
  const assessmentPatterns = [
    /diagnóstico/i, /evaluación/i, /considero/i, /parece/i, /probable/i,
    /compatible con/i, /sugiere/i, /indica/i
  ];
  
  const planPatterns = [
    /tratamiento/i, /plan/i, /recomiendo/i, /debe/i, /ejercicios/i,
    /terapia/i, /próxima sesión/i, /continuar/i, /medicación/i
  ];
  
  // Contar coincidencias
  const subjectiveScore = subjectivePatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0);
  const objectiveScore = objectivePatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0);
  const assessmentScore = assessmentPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0);
  const planScore = planPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0);
  
  // Determinar sección basada en puntuación y rol del hablante
  const scores = [
    { section: 'SUBJECTIVE' as const, score: subjectiveScore + (speakerRole === 'PATIENT' ? 2 : 0) },
    { section: 'OBJECTIVE' as const, score: objectiveScore + (speakerRole === 'THERAPIST' ? 1 : 0) },
    { section: 'ASSESSMENT' as const, score: assessmentScore + (speakerRole === 'THERAPIST' ? 2 : 0) },
    { section: 'PLAN' as const, score: planScore + (speakerRole === 'THERAPIST' ? 2 : 0) }
  ];
  
  const maxScore = Math.max(...scores.map(s => s.score));
  const bestSection = scores.find(s => s.score === maxScore);
  
  return bestSection?.section || 'SUBJECTIVE';
};

// === PROCESAMIENTO PRINCIPAL DE NLP ===
export const processNLPAnalysis = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    console.log('🧠 Iniciando análisis NLP con Google Cloud Healthcare...');
    
    // Validar datos de entrada
    const { transcriptionText, sessionId, segments } = req.body;
    
    if (!transcriptionText) {
      res.status(400).json({
        success: false,
        error: 'Texto de transcripción es requerido'
      });
      return;
    }

    const currentSessionId = sessionId || uuidv4();
    
    // === LLAMADA REAL A GOOGLE CLOUD HEALTHCARE NLP ===
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'aiduxcare-mvp-prod';
    const location = 'us-central1'; // Región donde está disponible Healthcare NLP
    
    console.log('🔄 Enviando texto a Google Cloud Healthcare NLP...');
    console.log(`📊 Texto length: ${transcriptionText.length} caracteres`);

    // El nombre completo del recurso del servicio NLP es requerido por la API
    const nlpService = `projects/${projectId}/locations/${location}/services/nlp`;

    // Realizar análisis de entidades médicas usando el endpoint correcto
    const response = await healthcareClient.projects.locations.services.nlp.analyzeEntities({
      nlpService: nlpService,
      requestBody: {
        documentContent: transcriptionText,
      },
    });
    
    if (!response.data || !response.data.entities) {
      console.log('⚠️ No se encontraron entidades médicas');
      res.json({
        success: true,
        data: {
          sessionId: currentSessionId,
          entities: [],
          soapSections: [],
          clinicalSummary: {
            primarySymptoms: [],
            medications: [],
            bodyParts: [],
            treatments: [],
            assessments: []
          },
          processingTime: Date.now() - startTime,
          overallConfidence: 0
        }
      });
      return;
    }

    // === PROCESAMIENTO DE ENTIDADES ===
    const entities: MedicalEntity[] = [];
    let totalConfidence = 0;

    response.data.entities.forEach((entity: any, index: number) => {
      const medicalEntity: MedicalEntity = {
        id: `entity_${currentSessionId}_${index}`,
        text: entity.mentionText || '',
        category: mapEntityCategory(entity.type || 'OTHER'),
        confidence: entity.confidence || 0.5,
        startOffset: entity.mentionId?.beginOffset || 0,
        endOffset: entity.mentionId?.endOffset || 0,
        linkedEntities: entity.linkedEntities?.map((linked: any) => ({
          entityId: linked.entityId || '',
          textExtraction: linked.textExtraction || ''
        })) || [],
        attributes: entity.attributes?.map((attr: any) => ({
          type: attr.type || '',
          value: attr.value || '',
          confidence: attr.confidence || 0.5
        })) || []
      };

      entities.push(medicalEntity);
      totalConfidence += medicalEntity.confidence;
    });

    // === ANÁLISIS DE SECCIONES SOAP ===
    const soapSections: SOAPSection[] = [];
    
    if (segments && Array.isArray(segments)) {
      segments.forEach((segment: any) => {
        const speakerRole = segment.speaker?.role || 'UNKNOWN';
        const soapSection = classifySOAPSection(segment.text, speakerRole);
        
        // Filtrar entidades relevantes para este segmento
        const segmentEntities = entities.filter(entity => 
          entity.startOffset >= segment.startOffset && 
          entity.endOffset <= segment.endOffset
        );

        soapSections.push({
          section: soapSection,
          content: segment.text,
          entities: segmentEntities,
          confidence: segment.confidence || 0.5,
          speakerRole: speakerRole
        });
      });
    }

    // === RESUMEN CLÍNICO ===
    const clinicalSummary = {
      primarySymptoms: entities
        .filter(e => e.category === 'SYMPTOM')
        .map(e => e.text)
        .slice(0, 5),
      medications: entities
        .filter(e => e.category === 'MEDICATION')
        .map(e => e.text),
      bodyParts: entities
        .filter(e => e.category === 'BODY_PART')
        .map(e => e.text),
      treatments: entities
        .filter(e => e.category === 'TREATMENT')
        .map(e => e.text),
      assessments: soapSections
        .filter(s => s.section === 'ASSESSMENT')
        .map(s => s.content)
    };

    const result: NLPAnalysisResult = {
      sessionId: currentSessionId,
      entities,
      soapSections,
      clinicalSummary,
      processingTime: Date.now() - startTime,
      overallConfidence: entities.length > 0 ? totalConfidence / entities.length : 0
    };

    // === GUARDAR EN FIRESTORE ===
    const db = admin.firestore();
    await db.collection('nlp-analysis').doc(currentSessionId).set({
      ...result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    console.log(`✅ Análisis NLP completado en ${result.processingTime}ms`);
    console.log(`📊 Entidades: ${entities.length}, Secciones SOAP: ${soapSections.length}`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error en análisis NLP:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error procesando análisis NLP',
      details: error instanceof Error ? error.message : 'Error desconocido',
      processingTime: Date.now() - startTime
    });
  }
};

// === ENDPOINT DE ESTADO ===
export const getNLPAnalysisStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const db = admin.firestore();
    const doc = await db.collection('nlp-analysis').doc(sessionId).get();
    
    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Análisis NLP no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: doc.data()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estado NLP:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado de análisis NLP'
    });
  }
}; 