import { resolveClinicalMarket, type ClinicalMarket } from '@/core/market/resolveClinicalMarket';
import { normalizeCanadianClinicalResponse } from './ca/normalizeClinicalResponse.ca';
import { normalizeSpanishClinicalResponse } from './es/normalizeClinicalResponse.es';
import type { ClinicalAnalysis } from './normalizeClinicalResponse.shared';

type NormalizeClinicalResponseOptions = {
  market?: ClinicalMarket;
};

export type { ClinicalAnalysis, LegalExposure } from './normalizeClinicalResponse.shared';

export const normalizeClinicalResponse = (raw: any, options?: NormalizeClinicalResponseOptions): ClinicalAnalysis => {
  const explicitMarket = options?.market;
  const resolvedMarket = explicitMarket ? { market: explicitMarket } : resolveClinicalMarket();
  if (resolvedMarket.market === 'ES') return normalizeSpanishClinicalResponse(raw);
  return normalizeCanadianClinicalResponse(raw);
};
