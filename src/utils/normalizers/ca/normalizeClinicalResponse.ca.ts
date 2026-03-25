import {
  identityTextTransform,
  normalizeVertexResponseWithTransform,
  type ClinicalAnalysis,
} from '../normalizeClinicalResponse.shared';

export const normalizeCanadianClinicalResponse = (raw: any): ClinicalAnalysis => {
  return normalizeVertexResponseWithTransform(raw, identityTextTransform);
};
