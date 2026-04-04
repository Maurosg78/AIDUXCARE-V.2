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
    expect(prompt).toContain('documentation source of truth for symptom evolution');
    expect(prompt).toContain('Do not infer new diagnoses or undocumented treatment decisions from it');
  });

  it('includes TRAJECTORY PATTERN block when trajectoryPattern provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      trajectoryPattern: 'improved',
      trajectoryConfidence: 'high',
    });
    expect(prompt).toContain('TRAJECTORY PATTERN AND PAIN TREND');
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
    expect(prompt).toContain('TRAJECTORY PATTERN AND PAIN TREND');
    expect(prompt).toContain('Pain series (recent visits): 7 → 5 → 4');
    expect(prompt).toContain('Use this information only to describe patient evolution');
  });

  it('includes PATIENT LONGITUDINAL MEMORY PATTERN when patternInsightSummary provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      patternInsightSummary: 'This patient typically shows gradual improvement with short plateaus before further progress.',
    });
    expect(prompt).toContain('PATIENT LONGITUDINAL MEMORY PATTERN');
    expect(prompt).toContain('gradual improvement with short plateaus');
    expect(prompt).toContain('keep continuity with how this patient has been responding across sessions');
    expect(prompt).toContain('Do not convert this pattern into a new diagnosis');
  });

  it('includes CURRENT HOME PROGRAM ADHERENCE when provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      currentHepAdherenceSummary: 'HEP adherence today: 3/4 completed (75%).',
    });
    expect(prompt).toContain('CURRENT HOME PROGRAM ADHERENCE');
    expect(prompt).toContain('HEP adherence today: 3/4 completed (75%).');
    expect(prompt).toContain('current structured HEP adherence provided');
  });

  it('includes PREVIOUS TREATMENT PLAN(S) and continuity guardrail when previousPlansSummary provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      previousPlansSummary: 'Focus: Reassess ROM. Interventions: Manual therapy.',
    });
    expect(prompt).toContain('PREVIOUS TREATMENT PLAN(S)');
    expect(prompt).toContain('Use the previous plan to maintain clinical continuity');
    expect(prompt).toContain('Do NOT introduce new interventions');
    expect(prompt).toContain('Reassess ROM');
  });

  it('includes reviewed attachments section and source guardrails when provided', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      reviewedAttachmentsSummary: 'Imagen clínica revisada hoy — descripción automática no diagnóstica — RX muñeca: hallazgos sugerentes de cambios estables.',
    });
    expect(prompt).toContain('OBJECTIVE FINDINGS FROM ATTACHMENTS REVIEWED TODAY');
    expect(prompt).toContain('Imagen clínica revisada hoy — descripción automática no diagnóstica');
    expect(prompt).toContain('Do NOT convert ambiguous patient retelling into objective findings');
    expect(prompt).toContain('make the source explicit as attachment/report review from today');
    expect(prompt).toContain('Do NOT write that an image "confirms"');
    expect(prompt).toContain('the image does not constitute a diagnosis');
  });

  it('includes longitudinal and previous plan inputs in source of truth and task requirements', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP,
      clinicalUpdate: 'Update',
      longitudinalSummary: 'Pain reduced since last visit.',
      previousPlansSummary: 'Continue ROM and loading progression.',
      patternInsightSummary: 'Usually improves gradually.',
      reviewedAttachmentsSummary: 'Adjunto revisado hoy — imagen: cambios estables.',
    });
    expect(prompt).toContain('longitudinal context / pain trend / trajectory data provided');
    expect(prompt).toContain('previous treatment plan information provided');
    expect(prompt).toContain('patient longitudinal memory pattern provided');
    expect(prompt).toContain('attachment findings explicitly marked as reviewed today');
    expect(prompt).toContain('explicitly state the clinical change versus the previous completed session');
    expect(prompt).toContain('connect today\'s plan to the patient\'s response, tolerance, adherence, or progression');
    expect(prompt).toContain('begin the Plan with one brief continuity sentence stating whether today\'s care continues, progresses, or adjusts the prior plan');
    expect(prompt).toContain('avoid saying "without changes" unless the input explicitly states that today\'s plan was unchanged');
    expect(prompt).toContain('prefer wording such as continuing care with progression according to tolerance');
    expect(prompt).toContain('Prefer concise EMR-style clinical wording over narrative prose');
    expect(prompt).toContain('If no new objective measures or examination findings are documented today, state clearly that no new objective measures were recorded today');
    expect(prompt).toContain('Do NOT restate baseline objective findings as if they were newly measured today');
    expect(prompt).toContain('Do NOT place progress, stability, response to treatment, or general clinical interpretation in Objective');
    expect(prompt).toContain('Only include attachment-derived findings in Objective when they are present in the "attachments reviewed today" section');
    expect(prompt).toContain('Subjective MUST be MAX 4 lines');
    expect(prompt).toContain('Objective MUST be MAX 2 lines');
    expect(prompt).toContain('Assessment MUST be MAX 4 lines');
    expect(prompt).toContain('Use concise consensus abbreviations when clinically appropriate: EVA, ROM, HEP, Cx, Rx, AINE');
    expect(prompt).toContain('The Plan must contain ONLY these two treatment sections and no additional section:');
    expect(prompt).toContain('TRATAMIENTO EN CLÍNICA:');
    expect(prompt).toContain('HEP:');
    expect(prompt).toContain('Do NOT include any "additional recommendations" section');
    expect(prompt).toContain('Do NOT include duplicate labels or expanded duplicate headings');
  });
});
