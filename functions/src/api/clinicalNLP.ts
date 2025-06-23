/**
 * 🧠 CLINICAL NLP API - GOOGLE CLOUD HEALTHCARE
 * Extracción de Entidades Clínicas para análisis de transcripciones
 * Integración con Google Cloud Healthcare NLP API
 */

import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as admin from "firebase-admin";

// Google Cloud Healthcare NLP client (production setup)
// TODO: Install @google-cloud/healthcare package for production
// const healthcare = new HealthcareServiceClient();

// Función lazy para obtener Firestore (se inicializa cuando se necesita)
const getDb = () => admin.firestore();

// === TIPOS Y INTERFACES ===
interface ClinicalEntity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
  metadata?: EntityMetadata;
}

interface EntityMetadata {
  vocabularyCode?: string;
  preferredTerm?: string;
  description?: string;
}

type EntityType =
  | "SYMPTOM"           // Síntomas (dolor de cabeza, fiebre)
  | "MEDICATION"        // Medicamentos (paracetamol, ibuprofeno)
  | "ANATOMY"           // Anatomía (corazón, pulmón, brazo)
  | "CONDITION"         // Condiciones (diabetes, hipertensión)
  | "PROCEDURE"         // Procedimientos (cirugía, biopsia)
  | "TEST"              // Exámenes (radiografía, análisis de sangre)
  | "DOSAGE"            // Dosificaciones (500mg, dos veces al día)
  | "TEMPORAL"          // Referencias temporales (ayer, hace una semana)
  | "SEVERITY"          // Severidad (leve, severo, agudo)
  | "OTHER";            // Otros términos médicos

interface AnalysisRequest {
  text: string;
  sessionId: string;
  patientId: string;
  language?: "es" | "en";
  options?: {
    includeConfidenceThreshold?: number;
    enableMedicationExtraction?: boolean;
    enableSymptomExtraction?: boolean;
    enableAnatomyExtraction?: boolean;
  };
}

interface AnalysisResponse {
  success: boolean;
  sessionId: string;
  entities: ClinicalEntity[];
  processingTime: number;
  charactersProcessed: number;
  costEstimate: number; // Estimación de costo en USD
  error?: string;
}

// === CONFIGURACIÓN DE GOOGLE CLOUD HEALTHCARE NLP ===
const HEALTHCARE_CONFIG = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "aiduxcare-mvp-prod",
  location: "us-central1",
  dataset: "aiduxcare-nlp-dataset",
  fhirStore: "aiduxcare-fhir-store",
  // Costo aproximado por 1000 caracteres (actualizar según pricing actual)
  costPer1000Chars: 0.0005, // $0.0005 USD por 1000 caracteres
};

// === SIMULACIÓN DE ENTIDADES PARA MVP ===
// Esta función simula la respuesta de Google Cloud Healthcare NLP
// TODO: Reemplazar con llamada real a la API en producción
const simulateGoogleHealthcareNLP = async (text: string): Promise<ClinicalEntity[]> => {
  // Simular delay de API real
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

  const entities: ClinicalEntity[] = [];

  // Patrones para diferentes tipos de entidades en español
  const entityPatterns = {
    SYMPTOM: [
      /dolor\s+de\s+(\w+)/gi,
      /fiebre/gi,
      /náuseas?/gi,
      /mareos?/gi,
      /cansancio/gi,
      /fatiga/gi,
      /malestar/gi,
      /inflamación/gi,
    ],
    MEDICATION: [
      /paracetamol/gi,
      /ibuprofeno/gi,
      /aspirina/gi,
      /omeprazol/gi,
      /simvastatina/gi,
      /metformina/gi,
      /losartán/gi,
    ],
    ANATOMY: [
      /cabeza/gi,
      /corazón/gi,
      /pulmones?/gi,
      /estómago/gi,
      /brazo/gi,
      /pierna/gi,
      /espalda/gi,
      /pecho/gi,
      /abdomen/gi,
    ],
    CONDITION: [
      /diabetes/gi,
      /hipertensión/gi,
      /asma/gi,
      /artritis/gi,
      /migraña/gi,
      /ansiedad/gi,
      /depresión/gi,
    ],
    DOSAGE: [
      /\d+\s*mg/gi,
      /\d+\s*gramos?/gi,
      /una\s+vez\s+al\s+día/gi,
      /dos\s+veces\s+al\s+día/gi,
      /cada\s+\d+\s+horas/gi,
    ],
    TEMPORAL: [
      /ayer/gi,
      /hace\s+una?\s+semana/gi,
      /hace\s+un?\s+mes/gi,
      /desde\s+hace/gi,
      /por\s+la\s+mañana/gi,
      /por\s+la\s+noche/gi,
    ],
  };

  // Buscar entidades en el texto
  Object.entries(entityPatterns).forEach(([type, patterns]) => {
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const entity: ClinicalEntity = {
          id: uuidv4(),
          text: match[0],
          type: type as EntityType,
          confidence: 0.7 + Math.random() * 0.3, // Confianza entre 70-100%
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          metadata: {
            preferredTerm: match[0].toLowerCase(),
            description: `Entidad médica detectada: ${type.toLowerCase()}`,
          },
        };
        entities.push(entity);
      }
    });
  });

  return entities;
};

