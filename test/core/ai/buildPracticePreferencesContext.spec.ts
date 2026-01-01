/**
 * Tests env-free para buildPracticePreferencesContext
 * No requiere Firebase ni variables de entorno
 */

import { describe, it, expect } from 'vitest';
import {
  buildPracticePreferencesContext,
  validateProfileSource,
  type UserProfileData
} from '../../../src/core/ai/buildPracticePreferencesContext';

describe('buildPracticePreferencesContext', () => {
  describe('when userProfile is null or undefined', () => {
    it('should return empty context when profile is null', () => {
      const result = buildPracticePreferencesContext(null);
      
      expect(result.clinicianPreferencesContext).toBe('');
      expect(result.patientContextNote).toContain('current session data only');
    });

    it('should return empty context when profile is undefined', () => {
      const result = buildPracticePreferencesContext(undefined);
      
      expect(result.clinicianPreferencesContext).toBe('');
      expect(result.patientContextNote).toContain('current session data only');
    });
  });

  describe('when personalizationFromClinicianInputs is false', () => {
    it('should NOT include [Clinician Practice Preferences] in prompt', () => {
      const profile: UserProfileData = {
        dataUseConsent: {
          personalizationFromClinicianInputs: false,
          personalizationFromPatientData: true
        },
        practicePreferences: {
          preferredTreatments: ['Manual Therapy', 'Exercise'],
          preferredAssessmentTools: ['ROM', 'Strength']
        }
      };

      const result = buildPracticePreferencesContext(profile);
      
      expect(result.clinicianPreferencesContext).toBe('');
      expect(result.clinicianPreferencesContext).not.toContain('[Clinician Practice Preferences]');
    });
  });

  describe('when personalizationFromClinicianInputs is true', () => {
    it('should include [Clinician Practice Preferences] in prompt', () => {
      const profile: UserProfileData = {
        dataUseConsent: {
          personalizationFromClinicianInputs: true,
          personalizationFromPatientData: true
        },
        practicePreferences: {
          preferredTreatments: ['Manual Therapy', 'Exercise'],
          preferredAssessmentTools: ['ROM', 'Strength'],
          clinicalApproach: 'Evidence-based',
          documentationStyle: 'SOAP'
        }
      };

      const result = buildPracticePreferencesContext(profile);
      
      expect(result.clinicianPreferencesContext).toContain('[Clinician Practice Preferences]');
      expect(result.clinicianPreferencesContext).toContain('Preferred treatments: Manual Therapy, Exercise');
      expect(result.clinicianPreferencesContext).toContain('Preferred assessment tools: ROM, Strength');
      expect(result.clinicianPreferencesContext).toContain('Clinical approach: Evidence-based');
      expect(result.clinicianPreferencesContext).toContain('Documentation style: SOAP');
      expect(result.clinicianPreferencesContext).toContain("prioritize the clinician's preferred treatments");
    });

    it('should handle partial preferences', () => {
      const profile: UserProfileData = {
        dataUseConsent: {
          personalizationFromClinicianInputs: true,
          personalizationFromPatientData: false
        },
        practicePreferences: {
          preferredTreatments: ['Manual Therapy']
        }
      };

      const result = buildPracticePreferencesContext(profile);
      
      expect(result.clinicianPreferencesContext).toContain('[Clinician Practice Preferences]');
      expect(result.clinicianPreferencesContext).toContain('Preferred treatments: Manual Therapy');
    });
  });

  describe('when personalizationFromPatientData is false', () => {
    it('should indicate current session only', () => {
      const profile: UserProfileData = {
        dataUseConsent: {
          personalizationFromClinicianInputs: true,
          personalizationFromPatientData: false
        },
        practicePreferences: {}
      };

      const result = buildPracticePreferencesContext(profile);
      
      expect(result.patientContextNote).toContain('current session data only');
      expect(result.patientContextNote).toContain('not consented');
    });
  });

  describe('when personalizationFromPatientData is true', () => {
    it('should indicate patient history available', () => {
      const profile: UserProfileData = {
        dataUseConsent: {
          personalizationFromClinicianInputs: false,
          personalizationFromPatientData: true
        }
      };

      const result = buildPracticePreferencesContext(profile);
      
      expect(result.patientContextNote).toContain('patient history');
      expect(result.patientContextNote).toContain('episode data');
    });
  });
});

describe('validateProfileSource', () => {
  it('should return false for null profile', () => {
    expect(validateProfileSource(null)).toBe(false);
  });

  it('should return false for undefined profile', () => {
    expect(validateProfileSource(undefined)).toBe(false);
  });

  it('should return true for profile with required fields from users/{uid}', () => {
    const profile: UserProfileData = {
      practicePreferences: {},
      dataUseConsent: {
        personalizationFromClinicianInputs: true,
        personalizationFromPatientData: true
      },
      registrationStatus: 'complete'
    };

    expect(validateProfileSource(profile)).toBe(true);
  });

  it('should validate UID when provided', () => {
    const profile: UserProfileData = {
      practicePreferences: {},
      dataUseConsent: {
        personalizationFromClinicianInputs: true,
        personalizationFromPatientData: true
      },
      registrationStatus: 'complete'
    };

    const profileWithUid = { ...profile, uid: 'test-uid-123' } as any;
    
    expect(validateProfileSource(profileWithUid, 'test-uid-123')).toBe(true);
    expect(validateProfileSource(profileWithUid, 'wrong-uid')).toBe(false);
  });

  it('should return false for profile without required fields', () => {
    const profile = {
      displayName: 'Test User',
      email: 'test@example.com'
    };

    expect(validateProfileSource(profile as any)).toBe(false);
  });
});

