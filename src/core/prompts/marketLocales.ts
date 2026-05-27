import { isSpainPilot } from '../pilotDetection';

/**
 * AiduxCare Market Locale Configuration
 * 
 * Defines language, legal framework, and prompt header per market.
 * Clinical logic (SOAP structure, red flags) is universal — only
 * the header layer is localized here.
 * 
 * To activate a new market: implement its headerInstructions and
 * update getActiveLocale() detection logic.
 */

export type MarketCode = 'CA' | 'ES' | 'PT' | 'PH' | 'NG';

export interface PromptLocale {
  marketCode: MarketCode;
  language: string;
  legalFramework: string;
  regulatoryBody: string;
  jurisdiction: string;
  clinicalTerms: {
    physiotherapist: string;
    session: string;
    referral: string;
    documentation: string;
  };
  headerInstructions: string;
}

export const MARKET_LOCALES: Record<MarketCode, PromptLocale> = {
  CA: {
    marketCode: 'CA',
    language: 'Canadian English (en-CA)',
    legalFramework: 'PHIPA/PIPEDA',
    regulatoryBody: 'College of Physiotherapists of Ontario (CPO)',
    jurisdiction: 'Ontario, Canada',
    clinicalTerms: {
      physiotherapist: 'physiotherapist',
      session: 'session',
      referral: 'referral',
      documentation: 'clinical record',
    },
    headerInstructions: `You are a clinical documentation assistant supporting a licensed physiotherapist in Ontario, Canada.
Legal framework: PHIPA/PIPEDA. Regulatory body: College of Physiotherapists of Ontario (CPO).
Output language: Canadian English (en-CA).
MANDATORY: All output MUST be in Canadian English (en-CA). Do not use any other language regardless of the language of the transcript or input data.
Documentation must comply with the CPO Documentation Standard effective August 1, 2025.`,
  },

  ES: {
    marketCode: 'ES',
    language: 'español clínico formal (es-ES)',
    legalFramework: 'RGPD / LOPDGDD / Ley 41/2002',
    regulatoryBody: 'Consejo General de Colegios de Fisioterapeutas de España (CGCFE)',
    jurisdiction: 'España',
    clinicalTerms: {
      physiotherapist: 'fisioterapeuta',
      session: 'sesión',
      referral: 'derivación',
      documentation: 'historia clínica',
    },
    headerInstructions: `Eres un asistente de documentación clínica que apoya a un fisioterapeuta colegiado en España.
Marco legal: RGPD, LOPDGDD y Ley 41/2002 de autonomía del paciente.
Organismo regulador: Consejo General de Colegios de Fisioterapeutas de España (CGCFE).
Idioma de salida: español clínico formal (es-ES).
OBLIGATORIO: Toda la respuesta DEBE estar en español, independientemente del idioma de la transcripción o los datos de entrada.
La documentación debe cumplir los estándares de historia clínica establecidos por la Ley 41/2002 y las guías del CGCFE.
TÉRMINOS OBLIGATORIOS EN ESPAÑOL: usa siempre "fisioterapia" (nunca "physiotherapy"), "rango de movimiento" (nunca "range of motion"), "deslizamiento neural" (nunca "nerve glides"), "déficits funcionales" (nunca "impairments"), "terapia manual" (nunca "manual therapy"), "fortalecimiento" (nunca "strengthening"). Nunca uses anglicismos clínicos en la respuesta.`,
  },

  PT: {
    marketCode: 'PT',
    language: 'português clínico (pt-PT)',
    legalFramework: 'RGPD / Lei de Bases da Saúde',
    regulatoryBody: 'Ordem dos Fisioterapeutas de Portugal',
    jurisdiction: 'Portugal',
    clinicalTerms: {
      physiotherapist: 'fisioterapeuta',
      session: 'sessão',
      referral: 'referenciação',
      documentation: 'processo clínico',
    },
    headerInstructions: `És um assistente de documentação clínica que apoia um fisioterapeuta em Portugal.
Enquadramento legal: RGPD e Lei de Bases da Saúde (Lei n.º 95/2019).
Organismo regulador: Ordem dos Fisioterapeutas de Portugal.
Idioma de saída: português clínico formal (pt-PT).
OBRIGATÓRIO: Toda a resposta DEVE estar em português europeu, independentemente do idioma da transcrição ou dos dados de entrada.
A documentação deve cumprir os padrões de processo clínico estabelecidos pela Ordem dos Fisioterapeutas.
TERMOS OBRIGATÓRIOS EM PORTUGUÊS: usa sempre "fisioterapia" (nunca "physiotherapy"), "amplitude de movimento" (nunca "range of motion"), "terapia manual" (nunca "manual therapy"), "défices funcionais" (nunca "impairments"), "fortalecimento" (nunca "strengthening"). Nunca uses anglicismos clínicos na resposta.`,
  },

  PH: {
    marketCode: 'PH',
    language: 'English (en-PH)',
    legalFramework: 'Data Privacy Act 2012 (DPA)',
    regulatoryBody: 'Philippine Physical Therapy Association (PTAB)',
    jurisdiction: 'Philippines',
    clinicalTerms: {
      physiotherapist: 'physical therapist',
      session: 'session',
      referral: 'referral',
      documentation: 'clinical record',
    },
    headerInstructions: `[PH — stub. Implement before activating Philippines pilot.]`,
  },

  NG: {
    marketCode: 'NG',
    language: 'English (en-NG)',
    legalFramework: 'Nigeria Data Protection Regulation 2019 (NDPR)',
    regulatoryBody: 'Medical Rehabilitation Therapists Board of Nigeria (MRTBN)',
    jurisdiction: 'Nigeria',
    clinicalTerms: {
      physiotherapist: 'physiotherapist',
      session: 'session',
      referral: 'referral',
      documentation: 'clinical record',
    },
    headerInstructions: `[NG — stub. Implement before activating Nigeria pilot.]`,
  },
};

/**
 * Returns the active market locale based on environment and hostname.
 * Detection order: VITE_ENABLE_ES_PILOT env var → hostname → default CA.
 * 
 * Called once at module load in SOAPPromptFactory.
 * Do not call this inside prompt builder functions — use the module-level
 * `activeLocale` constant instead.
 */
export function getActiveLocale(): PromptLocale {
  // Server-side / non-browser context: default to CA
  if (typeof window === 'undefined') {
    return MARKET_LOCALES.CA;
  }

  // Reuse the same ES pilot detection used by the UI and jurisdiction flow.
  if (isSpainPilot()) {
    return MARKET_LOCALES.ES;
  }

  // Hostname-based detection for future market domains
  const hostname = window.location.hostname;
  if (hostname.startsWith('es.') || hostname.includes('.es.')) {
    return MARKET_LOCALES.ES;
  }
  if (hostname.startsWith('pt.') || hostname.includes('.pt.')) {
    return MARKET_LOCALES.PT;
  }

  // Default: Canada
  return MARKET_LOCALES.CA;
}
