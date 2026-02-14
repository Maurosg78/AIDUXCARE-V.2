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

  it('requests plain SOAP output only (no JSON)', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
    });
    expect(prompt).toContain('Return ONLY the following sections');
    expect(prompt).toContain('Subjective:');
    expect(prompt).toContain('Objective:');
    expect(prompt).toContain('Assessment:');
    expect(prompt).toContain('Plan:');
    expect(prompt).toContain('Do NOT return analysis, highlights');
    expect(prompt).toContain('Return SOAP only');
  });

  it('states this is NOT an initial assessment', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
    });
    expect(prompt).toContain('This is NOT an initial assessment');
    expect(prompt).toContain('follow-up');
  });

  // WO-PHASE1C P0: Red flags screening
  it('includes CRITICAL SAFETY CHECK section for red/yellow flags', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Patient reports 50% improvement.',
    });
    expect(prompt).toContain('CRITICAL SAFETY CHECK');
    expect(prompt).toContain('red flags');
    expect(prompt).toContain('yellow flags');
    expect(prompt).toContain('Clinical concern:');
    expect(prompt).toContain('Recommend medical review/referral');
    expect(prompt).toContain('Do NOT invent flags');
  });

  // WO-PHASE1C P0: Test scenario — clinical update with red flag content
  it('includes safety check when clinical update contains red flag keywords', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Patient reports new night pain and 5kg weight loss in 2 weeks',
    });
    expect(prompt).toContain('CRITICAL SAFETY CHECK');
    expect(prompt).toContain('Patient reports new night pain and 5kg weight loss in 2 weeks');
    expect(prompt).toContain('Night pain');
    expect(prompt).toContain('Unexplained weight loss');
  });

  // WO-PHASE1C P1: CPO context
  it('includes CPO and Ontario context in SYSTEM/INSTRUCTION', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
    });
    expect(prompt).toContain('Ontario, Canada');
    expect(prompt).toContain('CPO');
    expect(prompt).toContain('College of Physiotherapists of Ontario');
    expect(prompt).toContain('physiotherapy scope');
  });
});
