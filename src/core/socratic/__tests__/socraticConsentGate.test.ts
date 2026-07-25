import { describe, expect, it } from 'vitest';

import { hasSocraticLongitudinalConsent } from '../socraticConsentGate';

describe('hasSocraticLongitudinalConsent', () => {
  it('grants access only when both explicit consent flags are true', () => {
    const consent = {
      personalizationFromPatientData: true,
      allowAssistantMemoryAcrossSessions: true,
    };

    expect(hasSocraticLongitudinalConsent(consent)).toBe(true);
  });

  it.each([
    undefined,
    null,
    {},
    {
      personalizationFromPatientData: false,
      allowAssistantMemoryAcrossSessions: true,
    },
    {
      personalizationFromPatientData: true,
      allowAssistantMemoryAcrossSessions: false,
    },
  ])('fails closed for incomplete or denied consent: %j', (consent) => {
    expect(hasSocraticLongitudinalConsent(consent)).toBe(false);
  });
});
