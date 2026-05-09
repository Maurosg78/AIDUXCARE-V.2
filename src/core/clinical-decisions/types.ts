// Epica: Decisiones clinicas persistidas por el fisio.
// ADR-002: sistema propone, fisio decide, decision persiste con trazabilidad.

export type ClinicalDecisionKind = 'red_flag' | 'medication';

export type ClinicalDecisionStatus =
  | 'active'
  | 'reviewed'
  | 'resolved'
  | 'monitoring'
  | 'false_positive';

export type ClinicalDecisionSource =
  | 'vertex'
  | 'physio_added'
  | 'patient_reported';

export type ClinicalDecisionReason =
  | 'false_positive'
  | 'controlled_condition'
  | 'resolved'
  | 'not_clinically_relevant_today'
  | null;

export type MedicationDecisionState =
  | 'initiated'
  | 'suspended'
  | 'changed'
  | 'confirmed_active';

export interface ClinicalDecision {
  readonly id: string;
  readonly kind: ClinicalDecisionKind;
  readonly status: ClinicalDecisionStatus;
  readonly source: ClinicalDecisionSource;
  readonly text: string;
  readonly decidedBy: string;
  readonly decidedAt: string;
  readonly sessionId: string;
  readonly patientId: string;
  readonly reason: ClinicalDecisionReason;
  readonly note?: string;
  readonly medicationDose?: string;
  readonly medicationFrequency?: string;
  readonly medicationState?: MedicationDecisionState;
}

export interface ClinicalDecisionsSnapshot {
  readonly sessionId: string;
  readonly capturedAt: string;
  readonly decisions: ClinicalDecision[];
}
