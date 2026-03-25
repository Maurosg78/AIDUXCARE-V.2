import { resolveClinicalMarket } from '@/core/market/resolveClinicalMarket';
import { normalizeCanadianClinicalResponse } from './ca/normalizeClinicalResponse.ca';
import { normalizeSpanishClinicalResponse } from './es/normalizeClinicalResponse.es';
export const normalizeClinicalResponse = (raw, options) => {
    const explicitMarket = options?.market;
    const resolvedMarket = explicitMarket ? { market: explicitMarket } : resolveClinicalMarket();
    if (resolvedMarket.market === 'ES')
        return normalizeSpanishClinicalResponse(raw);
    return normalizeCanadianClinicalResponse(raw);
};
