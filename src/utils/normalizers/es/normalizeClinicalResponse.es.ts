import {
  normalizeVertexResponseWithTransform,
  type ClinicalAnalysis,
} from '../normalizeClinicalResponse.shared';

const SPANISH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^Clinical concern:/i, "Preocupación clínica:"],
  [/Recommend medical review\/referral based on red flags\.?/gi, "Recomendar revisión/derivación médica según red flags."],
  [/Recommend medical review based on red flags\.?/gi, "Recomendar revisión médica según red flags."],
  [/as needed for pain/gi, "según dolor"],
  [/every 24 hours/gi, "cada 24 horas"],
  [/every 12 hours/gi, "cada 12 horas"],
  [/for 10 days/gi, "durante 10 días"],
  [/for 5 days/gi, "durante 5 días"],
  [/tablet/gi, "comprimido"],
];

const localizeSpanishResidualText = (value: string): string => {
  return SPANISH_REPLACEMENTS.reduce((text, [pattern, replacement]) => {
    return text.replace(pattern, replacement);
  }, value).trim();
};

export const normalizeSpanishClinicalResponse = (raw: any): ClinicalAnalysis => {
  return normalizeVertexResponseWithTransform(raw, localizeSpanishResidualText);
};
