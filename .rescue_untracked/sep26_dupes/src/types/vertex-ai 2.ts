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

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  additionalNotes?: string;
  followUp?: string;
  precautions?: string;
  referrals?: string;
}

export interface PhysicalExamResult {
  testName: string;
  result: 'positive' | 'negative' | 'inconclusive';
  notes?: string;
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
