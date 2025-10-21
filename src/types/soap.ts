export interface ClinicalEntity {
  id?: string; label?: string; value?: string; confidence?: number;
  type?: string; name?: string;
}
export interface PhysicalTestResult {
  id?: string; name?: string; result?: string; notes?: string;
  values?: any; interpretation?: string;
}
export interface SubjectiveSection {
  chief_complaint?: string; history?: string; medications?: string[]; content?: string;
  editable?: boolean; validated?: boolean;
  // alias camelCase que el generador usa
  chiefComplaint?: string;
}
export interface ObjectiveSection {
  findings?: string[]; tests?: PhysicalTestResult[]; content?: string;
  editable?: boolean; validated?: boolean;
  // alias camelCase
  physicalExamFindings?: string[];
}
export interface AssessmentSection {
  diagnosis?: string; red_flags?: string[]; content?: string;
  editable?: boolean; validated?: boolean;
  // alias camelCase
  primaryDiagnosis?: string[];
}
export interface PlanSection {
  plan?: string; treatment_plan?: string; follow_up?: string; content?: string;
  editable?: boolean; validated?: boolean;
  // alias camelCase
  interventions?: string[];
}
export interface SOAPMetadata {
  sessionId?: string; createdAt?: string; author?: string;
  patientId?: string; professionalId?: string; professionalName?: string;
  // alias extra usado por el generador
  generatedAt?: string;
}
export interface EditableSOAPNote {
  subjective?: SubjectiveSection;
  objective?: ObjectiveSection;
  assessment?: AssessmentSection;
  plan?: PlanSection;
  metadata?: SOAPMetadata;
}
export interface SOAPGenerationRequest {
  analysisResults: any;
  physicalTestResults: PhysicalTestResult[];
  patientData?: any;
  selectedItems?: string[];
  sessionContext?: { duration?: number; location?: string; sessionType?: string };
}
