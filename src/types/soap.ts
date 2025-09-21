// Tipos para SOAP profesional - NO ANY
export interface PatientData {
  id: string;
  nombre: string;
  edad: number;
  diagnosticoPrevio?: string;
  fechaNacimiento?: string;
  historialClinico?: string[];
}

export interface ClinicalEntity {
  id: string;
  name: string;
  type: 'symptom' | 'medication' | 'condition';
  severity?: number;
  duration?: string;
  selected: boolean;
}

export interface PhysicalTestResult {
  id: string;
  name: string;
  result: 'positive' | 'negative' | 'pending';
  values?: {
    time?: number;
    assistance?: string;
    walkingAid?: string;
    [key: string]: string | number | undefined;
  };
  interpretation?: string;
  completedAt: Date;
}

export interface AnalysisResults {
  entities: ClinicalEntity[];
  redFlags: string[];
  yellowFlags: string[];
  psychosocialFactors: string[];
  clinicalReasoning: string;
}

export interface SOAPSection {
  content: string;
  editable: boolean;
  validated: boolean;
  modifiedBy?: string;
  modifiedAt?: Date;
}

export interface SubjectiveSection extends SOAPSection {
  chiefComplaint: string;
  symptoms: string[];
  medications: string[];
  painScale?: number;
  functionalLimitations: string[];
  patientGoals: string;
}

export interface ObjectiveSection extends SOAPSection {
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
  };
  physicalExamFindings: string[];
  testResults: PhysicalTestResult[];
  observations: string[];
  measurements: Record<string, string | number>;
}

export interface AssessmentSection extends SOAPSection {
  primaryDiagnosis: string[];
  differentialDiagnosis: string[];
  clinicalImpression: string;
  prognosis: string;
  contraindications: string[];
}

export interface PlanSection extends SOAPSection {
  interventions: {
    type: 'manual' | 'exercise' | 'modality' | 'education';
    description: string;
    frequency?: string;
    duration?: string;
  }[];
  shortTermGoals: string[];
  longTermGoals: string[];
  followUpDate?: Date;
  referrals?: string[];
  homeProgramProvided: boolean;
}

export interface SOAPMetadata {
  sessionId: string;
  patientId: string;
  professionalId: string;
  professionalName: string;
  clinicId?: string;
  generatedAt: Date;
  lastModified: Date;
  status: 'draft' | 'final' | 'signed';
  signature?: string;
  supervisionRequired: boolean;
  billingCode?: string;
  icd10Codes?: string[];
}

export interface EditableSOAPNote {
  subjective: SubjectiveSection;
  objective: ObjectiveSection;
  assessment: AssessmentSection;
  plan: PlanSection;
  metadata: SOAPMetadata;
}

export interface SOAPGenerationRequest {
  analysisResults: AnalysisResults;
  physicalTestResults: PhysicalTestResult[];
  patientData: PatientData;
  professionalNotes?: string;
  selectedItems: string[];
  sessionContext: {
    duration: number;
    location: string;
    sessionType: 'initial' | 'followup' | 'discharge';
  };
}

export interface SOAPExportOptions {
  format: 'pdf' | 'json' | 'hl7' | 'jane' | 'noterro';
  includeSignature: boolean;
  includeMetadata: boolean;
  language: 'en' | 'es' | 'fr';
}
