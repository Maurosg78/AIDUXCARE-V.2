/**
 * SMS Templates - English (en-CA) for Canadian Market
 * PHIPA s.18 Compliant Consent Messages
 * 
 * All templates are in English only - no Spanish allowed
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
    }
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
 * Validation helper for SMS templates
 * Ensures no Spanish content and required English content
 */
export function validateSMSTemplate(template: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for Spanish characters
  if (/[áéíóúñü]/i.test(template)) {
    errors.push('Contains Spanish characters');
  }
  
  // Check for Spanish words
  const spanishWords = [
    'Hola', 'consentimiento', 'datos', 'salud', 'según', 'ley', 
    'válido', 'necesita', 'para', 'cancelar', 'cuenta', 'activa'
  ];
  spanishWords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(template)) {
      errors.push(`Contains Spanish word: ${word}`);
    }
  });
  
  // Check for required English content
  if (!template.includes('Hello') && !template.includes('Hi')) {
    errors.push('Missing English greeting');
  }
  
  // Check for PHIPA mention in consent messages
  if (template.includes('consent') && !template.includes('PHIPA')) {
    // Warning but not error - PHIPA may be implied
    console.warn('SMS template mentions consent but not PHIPA');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

