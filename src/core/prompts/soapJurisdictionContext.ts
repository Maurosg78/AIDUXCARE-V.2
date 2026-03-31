import { isSpainPilot } from '../pilotDetection';

/** Jurisdiction snippets for SOAP system prompts (ES pilot vs Ontario). */
export type SoapJurisdictionContext = {
  country: string;
  region: string;
  regulation: string;
  college: string;
  standard: string;
};

/**
 * Shared Ontario/Canada vs España labels for Vertex SOAP prompts.
 * When `jurisdictionHint` is `ES-ES`, Spain context wins even if env pilot flag is off (tests/server).
 * When hint is empty, uses `isSpainPilot()`.
 */
export function getSoapJurisdictionContext(jurisdictionHint?: string | null): SoapJurisdictionContext {
  const hint = (jurisdictionHint ?? '').trim().toUpperCase();
  const isEsFromHint = hint === 'ES-ES';
  const isEsFromPilot = isSpainPilot();
  const useSpainContext = isEsFromHint || (hint === '' && isEsFromPilot);
  if (useSpainContext) {
    const spainContext: SoapJurisdictionContext = {
      country: 'España',
      region: 'España',
      regulation: 'normativa española (LOPD-GDD, Ley 41/2002)',
      college: 'colegio profesional de fisioterapia',
      standard: 'estándares clínicos españoles',
    };
    return spainContext;
  }
  const canadaContext: SoapJurisdictionContext = {
    country: 'Canadá',
    region: 'Ontario, Canadá',
    regulation: 'PHIPA, PIPEDA',
    college: 'College of Physiotherapists of Ontario (CPO)',
    standard: 'CPO Documentation Standard 2025',
  };
  return canadaContext;
}
