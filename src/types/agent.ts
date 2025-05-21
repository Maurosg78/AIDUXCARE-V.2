/**
 * Tipos para el sistema de agente clínico
 */

export type MemoryBlockType = 'contextual' | 'semantic' | 'clinical' | 'persistent';

export interface MemoryBlock {
  id: string;
  type: MemoryBlockType;
  content: string;
  created_at: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  visitId: string;
  blocks: MemoryBlock[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    patientId?: string;
    visitDate?: string;
    professionalId?: string;
  };
}

export type SuggestionType = 'diagnostic' | 'treatment' | 'followup' | 'contextual' | 'recommendation' | 'warning' | 'info';
export type SuggestionField = 
  | 'diagnosis'
  | 'treatment'
  | 'followup'
  | 'medication'
  | 'vitals'
  | 'symptoms'
  | 'history'
  | 'lab_results'
  | 'imaging'
  | 'notes';

export interface AgentSuggestion {
  id: string;
  type: SuggestionType;
  field: SuggestionField;
  content: string;
  sourceBlockId: string;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SuggestionFeedbackType = 'accept' | 'reject' | 'ignore'; 