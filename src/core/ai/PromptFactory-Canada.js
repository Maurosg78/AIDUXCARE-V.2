import { buildCanadianAnalysisPrompt } from './markets/ca/buildAnalysisPrompt.ca';
export const buildCanadianPrompt = (params) => {
    return buildCanadianAnalysisPrompt(params);
};
export const CanadianPromptFactory = {
    create(params) {
        return buildCanadianPrompt(params);
    },
};
console.log("[OK] PromptFactory-Canada ready (CA builder only)");
