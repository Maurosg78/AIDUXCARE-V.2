import { normalizeClinicalResponse } from "./normalizers/normalizeClinicalResponse";
import type { ClinicalAnalysis, LegalExposure } from "./normalizers/normalizeClinicalResponse.shared";
import type { ClinicalMarket } from "@/core/market/resolveClinicalMarket";

type NormalizeVertexResponseOptions = {
  market?: ClinicalMarket;
};

export type { ClinicalAnalysis, LegalExposure };

export function normalizeVertexResponse(raw: any, options?: NormalizeVertexResponseOptions): ClinicalAnalysis {
  return normalizeClinicalResponse(raw, options);
}

export default normalizeVertexResponse;
