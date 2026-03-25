import { resolveClinicalMarket, type ClinicalMarket } from '@/core/market/resolveClinicalMarket';
import { buildCanadianAnalysisPrompt } from './ca/buildAnalysisPrompt.ca';
import { buildSpanishAnalysisPrompt } from './es/buildAnalysisPrompt.es';
import type { AnalysisPromptParams, ClinicalAttachment } from './buildAnalysisPrompt.shared';

export type { AnalysisPromptParams, ClinicalAttachment } from './buildAnalysisPrompt.shared';

type BuildAnalysisPromptOptions = {
  market?: ClinicalMarket;
};

export const buildAnalysisPrompt = (
  params: AnalysisPromptParams,
  options?: BuildAnalysisPromptOptions
): string => {
  const explicitMarket = options?.market;
  const resolvedMarket = explicitMarket ? { market: explicitMarket } : resolveClinicalMarket();

  if (resolvedMarket.market === 'ES') {
    return buildSpanishAnalysisPrompt(params);
  }

  return buildCanadianAnalysisPrompt(params);
};
