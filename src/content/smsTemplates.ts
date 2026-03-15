/**
 * SMS Templates - Multi-jurisdiction (en-CA PHIPA, es_ES GDPR/RGPD)
 * Consent and activation messages by locale/jurisdiction.
 */
export const SMS_TEMPLATES = {
  consent: {
    en_CA: (
      patientName: string,
      physioName: string,
      consentUrl: string,
      privacyUrl: string
    ): string => {
      return `Hello ${patientName}, ${physioName} requires your consent for health data processing according to Canadian law (PHIPA s.18).
Authorize: ${consentUrl}
Privacy Policy: ${privacyUrl}
Reply STOP to opt out.`;
    },
    es_ES: (
      patientName: string,
      physioName: string,
      consentUrl: string,
      privacyUrl: string
    ): string => {
      return `Hola ${patientName}, ${physioName} necesita tu consentimiento para el tratamiento de datos de salud según el RGPD.
Autorizar: ${consentUrl}
Política de privacidad: ${privacyUrl}
Responde STOP para darte de baja.`;
    },
  },
  activation: {
    en_CA: (
      professionalName: string,
      activationUrl: string,
      privacyUrl: string,
      dataUsageUrl: string
    ): string => {
      return `Hello ${professionalName}, activate your AiDuxCare account:
${activationUrl}
Privacy: ${privacyUrl}
Data Usage: ${dataUsageUrl}
Link valid for 24 hours.`;
    }
  }
};

/**
 * Helper to detect non-ASCII characters
 */
function containsNonASCII(text: string): boolean {
  return /[\u0080-\uFFFF]/.test(text);
}

/**
 * Validation for en-CA (Canadian) SMS: no Spanish, requires English greeting.
 */
export function validateSMSTemplate(template: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (containsNonASCII(template)) {
    errors.push('Contains non-ASCII characters (accents/tildes not allowed in SMS)');
  }
  const spanishWords = [
    'Hola', 'consentimiento', 'datos', 'salud', 'según', 'ley',
    'válido', 'necesita', 'para', 'cancelar', 'cuenta', 'activa'
  ];
  spanishWords.forEach(word => {
    if (new RegExp('\\b' + word + '\\b', 'i').test(template)) {
      errors.push('Contains Spanish word: ' + word);
    }
  });
  if (!template.includes('Hello') && !template.includes('Hi')) {
    errors.push('Missing English greeting');
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validation for es-ES (GDPR) SMS: allows Spanish, minimal checks.
 */
export function validateSMSTemplateEs(template: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!template || template.length < 10) {
    errors.push('Template too short');
  }
  return { isValid: errors.length === 0, errors };
}
