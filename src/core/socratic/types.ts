import type { ClinicalDecision } from '@/core/clinical-decisions/types';

// Socrates layer: clinical deliberation support, not autonomous decision-making.
// ADR-002: the system proposes questions; the physiotherapist decides.

export type ClinicalContextSourceType =
  | 'transcript'
  | 'soap'
  | 'manual_input'
  | 'physio_decision'
  | 'clinical_decision'
  | 'approved_evidence'
  | 'ai_observation';

export type ClinicalContextAuthor = 'human' | 'ai' | 'system';

export type SocraticSignalCategory =
  | 'adherence'
  | 'fear_or_confidence'
  | 'patient_goal'
  | 'functional_progress'
  | 'treatment_response'
  | 'safety'
  | 'evidence_gap'
  | 'clinical_uncertainty';

export type SocraticCandidateAction =
  | 'explore_now'
  | 'save_for_next_session'
  | 'dismiss';

export type SocraticCandidateSeverity = 'low' | 'medium' | 'high';

export type SocraticInteractionOutcome =
  | 'accepted'
  | 'dismissed'
  | 'postponed'
  | 'edited';

export interface ClinicalTraceability {
  readonly sourceType: ClinicalContextSourceType;
  readonly sessionId: string;
  readonly encounterId?: string;
  readonly sourceText?: string;
  readonly createdBy: ClinicalContextAuthor;
  readonly acceptedByClinician?: boolean;
  readonly modelVersion?: string;
  readonly promptVersion?: string;
}

export type DocumentedFactConfidence =
  | 'clinician_confirmed'
  | 'patient_reported'
  | 'document_extracted';

export interface DocumentedFact {
  readonly id: string;
  readonly text: string;
  readonly category: SocraticSignalCategory;
  readonly traceability: ClinicalTraceability;
  readonly confidence: DocumentedFactConfidence;
  readonly status: 'active' | 'superseded' | 'expired';
  readonly validUntil?: string; // ISO date; if past, fact is no longer active
  readonly supersededBy?: string; // id of the fact that replaces this one
}

/**
 * Returns only facts that are currently active.
 * A fact is active if: status === 'active', no supersededBy, and validUntil has not passed.
 */
export function getActiveFacts(
  facts: DocumentedFact[],
  nowIso = new Date().toISOString()
): DocumentedFact[] {
  return facts.filter((fact) => {
    if (fact.status !== 'active') return false;
    if (fact.supersededBy) return false;
    if (fact.validUntil && fact.validUntil < nowIso) return false;
    return true;
  });
}

export interface AiObservation {
  readonly id: string;
  readonly text: string;
  readonly category: SocraticSignalCategory;
  readonly confidence: number;
  readonly traceability: ClinicalTraceability;
}

export interface LongitudinalPattern {
  readonly id: string;
  readonly category: SocraticSignalCategory;
  readonly summary: string;
  readonly sessionIds: string[];
  readonly firstSeenAt?: string;
  readonly lastSeenAt?: string;
  readonly occurrenceCount: number;
  readonly traceability: ClinicalTraceability[];
}

export interface ApprovedEvidenceReference {
  readonly diagnosisId: string;
  readonly title: string;
  readonly evidenceLevel: 'high' | 'moderate' | 'low';
  readonly approvedAt: string;
  readonly referenceId?: string;
}

export interface SocraticQuestionCandidate {
  readonly id: string;
  readonly question: string;
  readonly category: SocraticSignalCategory;
  readonly severity: SocraticCandidateSeverity;
  readonly suggestedAction: SocraticCandidateAction;
  readonly basis: string[];
  readonly sourceSessionIds: string[];
  readonly traceability: ClinicalTraceability[];
}

export interface SocraticInteractionLog {
  readonly candidateId: string;
  readonly patientId: string;
  readonly sessionId: string;
  readonly outcome: SocraticInteractionOutcome;
  readonly decidedBy: string;
  readonly decidedAt: string;
  readonly editedQuestion?: string;
  readonly note?: string;
}

export interface ClinicalContextLedger {
  readonly patientId: string;
  readonly sessionId: string;
  readonly generatedAt: string;
  readonly sessionFacts: DocumentedFact[];
  readonly aiObservations: AiObservation[];
  readonly physioDecisions: ClinicalDecision[];
  readonly longitudinalPatterns: LongitudinalPattern[];
  readonly unresolvedQuestions: SocraticQuestionCandidate[];
  readonly evidenceLinks?: ApprovedEvidenceReference[];
}
