import { resolveClinicalMarket } from '@/core/market/resolveClinicalMarket';
import { buildCanadianAnalysisPrompt } from './ca/buildAnalysisPrompt.ca';
import { buildSpanishAnalysisPrompt } from './es/buildAnalysisPrompt.es';
export const buildAnalysisPrompt = (params, options) => {
    const explicitMarket = options?.market;
    const resolvedMarket = explicitMarket ? { market: explicitMarket } : resolveClinicalMarket();
    if (resolvedMarket.market === 'ES') {
        return buildSpanishAnalysisPrompt(params);
    }
    return buildCanadianAnalysisPrompt(params);
};
