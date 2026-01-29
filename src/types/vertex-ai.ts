// src/types/vertex-ai.ts

export interface ClinicalEntity {
  id: string;
  text: string;
  type: 'symptom' | 'condition' | 'medication' | 'history' | 'other';
  clinicalRelevance: 'critical' | 'high' | 'medium' | 'low';
}

export interface RedFlag {
  pattern: string;
  action: string;
  urgency: 'urgent' | 'high' | 'medium';
  reference?: string;
}

export interface PhysicalTest {
  name: string;
  rationale: string;
  sensitivity: number | null;
  specificity: number | null;
  reference?: string;
}

export interface OtherFlags {
  orange?: string[];  // Factores psiquiátricos
  blue?: string[];    // Factores laborales
  black?: string[];   // Factores del sistema/compensación
}

export interface ClinicalAnalysisResponse {
  entities: ClinicalEntity[];
  redFlags: RedFlag[];
  yellowFlags: string[];
  otherFlags?: OtherFlags;
  physicalTests: PhysicalTest[];
  standardizedMeasures: string[];
  additionalNotes?: string;
  modelUsed?: 'flash' | 'pro';
  requiresSelection?: boolean;
  error?: string;
  rawResponse?: string;
}

/** WO-11.1: Follow-up plan item (parseable from SOAP_NOTE.plan[]) */
export interface FollowUpPlanItem {
  id: string;
  action: string;
  status: 'completed' | 'modified' | 'deferred' | 'planned';
  notes?: string;
}

/** WO-11.1: Follow-up alert (parseable from ALERTS block) */
export interface FollowUpAlertFlag {
  label: string;
  evidence: string;
  suggested_action: string;
  urgency?: 'immediate' | 'today' | 'monitor';
}

export interface FollowUpAlerts {
  red_flags?: FollowUpAlertFlag[];
  yellow_flags?: FollowUpAlertFlag[];
  medico_legal?: FollowUpAlertFlag[];
  none?: true;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  additionalNotes?: string;
  followUp?: string;
  precautions?: string;
  referrals?: string;
  
  // ✅ DÍA 2: CPO Review Gate - Review tracking fields
  requiresReview?: boolean; // true si generado por AI (CPO requirement: AI content must be reviewed)
  isReviewed?: boolean; // true si fisio ya reviewó este SOAP
  reviewed?: {
    reviewedBy: string; // User ID del fisio que reviewó
    reviewedAt: Date; // Timestamp del review
    reviewerName?: string; // Nombre del fisio (para display)
  };
  
  // ✅ DÍA 2: AI Processing metadata (para transparency)
  aiGenerated?: boolean; // Flag que indica si fue generado por AI
  aiProcessor?: string; // Nombre del procesador AI usado (ej: "Google Vertex AI (Gemini 2.5 Flash)")
  processedAt?: Date; // Timestamp de cuando se procesó con AI
  
  // ✅ SPRINT 2: Clinical accuracy validation metadata
  validationMetadata?: {
    testedRegions: string[];
    mentionedRegions: string[];
    violations: string[];
    warnings: string[];
  };
}

export interface PhysicalExamResult {
  testId?: string; // Reference to MskTestDefinition.id
  testName: string;
  segment?: string; // MSK region (shoulder, knee, lumbar, etc.)
  result: 'normal' | 'positive' | 'negative' | 'inconclusive';
  notes?: string;
  findingsText?: string; // Structured findings description for SOAP
  values?: Record<string, number | string | boolean | null>; // Specific field values
}

export interface VertexAIRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
  };
}

export interface VertexAIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export type ModelType = 'flash' | 'pro';

// Agregar el tipo 'test' que falta
export type EntityType = 'condition' | 'symptom' | 'medication' | 'history' | 'test' | 'other';
