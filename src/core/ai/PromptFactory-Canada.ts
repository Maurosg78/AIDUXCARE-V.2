import { buildCanadianAnalysisPrompt } from './markets/ca/buildAnalysisPrompt.ca';
import type { AnalysisPromptParams, ClinicalAttachment } from './markets/buildAnalysisPrompt';

export type { ClinicalAttachment } from './markets/buildAnalysisPrompt';

export interface CanadianPromptParams extends AnalysisPromptParams {}

export const buildCanadianPrompt = (params: CanadianPromptParams): string => {
  return buildCanadianAnalysisPrompt(params);
};

export const CanadianPromptFactory = {
  create(params: CanadianPromptParams): string {
    return buildCanadianPrompt(params);
  },
};

console.log("[OK] PromptFactory-Canada ready (CA builder only)");
