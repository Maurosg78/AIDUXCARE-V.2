/**
 * Source of Truth for Consent Channel Resolution
 * 
 * Pure, deterministic function that resolves which consent channel
 * should be offered to the user based on legal state and jurisdiction.
 * 
 * WO-CONSENT-DOMAIN-ACTIONS-01: Explicit actions declaration
 * React does NOT infer, React only renders what domain declares.
 * 
 * Rules:
 * 1. If consent already exists → no channel needed ('none'), no actions allowed
 * 2. Only decide channel when consent is missing
 * 3. CA-ON default channel is SMS, both actions explicitly allowed
 * 4. This function does NOT infer from UI, history, or side effects
 * 
 * Compliance:
 * - Separates legal state (hasValidConsent) from UX decision (channel)
 * - Explicitly declares allowed actions (no inference in React)
 * - No side effects
 * - Fully testable
 */

export type ConsentChannel = 'none' | 'sms' | 'verbal' | 'blocked';

export interface ResolveConsentChannelParams {
  hasValidConsent: boolean;
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Detect declined consent
  isDeclined?: boolean;
  jurisdiction: 'CA-ON' | string;
  isFirstSession: boolean;
}

/**
 * Consent resolution result with explicit allowed actions
 * 
 * WO-CONSENT-DOMAIN-ACTIONS-01: Domain declares what actions are allowed,
 * React only renders based on these declarations.
 * 
 * WO-CONSENT-DECLINED-HARD-BLOCK-01: Added hardBlock flag for declined consent
 */
export type ConsentResolution = {
  channel: 'none' | 'sms' | 'verbal' | 'blocked';
  jurisdiction: string;
  allowedActions: {
    sendSms: boolean;
    recordVerbal: boolean;
  };
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Hard block flag for declined consent
  hardBlock?: boolean;
  blockReason?: 'consent_declined';
};

/**
 * Source of truth for consent channel resolution (UX-level decision).
 * This function is PURE and MUST remain side-effect free.
 * 
 * WO-CONSENT-DOMAIN-ACTIONS-01: Returns explicit allowed actions
 * to prevent React from inferring what actions are available.
 * 
 * @param params - Parameters for channel resolution
 * @returns Consent resolution with channel and explicitly allowed actions
 */
export function resolveConsentChannel(
  params: ResolveConsentChannelParams
): ConsentResolution {
  const { hasValidConsent, isDeclined, jurisdiction } = params;

  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Rule 0 - Declined consent = hard block
  // AiDux NO puede usarse si el paciente rechazó consentimiento
  if (isDeclined === true) {
    return {
      channel: 'blocked',
      jurisdiction,
      allowedActions: {
        sendSms: false,
        recordVerbal: false,
      },
      hardBlock: true,
      blockReason: 'consent_declined',
    };
  }

  // Rule 1: Consent already exists → no channel, no actions allowed
  if (hasValidConsent === true) {
    return {
      channel: 'none',
      jurisdiction,
      allowedActions: {
        sendSms: false,
        recordVerbal: false,
      },
    };
  }

  // Rule 2: CA-ON, paciente nuevo → SMS default, both actions explicitly allowed
  if (jurisdiction === 'CA-ON') {
    return {
      channel: 'sms',
      jurisdiction,
      allowedActions: {
        sendSms: true,
        recordVerbal: true, // EXPLÍCITO
      },
    };
  }

  // Default conservador: SMS only
  return {
    channel: 'sms',
    jurisdiction,
    allowedActions: {
      sendSms: true,
      recordVerbal: false,
    },
  };
}
