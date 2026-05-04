export interface SafetyReconciliationDelta {
  readonly new_red_flags: string[];
  readonly new_yellow_flags: string[];
  readonly resolved_flags: string[];
  readonly unchanged_flags: string[];
  readonly rationale: string[];
}

export interface ReconciliationInput {
  readonly initial_red_flags: string[];
  readonly initial_yellow_flags: string[];
  readonly corrected_medications: string[];
  readonly confirmed_antecedents: string[];
  readonly physical_evaluation_findings: string[];
}
