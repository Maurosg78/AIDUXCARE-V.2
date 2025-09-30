export const SOAP_HEADINGS = {
  en: {
    subjective: 'Subjective',
    objective: 'Objective',
    assessment: 'Assessment',
    plan: 'Plan',
  },
} as const;

export type SoapLocale = keyof typeof SOAP_HEADINGS;
export default SOAP_HEADINGS;
