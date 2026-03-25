import { identityTextTransform, normalizeVertexResponseWithTransform, } from '../normalizeClinicalResponse.shared';
export const normalizeCanadianClinicalResponse = (raw) => {
    return normalizeVertexResponseWithTransform(raw, identityTextTransform);
};
