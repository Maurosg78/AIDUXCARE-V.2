import { isSpainPilot } from '../pilotDetection';

export type ClinicalMarket = 'CA' | 'ES';

export type ResolvedClinicalMarket = {
  market: ClinicalMarket;
  locale: 'en-CA' | 'es-ES';
  jurisdiction: 'CA-ON' | 'ES-ES';
};

export type ResolveClinicalMarketOptions = {
  isSpainPilotEnabled?: boolean;
};

const CANADIAN_MARKET: ResolvedClinicalMarket = {
  market: 'CA',
  locale: 'en-CA',
  jurisdiction: 'CA-ON',
};

const SPANISH_MARKET: ResolvedClinicalMarket = {
  market: 'ES',
  locale: 'es-ES',
  jurisdiction: 'ES-ES',
};

export function resolveClinicalMarket(options?: ResolveClinicalMarketOptions): ResolvedClinicalMarket {
  const explicitSpainPilot = options?.isSpainPilotEnabled;

  if (typeof explicitSpainPilot === 'boolean') {
    return explicitSpainPilot ? SPANISH_MARKET : CANADIAN_MARKET;
  }

  const spainPilotEnabled = isSpainPilot();

  if (spainPilotEnabled) {
    return SPANISH_MARKET;
  }

  return CANADIAN_MARKET;
}
