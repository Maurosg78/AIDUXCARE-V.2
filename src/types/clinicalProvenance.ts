export type ProvenanceSource = 'today' | 'historical' | 'unconfirmed';

export type ProvenanceSourceDetail =
  | 'transcript_current_session'
  | 'physio_structured_input'
  | 'clinician_checklist'
  | 'previous_session'
  | 'baseline_soap'
  | 'longitudinal_summary'
  | 'treatment_decision'
  | 'attachment_reviewed_today';

export interface ClinicalDataPoint<T> {
  value: T;
  source: ProvenanceSource;
  sourceDetail: ProvenanceSourceDetail;
  sessionId?: string;
  capturedAt?: string;
  confirmedByClinician?: boolean;
}
