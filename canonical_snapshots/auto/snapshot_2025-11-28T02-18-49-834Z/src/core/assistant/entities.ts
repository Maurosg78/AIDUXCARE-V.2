export type CodingSystem = 'RxNorm' | 'ATC' | 'SNOMED' | 'ICD10';

export interface BaseEntity {
  confidence: number; // 0..1
}

export interface MedicationEntity extends BaseEntity {
  kind: 'medication';
  name: string;
  strength?: string;
  route?: 'oral' | 'iv' | 'im' | 'topical' | 'other';
  dose?: string; // "1 comprimido"
  frequency?: string; // "cada 12 horas"
  durationDays?: number;
  startDate?: string; // ISO
  endDate?: string; // ISO
  notes?: string;
  coding?: { system: CodingSystem; code: string; display: string }[];
}

export interface DiagnosisEntity extends BaseEntity {
  kind: 'diagnosis';
  label: string;
  coding?: { system: Extract<CodingSystem, 'ICD10' | 'SNOMED'>; code: string; display: string }[];
}

export interface ProcedureEntity extends BaseEntity {
  kind: 'procedure';
  label: string;
  dateSuggested?: string; // ISO
  coding?: { system: 'SNOMED'; code: string; display: string }[];
}

export interface InstructionEntity extends BaseEntity {
  kind: 'instruction';
  text: string;
}

export type AssistantEntity = MedicationEntity | DiagnosisEntity | ProcedureEntity | InstructionEntity;

export function isMedication(entity: AssistantEntity): entity is MedicationEntity {
  return entity.kind === 'medication';
}


