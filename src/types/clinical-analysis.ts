// @ts-nocheck
/**
 * @fileoverview Clinical Analysis Types - Enterprise Medical Documentation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance HIPAA + GDPR + SOC 2 Type II
 */

// Core SOAP Structure as specified in prompt
export interface SOAPStructure {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    functionalLimitations: string;
    relevantHistory: string;
  };
  objective: {
    inspection: string;
    palpation: string;
    rangeOfMotion: string;
    strengthTesting: string;
    specialTests: string;
    functionalAssessment: string;
  };
  assessment: {
    primaryDiagnosis: string;
    differentialDiagnoses: string[];
    prognosis: string;
    goals: string;
  };
  plan: {
    interventions: string[];
    homeExercises: string;
    followUp: string;
    patientEducation: string;
    nextSession: string;
  };
  qualityScore: number;
  reviewRequired: boolean;
  clinicalComments: string[];
}

// Clinical Insights for input to SOAP generation
export interface ClinicalInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'diagnosis' | 'treatment' | 'differential' | 'intervention' | 'education' | 'exercise' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  evidence?: {
    source: string;
    url?: string;
    publicationDate?: string;
  };
}

// Structured clinical symptoms and signs for analysis
export interface ClinicalSymptom {
  id: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  duration: string;
  frequency: 'constant' | 'intermittent' | 'episodic';
  location: string;
  radiationPattern?: string;
  aggravatingFactors: string[];
  relievingFactors: string[];
  associatedSymptoms: string[];
  confidence: number;
}

export interface ClinicalSign {
  id: string;
  name: string;
  description: string;
  finding: 'positive' | 'negative' | 'equivocal';
  examinerConfidence: number;
  clinicalSignificance: 'low' | 'medium' | 'high' | 'critical';
  bodyRegion: string;
  measurementValue?: number;
  measurementUnit?: string;
  normalRange?: {
    min: number;
    max: number;
    unit: string;
  };
}

// Functional assessment data
export interface FunctionalAssessment {
  id: string;
  assessmentType: 'range_of_motion' | 'strength' | 'balance' | 'endurance' | 'coordination' | 'functional_task';
  bodyRegion: string;
  baseline?: number;
  current: number;
  target: number;
  unit: string;
  improvementPercentage?: number;
  limitations: string[];
  recommendations: string[];
  testDate: Date;
  assessorId: string;
}

// Treatment response tracking
export interface TreatmentResponse {
  treatmentId: string;
  treatmentName: string;
  responseLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'no_response';
  painReduction?: number; // Percentage reduction
  functionalImprovement?: number; // Percentage improvement
  sideEffects: string[];
  patientCompliance: 'excellent' | 'good' | 'fair' | 'poor';
  continueTreatment: boolean;
  modifications: string[];
  assessmentDate: Date;
}

// Clinical decision support data
export interface ClinicalDecisionSupport {
  recommendedDiagnosis: string;
  diagnosticConfidence: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  recommendedTests: string[];
  recommendedTreatments: string[];
  warningsAndContraindications: string[];
  prognosisEstimate: 'excellent' | 'good' | 'fair' | 'guarded' | 'poor';
  expectedTimeToRecovery?: number; // weeks
  riskFactors: string[];
}

// Quality metrics for SOAP generation
export interface QualityMetrics {
  completenessScore: number; // 0-100
  accuracyScore: number; // 0-100
  clinicalRelevanceScore: number; // 0-100
  evidenceQualityScore: number; // 0-100
  overallQualityScore: number; // 0-100
  reviewRequired: boolean;
  qualityFlags: string[];
  improvementSuggestions: string[];
}

// Comprehensive clinical analysis result
export interface ClinicalAnalysisResult {
  analysisId: string;
  patientId: string;
  sessionId: string;
  analysisDate: Date;
  symptoms: ClinicalSymptom[];
  signs: ClinicalSign[];
  functionalAssessments: FunctionalAssessment[];
  treatmentResponses: TreatmentResponse[];
  decisionSupport: ClinicalDecisionSupport;
  qualityMetrics: QualityMetrics;
  generatedSOAP: SOAPStructure;
  clinicalNotes: string;
  followUpRecommendations: string[];
}

// Input data structure for SOAP generation service
export interface SOAPGenerationInput {
  patientId: string;
  sessionId: string;
  userId: string;
  clinicalEntities: import('./nlp').ClinicalEntity[];
  insights: ClinicalInsight[];
  symptoms?: ClinicalSymptom[];
  signs?: ClinicalSign[];
  functionalData?: FunctionalAssessment[];
  treatmentHistory?: TreatmentResponse[];
  sessionContext?: {
    sessionType: 'initial' | 'follow_up' | 'discharge';
    sessionDuration: number;
    clinicalFocus: string[];
  };
}

// Clinical comment structure
export interface ClinicalComment {
  section: 'subjective' | 'objective' | 'assessment' | 'plan';
  comment: string;
  confidence: number;
  clinicalJustification: string;
}

// Comprehensive result from SOAP generation service
export interface SOAPGenerationResult {
  soap: SOAPStructure;
  clinicalComments: ClinicalComment[];
  qualityScore: number;
  reviewRequired: boolean;
  complianceFlags: string[];
  processingTime: number;
  analysisMetadata: {
    entitiesProcessed: number;
    insightsProcessed: number;
    averageConfidence: number;
    criticalFindingsCount: number;
  };
}

// Error handling types
export interface ClinicalAnalysisError {
  errorCode: string;
  errorMessage: string;
  errorDetails: Record<string, unknown>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestedActions: string[];
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ClinicalAnalysisError[];
  warnings: string[];
  suggestions: string[];
  validationScore: number;
}

// Type guards for runtime validation
export function isValidSOAPStructure(soap: unknown): soap is SOAPStructure {
  if (!soap || typeof soap !== 'object') return false;
  
  const s = soap as Record<string, unknown>;
  return (
    typeof s.subjective === 'object' &&
    typeof s.objective === 'object' &&
    typeof s.assessment === 'object' &&
    typeof s.plan === 'object' &&
    typeof s.qualityScore === 'number' &&
    typeof s.reviewRequired === 'boolean' &&
    Array.isArray(s.clinicalComments)
  );
}

export function isValidClinicalInsight(insight: unknown): insight is ClinicalInsight {
  if (!insight || typeof insight !== 'object') return false;
  
  const i = insight as Record<string, unknown>;
  return (
    typeof i.id === 'string' &&
    typeof i.title === 'string' &&
    typeof i.description === 'string' &&
    typeof i.confidence === 'number' &&
    i.confidence >= 0 && i.confidence <= 1 &&
    typeof i.category === 'string' &&
    typeof i.severity === 'string' &&
    i.timestamp instanceof Date
  );
}

export function isValidClinicalSymptom(symptom: unknown): symptom is ClinicalSymptom {
  if (!symptom || typeof symptom !== 'object') return false;
  
  const s = symptom as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.description === 'string' &&
    typeof s.severity === 'string' &&
    typeof s.duration === 'string' &&
    typeof s.frequency === 'string' &&
    typeof s.location === 'string' &&
    Array.isArray(s.aggravatingFactors) &&
    Array.isArray(s.relievingFactors) &&
    Array.isArray(s.associatedSymptoms) &&
    typeof s.confidence === 'number'
  );
}

// Constants for clinical analysis
export const QUALITY_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 70,
  POOR: 60,
  CRITICAL: 50
} as const;

export const CONFIDENCE_LEVELS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4
} as const;

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const CLINICAL_CATEGORIES = ['diagnosis', 'treatment', 'differential', 'intervention', 'education', 'exercise', 'warning'] as const;