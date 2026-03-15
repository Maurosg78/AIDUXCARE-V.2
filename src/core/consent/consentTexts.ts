/**
 * Consent Texts Registry - Versioned Legal Texts
 *
 * ✅ WO-CONSENT-VERBAL-01-LANG: Centralized text registry
 *
 * Legal texts are NOT hardcoded in services or modals.
 * All references use textVersion.
 *
 * v2-en-CA: CPO TRUST + IPC Ontario (Jan 28, 2026) compliant.
 * Covers: what AI scribe does, third-party processing, Canadian storage,
 * physiotherapist review, voluntary participation without care impact.
 */

import type { ConsentTextVersion } from './consentLanguagePolicy';

export interface ConsentText {
  language: string;
  text: string;
  version: ConsentTextVersion;
  /**
   * Optional metadata for jurisdiction-aware routing (e.g. CA-ON, ES-ES).
   * Phase 1: informational only, does not drive behaviour yet.
   */
  jurisdiction?: string;
  /**
   * Optional consent type: verbal vs written.
   */
  type?: 'verbal' | 'written';
}

/**
 * Registry of all consent texts by version
 */
export const CONSENT_TEXTS: Record<ConsentTextVersion, ConsentText> = {
  'v1-en-CA': {
    language: 'en-CA',
    version: 'v1-en-CA',
    jurisdiction: 'CA-ON',
    type: 'verbal',
    text: `We will record our physiotherapy session to automatically generate medical notes using artificial intelligence. The recording is securely stored on nadian servers. Do you authorize this recording and processing of your data?`,
  },
  'v1-en-US': {
    language: 'en-US',
    version: 'v1-en-US',
    jurisdiction: 'US',
    type: 'verbal',
    text: `We will record our physiotherapy session to automatically generate medical notes using artificial intelligence. The recording is securely stored on secure servers. Do you authorize this recording and processing of your data?`,
  },
  'v2-en-CA': {
    language: 'en-CA',
    version: 'v2-en-CA',
    jurisdiction: 'CA-ON',
    type: 'verbal',
    text: `I use an AI tool to help me take notes during our session so I can focus on you instead of typing.

The session audio is processed by a secure third-party AI service and stored on Canadian servers. I always review and approve all notes before they become part of your record.

Your participation is completely voluntary. You can say no or change your mind at any time — this will not affect the quality of care you receive.

Do you consent to this?`,
  },
  /**
   * Spain (ES-ES) — pilot texts
   *
   * Phase 1:
   *  - Defined but not yet mapped from any jurisdiction
   *  - Safe to keep inactive until ES pilot activation
   */
  'v1-es-ES-verbal': {
    language: 'es-ES',
    version: 'v1-es-ES-verbal',
    jurisdiction: 'ES-ES',
    type: 'verbal',
    text: `Utilizo una herramienta de inteligencia artificial para ayudarme a tomar notas durante nuestra sesión, así puedo concentrarme en ti en lugar de estar escribiendo.

El audio de la sesión se procesa mediante un servicio de IA seguro y se almacena en servidores protegidos. Yo siempre reviso y apruebo todas las notas antes de que pasen a formar parte de tu historia clínica.

Tu participación es completamente voluntaria. Puedes decir que no o cambiar de opinión en cualquier momento y esto no afectará la calidad de la atención que recibes.

¿Das tu consentimiento para esto?`,
  },
  'v1-es-ES-written': {
    language: 'es-ES',
    version: 'v1-es-ES-written',
    jurisdiction: 'ES-ES',
    type: 'written',
    text: `Consentimiento informado para el uso de una herramienta de inteligencia artificial (IA) en la documentación clínica.

Durante tus sesiones de fisioterapia, el profesional puede utilizar una herramienta de IA para ayudar en la elaboración de las notas clínicas. Esto puede implicar la grabación y el procesamiento seguro del audio de la sesión para generar borradores de informes clínicos.

Los datos se almacenan en servicios en la nube con medidas de seguridad avanzadas. El fisioterapeuta revisa y aprueba siempre el contenido antes de que se incorpore a tu historia clínica.

Tu participación es voluntaria. Puedes negarte o retirar tu consentimiento en cualquier momento sin que ello afecte a la calidad de la atención que recibes. Tienes derecho a acceder a tu información, solicitar correcciones y, en los casos legalmente previstos, solicitar la eliminación de tus datos.

He leído y comprendido la información anterior y:

[  ] DOY mi consentimiento para el uso de la herramienta de IA en la documentación clínica.
[  ] NO DOY mi consentimiento para el uso de la herramienta de IA en la documentación clínica.

Nombre del/de la paciente: _______________________________
Fecha: ____ / ____ / ______
Firma: _______________________________`,
  },
};

// Optional convenience alias with camelCase name
export const consentTexts = CONSENT_TEXTS;

/**
 * Get consent text by version
 */
export function getConsentText(version: ConsentTextVersion): ConsentText {
  return CONSENT_TEXTS[version];
}

/**
 * Get consent text string by version
 */
export function getConsentTextString(version: ConsentTextVersion): string {
  return CONSENT_TEXTS[version].text.trim();
}
