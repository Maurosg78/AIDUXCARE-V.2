/**
 * Tests for SOAP prompt factory professional profile (role line).
 */

import { describe, it, expect } from 'vitest';
import { buildInitialAssessmentPrompt } from '../SOAPPromptFactory';
import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import type { SOAPContext } from '../SOAPContextBuilder';

const minimalContext: SOAPContext = {
  transcript: 'Patient reports lower back pain.',
  visitType: 'initial',
  analysis: {
    redFlags: [],
    yellowFlags: [],
    medications: [],
    keyFindings: [],
    medicalHistory: [],
    biopsychosocial: {
      psychological: [],
      social: [],
      occupational: [],
      protective: [],
      functionalLimitations: [],
      patientStrengths: [],
    },
  },
  patientContext: {},
  physicalExamResults: [],
  physicalEvaluation: { tests: [], summary: '' },
};

describe('SOAPPromptFactory professional profile', () => {
  it('uses default physiotherapist role when no profile', () => {
    const prompt = buildInitialAssessmentPrompt(minimalContext, undefined);
    expect(prompt).toContain('a registered physiotherapist in Ontario, Canada');
  });

  it('uses chiropractor role when profile.profession is Chiropractor', () => {
    const profile: ProfessionalProfile = {
      uid: 'u1',
      email: 'c@example.com',
      profession: 'Chiropractor',
      createdAt: {} as any,
    };
    const prompt = buildInitialAssessmentPrompt(minimalContext, { professionalProfile: profile });
    expect(prompt).toContain('a licensed chiropractor in Ontario, Canada');
  });

  it('uses physiotherapist role when profile.profession is Physiotherapist', () => {
    const profile: ProfessionalProfile = {
      uid: 'u1',
      email: 'p@example.com',
      profession: 'Physiotherapist',
      createdAt: {} as any,
    };
    const prompt = buildInitialAssessmentPrompt(minimalContext, { professionalProfile: profile });
    expect(prompt).toContain('a registered physiotherapist in Ontario, Canada');
  });

  it('uses healthcare professional when profile.profession is Other and no professionOther', () => {
    const profile: ProfessionalProfile = {
      uid: 'u1',
      email: 'o@example.com',
      profession: 'Other',
      createdAt: {} as any,
    };
    const prompt = buildInitialAssessmentPrompt(minimalContext, { professionalProfile: profile });
    expect(prompt).toContain('a registered healthcare professional in Ontario, Canada');
  });

  it('uses normalized professionOther label when profile.profession is Other and professionOther set', () => {
    const profile: ProfessionalProfile = {
      uid: 'u1',
      email: 'o@example.com',
      profession: 'Other',
      professionOther: { raw: 'Osteopata', labelForPrompt: 'Osteopath' },
      createdAt: {} as any,
    };
    const prompt = buildInitialAssessmentPrompt(minimalContext, { professionalProfile: profile });
    expect(prompt).toContain('a registered osteopath in Ontario, Canada');
  });
});
