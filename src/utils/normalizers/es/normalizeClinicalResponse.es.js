import { normalizeVertexResponseWithTransform, } from '../normalizeClinicalResponse.shared';
import { ensureSpanishClinicalText } from './ensureSpanishClinicalText';
export const normalizeSpanishClinicalResponse = (raw) => {
    return normalizeVertexResponseWithTransform(raw, ensureSpanishClinicalText);
};
