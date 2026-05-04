// ADR-004: Fascitis plantar evidence base
// Status: pending_papers — interventions pending full paper review
// CTO clinical review required before status → approved

import type { DiagnosisEvidence } from '../types';

const fascitisPlantarEvidence: DiagnosisEvidence = {
  diagnosisId: 'fascitis-plantar',
  diagnosisName: 'Fascitis Plantar',
  icdCode: 'M72.2',
  version: '0.1.0',
  lastReviewed: '',
  nextReviewDue: '',
  reviewedBy: '',
  interventions: [],
  // Interventions pending full paper review — ADR-004
};

export default fascitisPlantarEvidence;
