/**
 * Domain: single source of truth for when the consent gate is shown or unmounted.
 * Gate UNMOUNTs when channel === 'none' (valid consent) or channel === 'blocked' (hard block).
 * WO-CONSENT-VERBAL-FIX: hasValidConsent === true → channel 'none' so gate unmounts.
 */

export interface ResolveConsentInput {
  hasValidConsent: boolean;
  isDeclined?: boolean;
  jurisdiction?: string;
  isFirstSession?: boolean;
}

export interface ConsentResolution {
  channel: 'none' | 'sms' | 'blocked';
  hardBlock?: boolean;
  blockReason?: string;
  allowedActions?: Record<string, boolean>;
}

/**
 * Resolves consent state to a channel. When hasValidConsent is true, returns channel 'none'
 * so the UI unmounts the ConsentGate and allows clinical workflow (including attachments).
 */
export function resolveConsentChannel(input: ResolveConsentInput): ConsentResolution {
  const { hasValidConsent, isDeclined } = input;

  if (isDeclined === true) {
    return {
      channel: 'blocked',
      hardBlock: true,
      blockReason: 'Patient declined consent',
    };
  }

  if (hasValidConsent === true) {
    return {
      channel: 'none',
      allowedActions: { view: true, record: true, upload: true },
    };
  }

  return {
    channel: 'sms',
    allowedActions: { view: false, record: false, upload: false },
  };
}
