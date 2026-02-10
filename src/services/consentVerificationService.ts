/**
 * Consent verification: delegates to consent server (single source of truth).
 * Used by workflow for redirect to verification page when consent not yet given.
 */
import { checkConsentViaServer } from './consentServerService';

export const ConsentVerificationService = {
  async isConsentVerified(patientId: string): Promise<boolean> {
    const result = await checkConsentViaServer(patientId);
    return result.hasValidConsent;
  },
};
