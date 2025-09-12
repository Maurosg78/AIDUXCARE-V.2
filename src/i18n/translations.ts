export const translations = {
  en: {
    workflow: {
      title: 'Clinical Workflow',
      credits: 'Credits',
      remaining: 'remaining',
      tabs: {
        analysis: 'Analysis',
        physical: 'Physical Evaluation',
        soap: 'SOAP'
      },
      patient: {
        select: 'Select Patient',
        recordNumber: 'HC'
      },
      analysis: {
        normalButton: 'Analyze with AI',
        proButton: 'Analyze with AI PRO',
        normalDescription: 'For follow-ups and cases without flags',
        proDescription: 'Red flags or complex cases',
        normalCost: 'credit',
        proCost: 'credits',
        referralTemplate: 'Referral template',
        recommended: 'Recommended',
        suggested: 'Suggested',
        suggestedMessage: 'Suggested: AI Pro - Clinical warning signs detected',
        insufficientCredits: 'Insufficient credits. Please reload.'
      },
      reasoning: {
        quality: 'Clinical Reasoning',
        good: 'GOOD',
        basic: 'BASIC',
        poor: 'POOR'
      }
    }
  },
  es: {
    workflow: {
      title: 'Flujo de Trabajo Clínico',
      credits: 'Créditos',
      remaining: 'restantes',
      tabs: {
        analysis: 'Análisis',
        physical: 'Evaluación Física',
        soap: 'SOAP'
      },
      patient: {
        select: 'Seleccionar Paciente',
        recordNumber: 'HC'
      },
      analysis: {
        normalButton: 'Analizar con IA',
        proButton: 'Analizar con IA PRO',
        normalDescription: 'Para seguimiento y casos sin banderas',
        proDescription: 'Banderas rojas o casos complejos',
        normalCost: 'crédito',
        proCost: 'créditos',
        referralTemplate: 'Plantilla derivación',
        recommended: 'Recomendado',
        suggested: 'Sugerido',
        suggestedMessage: 'Sugerido: IA Pro - Se detectaron señales de alerta clínicas',
        insufficientCredits: 'No tienes suficientes créditos. Por favor recarga.'
      },
      reasoning: {
        quality: 'Razonamiento Clínico',
        good: 'BUENO',
        basic: 'BÁSICO',
        poor: 'POBRE'
      }
    }
  }
};

export type Language = 'en' | 'es';

export function getTranslation(lang: Language) {
  return translations[lang];
}
