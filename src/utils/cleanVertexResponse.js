import { normalizeClinicalResponse } from "./normalizers/normalizeClinicalResponse";
export function normalizeVertexResponse(raw, options) {
    return normalizeClinicalResponse(raw, options);
}
export default normalizeVertexResponse;
