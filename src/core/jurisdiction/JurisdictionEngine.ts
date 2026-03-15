/**
 * Jurisdiction Engine
 * -------------------
 * Central authority for regulatory configuration.
 *
 * Phase 1: Default CA-ON only (no behavior change)
 * Phase 2: Introduce ES-ES pilot
 * Phase 3: Feature flag activation
 *
 * JurisdictionEngine - single source of truth for clinical jurisdiction config.
 *
 * Checkpoint A:
 * - Only Canada / Ontario (CA-ON) is defined.
 * - No existing behaviour is changed yet.
 * - Future jurisdictions (ES-ES, etc.) will be added here.
 */

import { isSpainPilot } from '@/core/pilotDetection';
import type { ClinicalJurisdiction } from '../consent/consentJurisdiction';
import type { ConsentTextVersion } from '../consent/consentLanguagePolicy';

export type JurisdictionId = ClinicalJurisdiction;

export interface JurisdictionConsentConfig {
  verbalVersionId: ConsentTextVersion;
  writtenVersionId?: ConsentTextVersion;
}

export interface JurisdictionLegalConfig {
  privacyPolicyKey: string;
  termsKey?: string;
  regulatoryFramework: string[];
  marketingClaimsKey: string;
}

/** SOAP review gate: label shown in UI (normative framework + institution that governs). */
export interface JurisdictionSoapReviewConfig {
  frameworkLabel: string;
  institutionName: string;
}

export interface JurisdictionClinicalDocumentsConfig {
  soapPromptProfile: string;
  pdfTemplateId: string;
}

export interface JurisdictionBusinessConfig {
  pricingPlanId: string;
  featureFlags: string[];
}

export interface JurisdictionConfig {
  id: JurisdictionId;
  locale: string;
  language: string;
  region: string;

  consent: JurisdictionConsentConfig;
  legal: JurisdictionLegalConfig;
  /** SOAP review gate: regulatory framework and institution for "review before finalize" messaging. */
  soapReview: JurisdictionSoapReviewConfig;
  clinicalDocuments: JurisdictionClinicalDocumentsConfig;
  business: JurisdictionBusinessConfig;
}

const JURISDICTIONS: Record<JurisdictionId, JurisdictionConfig> = {
  /**
   * Canada - Ontario (PHIPA / PIPEDA context)
   *
   * This entry is intentionally conservative and mirrors the current
   * production setup for the Canadian pilot.
   */
  'CA-ON': {
    id: 'CA-ON',
    locale: 'en-CA',
    language: 'en',
    region: 'CA',

    consent: {
      // v2-en-CA is the CPO TRUST + IPC Ontario aligned verbal text
      verbalVersionId: 'v2-en-CA',
      // writtenVersionId can be wired when the canonical written form is versioned
    },

    legal: {
      privacyPolicyKey: 'privacy_policy_ca',
      termsKey: 'terms_ca',
      regulatoryFramework: ['PHIPA', 'PIPEDA', 'CPO', 'IPC Ontario'],
      marketingClaimsKey: 'marketing_claims_ca',
    },

    soapReview: {
      frameworkLabel: 'CPO TRUST Framework',
      institutionName: 'College of Physiotherapists of Ontario (CPO)',
    },

    clinicalDocuments: {
      soapPromptProfile: 'soap_ca_en',
      pdfTemplateId: 'clinical_report_ca',
    },

    business: {
      pricingPlanId: 'canada_pilot',
      featureFlags: [],
    },
  },

  /**
   * Spain - National physiotherapy context (GDPR / LOPDGDD)
   *
   * Phase 1:
   *  - Defined but never returned by getActiveJurisdiction()
   *  - Safe to keep inactive until ES pilot is ready
   */
  'ES-ES': {
    id: 'ES-ES',
    locale: 'es-ES',
    language: 'es',
    region: 'ES',

    consent: {
      verbalVersionId: 'v1-es-ES-verbal',
      writtenVersionId: 'v1-es-ES-written',
    },

    legal: {
      privacyPolicyKey: 'privacy_policy_es',
      termsKey: 'terms_es',
      regulatoryFramework: ['GDPR', 'LOPDGDD'],
      marketingClaimsKey: 'marketing_claims_es',
    },

    soapReview: {
      // Neutral formulation: regulation rests on colegios autonómicos, legislación sanitaria nacional y normativa europea (GDPR, AI Act). CGCFE coordina colegios, no es autoridad reguladora directa.
      frameworkLabel: 'normativa legal europea, española y de la comunidad autónoma correspondiente',
      institutionName: 'normativa aplicable y colegio profesional de tu comunidad autónoma',
    },

    clinicalDocuments: {
      soapPromptProfile: 'soap_es_es',
      pdfTemplateId: 'clinical_report_es',
    },

    business: {
      pricingPlanId: 'spain_pilot',
      featureFlags: ['spain_pilot'],
    },
  },
};

/**
 * Get full configuration for a jurisdiction.
 * For Checkpoint A we only expose CA-ON, mirroring existing behaviour.
 */
export function getJurisdictionConfig(id: JurisdictionId): JurisdictionConfig {
  const config = JURISDICTIONS[id];
  if (!config) {
    // For now, default hard to CA-ON to avoid changing current behaviour.
    return JURISDICTIONS['CA-ON'];
  }
  return config;
}

/**
 * Simple helper to get the current jurisdiction id.
 * For now this just delegates to the existing consentJurisdiction helper,
 * keeping behaviour identical to production.
 */
export function getActiveJurisdiction(): JurisdictionId {
  // Reuse existing source of truth for current jurisdiction.
  // In later checkpoints this will incorporate profile + geolocation.
  return 'CA-ON';
}

/**
 * UI language selector derived from jurisdiction config.
 *
 * Phase 1: Infrastructure only (no runtime usage) — returns 'en' for CA-ON
 * Phase 2: Used by i18n bootstrap and UI when ES-ES is activated
 */
export function getUiLanguageForJurisdiction(id: JurisdictionId): string {
  const config = getJurisdictionConfig(id);
  switch (config.language) {
    case 'es':
      return 'es';
    case 'fr':
      return 'fr';
    default:
      return 'en';
  }
}

/**
 * Convenience helper for current jurisdiction UI language.
 * Side-effect free: does NOT call i18n.changeLanguage by itself.
 */
export function getUiLanguageForCurrentJurisdiction(): string {
  return getUiLanguageForJurisdiction(getActiveJurisdiction());
}

/**
 * ES-ES pilot feature helper.
 *
 * Phase 1: Controlled by feature flag only (does NOT change active jurisdiction).
 * Phase 2: When ES-ES is activated, this will also check getActiveJurisdiction().
 */
export function isEsPilotEnabled(): boolean {
  return isSpainPilot();
}

/**
 * Jurisdiction to use for SOAP review gate messaging (framework + institution).
 * When Spain pilot is enabled, returns ES-ES so the UI shows European/Spanish regulatory text.
 */
export function getSoapReviewJurisdictionId(): JurisdictionId {
  return isEsPilotEnabled() ? 'ES-ES' : getActiveJurisdiction();
}

/** SOAP review config for current context (for use in SOAP tab and finalize modal). */
export function getSoapReviewConfig(): JurisdictionSoapReviewConfig {
  const id = getSoapReviewJurisdictionId();
  const config = getJurisdictionConfig(id);
  return config.soapReview;
}


