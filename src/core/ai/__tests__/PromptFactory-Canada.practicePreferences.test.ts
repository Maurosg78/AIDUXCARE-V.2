/**
 * Test for Practice Preferences injection in PromptFactory-Canada
 * WO-PERS-ONB-PROMPT-01: Verificar que practicePreferences se inyectan en el prompt
 */

import { describe, it, expect } from 'vitest';
import { buildCanadianPrompt } from '../PromptFactory-Canada';
import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

describe('PromptFactory-Canada Practice Preferences', () => {
  it('should include practice preferences section when profile has practicePreferences', () => {
    const profileWithPrefs: ProfessionalProfile = {
      uid: 'test-uid',
      email: 'test@example.com',
      specialty: 'Physiotherapy',
      professionalTitle: 'PT',
      createdAt: {} as any,
      practicePreferences: {
        noteVerbosity: 'detailed',
        tone: 'friendly',
        preferredTreatments: ['manual therapy', 'graded exposure', 'education'],
        doNotSuggest: ['dry needling'],
      },
    };

    const prompt = buildCanadianPrompt({
      contextoPaciente: 'Test patient context',
      transcript: 'Test transcript',
      professionalProfile: profileWithPrefs,
    });

    // Verify practice preferences section is included
    expect(prompt).toContain('[Clinician Practice Preferences]');
    expect(prompt).toContain('Note verbosity: detailed');
    expect(prompt).toContain('Tone: friendly');
    expect(prompt).toContain('Preferred treatments: manual therapy, graded exposure, education');
    expect(prompt).toContain('Do-not-suggest: dry needling');
  });

  it('should not include practice preferences section when profile has no practicePreferences', () => {
    const profileWithoutPrefs: ProfessionalProfile = {
      uid: 'test-uid',
      email: 'test@example.com',
      specialty: 'Physiotherapy',
      createdAt: {} as any,
    };

    const prompt = buildCanadianPrompt({
      contextoPaciente: 'Test patient context',
      transcript: 'Test transcript',
      professionalProfile: profileWithoutPrefs,
    });

    // Verify practice preferences section is NOT included
    expect(prompt).not.toContain('[Clinician Practice Preferences]');
    // But should not break - should still include other sections
    expect(prompt).toContain('[Patient Context]');
    expect(prompt).toContain('[Transcript]');
  });

  it('should not break when profile is null', () => {
    const prompt = buildCanadianPrompt({
      contextoPaciente: 'Test patient context',
      transcript: 'Test transcript',
      professionalProfile: null,
    });

    // Should not break - should still generate prompt
    expect(prompt).toContain('[Patient Context]');
    expect(prompt).toContain('[Transcript]');
    expect(prompt).not.toContain('[Clinician Practice Preferences]');
  });
});

