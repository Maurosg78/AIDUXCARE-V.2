/**
 * WO-FU-VERTEX-SPLIT-01: Tests for follow-up SOAP prompt V3 (CTO literal).
 * Input: baselineSOAP + clinicalUpdate + inClinicItems? + homeProgram?
 * Output: plain SOAP headings only (no JSON, no Niagara).
 */

import { describe, it, expect } from 'vitest';
import { buildFollowUpPromptV3 } from '../buildFollowUpPromptV3';

const baselineSOAP = {
  subjective: 'Mechanical LBP.',
  objective: 'Limited ROM.',
  assessment: 'Mechanical LBP. No imaging indicated.',
  plan: 'Interventions: Manual therapy, education.\nHome Exercises: Core stability.',
  encounterId: 'enc-1',
  date: new Date('2025-01-20T14:00:00.000Z'),
};

describe('buildFollowUpPromptV3', () => {
  it('throws when baselineSOAP is missing', () => {
    expect(() =>
      buildFollowUpPromptV3({
        baselineSOAP: undefined as any,
        clinicalUpdate: 'Update',
      })
    ).toThrow('baselineSOAP');
  });

  it('includes CONTEXT — BASELINE with previous S,O,A,P', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Patient reports 50% improvement. ROM improved.',
    });
    expect(prompt).toContain('CONTEXT — BASELINE (PREVIOUS VISIT)');
    expect(prompt).toContain('Subjective (previous):');
    expect(prompt).toContain('Objective (previous):');
    expect(prompt).toContain('Assessment (previous):');
    expect(prompt).toContain('Plan (previous):');
    expect(prompt).toContain('Mechanical LBP.');
    expect(prompt).toContain('Limited ROM.');
    expect(prompt).toContain('Manual therapy');
    expect(prompt).toContain('Core stability');
  });

  it('includes CONTEXT — TODAY\'S CLINICAL UPDATE', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Patient reports 50% improvement. ROM improved.',
    });
    expect(prompt).toContain("CONTEXT — TODAY'S CLINICAL UPDATE");
    expect(prompt).toContain('Patient reports 50% improvement. ROM improved.');
  });

  it('includes IN-CLINIC section when inClinicItems provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      inClinicItems: ['Manual therapy', 'ROM exercises'],
    });
    expect(prompt).toContain('CONTEXT — IN-CLINIC TREATMENT PERFORMED TODAY (if provided)');
    expect(prompt).toContain('Manual therapy');
    expect(prompt).toContain('ROM exercises');
  });

  it('includes HOME EXERCISE PROGRAM when homeProgram provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      homeProgram: ['Core stability 3x/day', 'Stretching 2x/day'],
    });
    expect(prompt).toContain('CONTEXT — HOME EXERCISE PROGRAM (if provided)');
    expect(prompt).toContain('Core stability 3x/day');
    expect(prompt).toContain('Stretching 2x/day');
  });

  it('omits in-clinic and HEP sections when not provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
    });
    expect(prompt).not.toContain('IN-CLINIC TREATMENT PERFORMED TODAY');
    expect(prompt).not.toContain('HOME EXERCISE PROGRAM');
  });

  it('requests JSON output with soap + alerts and task is documentation not decision', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
    });
    expect(prompt).toContain('You MUST return ONLY a valid JSON object');
    expect(prompt).toContain('"soap":');
    expect(prompt).toContain('"subjective":');
    expect(prompt).toContain('"objective":');
    expect(prompt).toContain('"assessment":');
    expect(prompt).toContain('"plan":');
    expect(prompt).toContain('Return anything other than the single JSON object');
    expect(prompt).toContain('rewrite the SOAP note reflecting today\'s encounter');
    expect(prompt).toContain('You must NOT decide next treatment strategy');
  });

  it('states this is NOT an initial assessment', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
    });
    expect(prompt).toContain('This is NOT an initial assessment');
    expect(prompt).toContain('follow-up');
  });

  it('includes LONGITUDINAL CONTEXT and guardrail when longitudinalSummary provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      longitudinalSummary: 'Pain 7/10 → 4/10. Overall: improved.',
    });
    expect(prompt).toContain('LONGITUDINAL CONTEXT — CHANGES SINCE LAST VISIT');
    expect(prompt).toContain('Pain 7/10 → 4/10');
    expect(prompt).toContain('documentation continuity');
    expect(prompt).toContain('Do not infer new diagnoses or treatment decisions from it');
    expect(prompt).toContain('use it only to describe evolution of symptoms or response to care');
    expect(prompt).toContain('Do not transform the longitudinal information into treatment strategy');
  });

  it('includes TRAJECTORY PATTERN block when trajectoryPattern provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      trajectoryPattern: 'improved',
      trajectoryConfidence: 'high',
    });
    expect(prompt).toContain('TRAJECTORY PATTERN (context only)');
    expect(prompt).toContain('Pain trajectory classification: improved');
    expect(prompt).toContain('confidence: high');
    expect(prompt).toContain('Use this information only to describe patient evolution');
    expect(prompt).toContain('Do not infer treatment decisions');
  });

  it('includes pain series (recent visits) when painSeriesSummary provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      painSeriesSummary: '7 → 5 → 4',
    });
    expect(prompt).toContain('TRAJECTORY PATTERN (context only)');
    expect(prompt).toContain('Pain series (recent visits): 7 → 5 → 4');
    expect(prompt).toContain('Use this information only to describe patient evolution');
  });

  it('includes PREVIOUS TREATMENT PLAN(S) and context-only guardrail when previousPlansSummary provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      previousPlansSummary: 'Focus: Reassess ROM. Interventions: Manual therapy.',
    });
    expect(prompt).toContain('PREVIOUS TREATMENT PLAN(S) — CONTEXT ONLY');
    expect(prompt).toContain('Use the previous plan ONLY as context');
    expect(prompt).toContain('Do NOT introduce new interventions');
    expect(prompt).toContain('Reassess ROM');
  });
});
