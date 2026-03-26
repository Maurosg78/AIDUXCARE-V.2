import {
  normalizeVertexResponseWithTransform,
  type ClinicalAnalysis,
} from '../normalizeClinicalResponse.shared';
import { ensureSpanishClinicalText } from './ensureSpanishClinicalText';

export const normalizeSpanishClinicalResponse = (raw: any): ClinicalAnalysis => {
  return normalizeVertexResponseWithTransform(raw, ensureSpanishClinicalText);
};
