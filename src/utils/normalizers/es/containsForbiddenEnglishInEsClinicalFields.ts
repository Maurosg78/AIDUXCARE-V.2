import type { ClinicalAnalysis } from '../normalizeClinicalResponse.shared';

const FORBIDDEN_ENGLISH_TERMS = [
  'Clinical concern',
  'Recommend medical review',
  'Recommended Physical Tests',
  'Conversation Highlights',
  'Medico-legal Summary',
  'as needed for pain',
  'every 12 hours',
  'every 24 hours',
  'for 5 days',
  'for 10 days',
  'Ontario',
  'CPO',
  'PHIPA',
  'PIPEDA',
  'WSIB',
  'CAPR',
  'Canadian usage',
];

const collectEsClinicalFields = (analysis: ClinicalAnalysis): string[] => {
  const redFlags = analysis.red_flags || [];
  const yellowFlags = analysis.yellow_flags || [];
  const chiefComplaint = analysis.motivo_consulta ? [analysis.motivo_consulta] : [];
  const keyFindings = analysis.hallazgos_clinicos || [];
  const medications = analysis.medicacion_actual || [];
  const safetyNotes = analysis.notas_seguridad ? [analysis.notas_seguridad] : [];

  return [
    ...redFlags,
    ...yellowFlags,
    ...chiefComplaint,
    ...keyFindings,
    ...medications,
    ...safetyNotes,
  ];
};

export const containsForbiddenEnglishInEsClinicalFields = (analysis: ClinicalAnalysis): boolean => {
  const clinicalFields = collectEsClinicalFields(analysis);

  for (const fieldValue of clinicalFields) {
    for (const forbiddenTerm of FORBIDDEN_ENGLISH_TERMS) {
      const containsForbiddenTerm = fieldValue.includes(forbiddenTerm);

      if (containsForbiddenTerm) {
        return true;
      }
    }
  }

  return false;
};

export const getForbiddenEnglishTermsInEsClinicalFields = (analysis: ClinicalAnalysis): string[] => {
  const clinicalFields = collectEsClinicalFields(analysis);
  const matches: string[] = [];

  for (const fieldValue of clinicalFields) {
    for (const forbiddenTerm of FORBIDDEN_ENGLISH_TERMS) {
      const containsForbiddenTerm = fieldValue.includes(forbiddenTerm);
      const alreadyMatched = matches.includes(forbiddenTerm);

      if (containsForbiddenTerm && !alreadyMatched) {
        matches.push(forbiddenTerm);
      }
    }
  }

  return matches;
};

export { FORBIDDEN_ENGLISH_TERMS };