// === ENDPOINT PRINCIPAL ===
export const analyzeClinicalEntities = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    // Validar y extraer datos de la request
    const {
      text,
      sessionId,
      patientId,
      language = "es",
      options = {},
    }: AnalysisRequest = req.body;

    // Validaciones básicas
    if (!text || !sessionId || !patientId) {
      res.status(400).json({
        success: false,
        error: "Faltan parámetros requeridos: text, sessionId, patientId",
      });
      return;
    }

    // Validar longitud del texto (límite para control de costos)
    const MAX_TEXT_LENGTH = 5000; // 5000 caracteres máximo
    if (text.length > MAX_TEXT_LENGTH) {
      res.status(400).json({
        success: false,
        error: `Texto demasiado largo. Máximo ${MAX_TEXT_LENGTH} caracteres. Recibido: ${text.length}`,
      });
      return;
    }

    const charactersProcessed = text.length;
    const costEstimate = (charactersProcessed / 1000) * HEALTHCARE_CONFIG.costPer1000Chars;

    // Log de auditoría - Control de costos
    console.log("💰 [COST TRACKING] Análisis de entidades iniciado:", {
      sessionId,
      patientId,
      charactersProcessed,
      costEstimateUSD: costEstimate,
      timestamp: new Date().toISOString(),
    });

    // Log en Firestore para tracking de costos
    await getDb().collection("nlp_usage_logs").add({
      sessionId,
      patientId,
      charactersProcessed,
      costEstimate,
      language,
      timestamp: new Date(),
      type: "clinical_entities_analysis",
    });

    console.log("🧠 Iniciando análisis de entidades clínicas...");
    console.log(`📊 Texto a procesar: ${charactersProcessed} caracteres`);
    console.log(`🌍 Idioma: ${language}`);
    console.log(`💰 Costo estimado: $${costEstimate.toFixed(4)} USD`);

    // TODO: Llamada real a Google Cloud Healthcare NLP API
    // const parent = `projects/${HEALTHCARE_CONFIG.projectId}/locations/${HEALTHCARE_CONFIG.location}`;
    // const request = {
    //   parent,
    //   documentContent: text,
    //   licenseCode: 'GOOGLE_CLOUD_HEALTHCARE_API'
    // };
    // const [response] = await healthcare.projects.locations.services.nlp.analyzeEntities(request);

    // Por ahora, usar simulación para MVP
    const entities = await simulateGoogleHealthcareNLP(text);

    console.log(`✅ Análisis completado: ${entities.length} entidades encontradas`);

    // Filtrar por threshold de confianza si se especifica
    const confidenceThreshold = options.includeConfidenceThreshold || 0.7;
    const filteredEntities = entities.filter((entity) => entity.confidence >= confidenceThreshold);

    console.log(`🎯 Entidades filtradas por confianza (>=${confidenceThreshold}): ${filteredEntities.length}`);

    const processingTime = Date.now() - startTime;

    // Guardar análisis en Firestore
    await saveAnalysisToFirestore({
      sessionId,
      patientId,
      entities: filteredEntities,
      processingTime,
      charactersProcessed,
      costEstimate,
      language,
    });

    // Log de métricas por tipo de entidad
    const entityCounts = filteredEntities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("📈 Métricas de entidades por tipo:", entityCounts);

    // Respuesta exitosa
    const response: AnalysisResponse = {
      success: true,
      sessionId,
      entities: filteredEntities,
      processingTime,
      charactersProcessed,
      costEstimate,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error en análisis de entidades clínicas:", error);

    const processingTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Error interno del servidor",
      processingTime,
    });
  }
};

// === GUARDAR ANÁLISIS EN FIRESTORE ===
async function saveAnalysisToFirestore({
  sessionId,
  patientId,
  entities,
  processingTime,
  charactersProcessed,
  costEstimate,
  language,
}: {
  sessionId: string;
  patientId: string;
  entities: ClinicalEntity[];
  processingTime: number;
  charactersProcessed: number;
  costEstimate: number;
  language: string;
}): Promise<void> {
  try {
    await getDb().collection("clinical_analyses").add({
      sessionId,
      patientId,
      entities,
      processingTime,
      charactersProcessed,
      costEstimate,
      language,
      createdAt: new Date(),
      totalEntities: entities.length,
      entityTypes: [...new Set(entities.map((e) => e.type))],
      averageConfidence: entities.length > 0
        ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
        : 0,
    });

    console.log("💾 Análisis guardado en Firestore correctamente");
  } catch (error) {
    console.error("❌ Error al guardar análisis en Firestore:", error);
    throw error;
  }
}

// === ENDPOINT PARA OBTENER ANÁLISIS GUARDADO ===
export const getClinicalAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: "sessionId es requerido",
      });
      return;
    }

    const snapshot = await getDb().collection("clinical_analyses")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({
        success: false,
        error: "No se encontró análisis para la sesión especificada",
      });
      return;
    }

    const analysisDoc = snapshot.docs[0];
    const analysisData = analysisDoc.data();

    res.status(200).json({
      success: true,
      id: analysisDoc.id,
      ...analysisData,
    });
  } catch (error) {
    console.error("❌ Error al obtener análisis clínico:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// === ENDPOINT PARA ESTADÍSTICAS DE USO Y COSTOS ===
export const getNLPUsageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe = "24h" } = req.query;

    // Calcular fecha de inicio según timeframe
    const startDate = new Date();
    switch (timeframe) {
    case "1h":
      startDate.setHours(startDate.getHours() - 1);
      break;
    case "24h":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 1);
    }

    const snapshot = await getDb().collection("nlp_usage_logs")
      .where("timestamp", ">=", startDate)
      .get();

    const logs = snapshot.docs.map((doc) => doc.data());

    const stats = {
      totalCalls: logs.length,
      totalCharactersProcessed: logs.reduce((sum, log) => sum + (log.charactersProcessed || 0), 0),
      totalCostEstimate: logs.reduce((sum, log) => sum + (log.costEstimate || 0), 0),
      averageCharactersPerCall: logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.charactersProcessed || 0), 0) / logs.length
        : 0,
      timeframe,
      periodStart: startDate.toISOString(),
      periodEnd: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas de uso:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};
