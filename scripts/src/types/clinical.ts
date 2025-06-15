// === TIPOS PARA LA FICHA CLÍNICA ===

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  insuranceId: string;
  email?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  professionalId: string;
  date: string;
  type: 'evaluación inicial' | 'seguimiento' | 'control' | 'urgencia';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface SOAPForm {
  id: string;
  visitId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  notes?: string;
  status: 'draft' | 'completed' | 'reviewed';
  createdAt: string;
  updatedAt: string;
}

export interface AISuggestion {
  id: string;
  visitId: string;
  type: 'clinical' | 'warning' | 'recommendation' | 'medication';
  content: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected' | 'integrated';
  section?: 'subjective' | 'objective' | 'assessment' | 'plan';
  createdAt: string;
}

export interface AudioTranscription {
  id: string;
  visitId: string;
  content: string;
  duration: number;
  status: 'recording' | 'processing' | 'completed' | 'error';
  createdAt: string;
}

export interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface ClinicalEvolution {
  status: 'improved' | 'stable' | 'worsened' | 'neutral';
  description: string;
  date: string;
}

export interface RiskLevel {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

// === TIPOS PARA ESTADOS DE LA APLICACIÓN ===
export type ClinicalViewState = 'REVIEW' | 'ACTIVE' | 'COMPLETED';

export interface ClinicalPageProps {
  patient: Patient;
  visit: Visit;
  soapForm: SOAPForm;
  aiSuggestions: AISuggestion[];
  audioTranscription?: AudioTranscription;
  vitalSigns?: VitalSigns;
  clinicalEvolution?: ClinicalEvolution;
  riskLevel?: RiskLevel;
  viewState: ClinicalViewState;
} 