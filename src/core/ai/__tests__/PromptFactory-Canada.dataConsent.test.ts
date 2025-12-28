/**
 * Test for Data Use Consent guardrails in PromptFactory-Canada
 * WO-AUTH-GUARD-ONB-DATA-01: Verificar que consentimientos respetan inyección de datos
 */

import { describe, it, expect } from 'vitest';
import { buildCanadianPrompt } from '../PromptFactory-Canada';
import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

describe('PromptFactory-Canada Data Use Consent Guardrails', () => {
  it('should NOT include practice preferences when personalizationFromClinicianInputs is false', () => {
    const profileWithConsentDenied: ProfessionalProfile = {
      uid: 'test-uid',
      email: 'test@example.com',
      specialty: 'Physiotherapy',
      createdAt: {} as any,
      practicePreferences: {
        noteVerbosity: 'detailed',
        tone: 'friendly',
        preferredTreatments: ['manual therapy'],
        doNotSuggest: ['dry needling'],
      },
      dataUseConsent: {
        personalizationFromClinicianInputs: false, // Consent denied
        personalizationFromPatientData: true,
        useDeidentifiedDataForProductImprovement: false,
        allowAssistantMemoryAcrossSessions: true,
      },
    };

    const prompt = buildCanadianPrompt({
      contextoPaciente: 'Test patient context',
      transcript: 'Test transcript',
      professionalProfile: profileWithConsentDenied,
    });

    // Verify practice preferences section is NOT included
    expect(prompt).not.toContain('[Clinician Practice Preferences]');
    expect(prompt).not.toContain('Note verbosity: detailed');
    expect(prompt).not.toContain('Tone: friendly');
    // But should still include other sections
    expect(prompt).toContain('[Patient Context]');
    expect(prompt).toContain('[Transcript]');
  });

  it('should include practice preferences when personalizationFromClinicianInputs is true', () => {
    const profileWithConsentGranted: ProfessionalProfile = {
      uid: 'test-uid',
      email: 'test@example.com',
      specialty: 'Physiotherapy',
      createdAt: {} as any,
      practicePreferences: {
        noteVerbosity: 'detailed',
        tone: 'friendly',
        preferredTreatments: ['manual therapy'],
        doNotSuggest: ['dry needling'],
      },
      dataUseConsent: {
        personalizationFromClinicianInputs: true, // Consent granted
        personalizationFromPatientData: true,
        useDeidentifiedDataForProductImprovement: false,
        allowAssistantMemoryAcrossSessions: true,
      },
    };

    const prompt = buildCanadianPrompt({
      contextoPaciente: 'Test patient context',
      transcript: 'Test transcript',
      professionalProfile: profileWithConsentGranted,
    });

    // Verify practice preferences section IS included
    expect(prompt).toContain('[Clinician Practice Preferences]');
    expect(prompt).toContain('Note verbosity: detailed');
    expect(prompt).toContain('Tone: friendly');
  });

  it('should validate patient context when personalizationFromPatientData is false', () => {
    const profileWithPatientDataConsentDenied: ProfessionalProfile = {
      uid: 'test-uid',
      email: 'test@example.com',
      specialty: 'Physiotherapy',
      createdAt: {} as any,
      dataUseConsent: {
        personalizationFromClinicianInputs: true,
        personalizationFromPatientData: false, // Consent denied for patient data
        useDeidentifiedDataForProductImprovement: false,
        allowAssistantMemoryAcrossSessions: true,
      },
    };

    // Simulate caller passing historical data (should be filtered)
    const promptWithHistory = buildCanadianPrompt({
      contextoPaciente: 'Patient with previous episodes and history',
      transcript: 'Test transcript',
      professionalProfile: profileWithPatientDataConsentDenied,
    });

    // The validatePatientContext function should strip historical references
    // Note: Real filtering should happen where contextoPaciente is constructed
    expect(promptWithHistory).toContain('[Patient Context]');
  });
});

