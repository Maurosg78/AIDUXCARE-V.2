/**
 * WO-FU-VERTEX-SPLIT-01 / PROMPT FINAL FOLLOW-UP SOAP (V3)
 *
 * Follow-up is a PARALLEL PATH. It does NOT use Niagara/analyze (no highlights, no physical tests, no biopsychosocial).
 *
 * Hydration for Vertex = exactly three inputs:
 *   1. Patient data (who + injury/condition) — from baseline SOAP (previous evaluation).
 *   2. Exercises: in-clinic treatment today + home program (HEP) — from UI checklists.
 *   3. Clinical notes — transcript from this visit.
 * Output = SOAP only (updated note). No analysis JSON, no intermediate sections.
 *
 * Contrato de hidratación (CTO):
 * - baselineSOAP: clinicalState.baselineSOAP (patient + condition from previous visit).
 * - clinicalUpdate: transcript del follow-up (notas clínicas de esta sesión).
 * - inClinicItems, homeProgram: tratamientos en consulta + ejercicios domiciliarios.
 */

export interface FollowUpPromptV3BaselineSOAP {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  date?: Date;
  encounterId?: string;
}

export interface FollowUpPromptV3Input {
  /** Baseline from previous evaluation (clinicalState.baselineSOAP). Required. */
  baselineSOAP: FollowUpPromptV3BaselineSOAP;
  /** Today's clinical update (transcript). Required. */
  clinicalUpdate: string;
  /** In-clinic treatment performed today. Optional. */
  inClinicItems?: string[];
  /** Home exercise program (current or adjusted). Optional. */
  homeProgram?: string[];
}

/**
 * Builds the follow-up SOAP prompt for Vertex. CTO prompt literal — no interpretation.
 * Output format requested: plain SOAP sections (Subjective:, Objective:, Assessment:, Plan:).
 * Guard: baselineSOAP required — do not call Vertex without baseline.
 */
export function buildFollowUpPromptV3(input: FollowUpPromptV3Input): string {
  const {
    baselineSOAP,
    clinicalUpdate,
    inClinicItems = [],
    homeProgram = [],
  } = input;

  if (!baselineSOAP) {
    throw new Error('Follow-up SOAP requires baselineSOAP; do not call Vertex without baseline.');
  }

  const subj = (baselineSOAP.subjective ?? '').trim() || 'Not documented.';
  const obj = (baselineSOAP.objective ?? '').trim() || 'Not documented.';
  const ass = (baselineSOAP.assessment ?? '').trim() || 'Not documented.';
  const plan = (baselineSOAP.plan ?? '').trim() || 'Not documented.';

  const inClinicSection =
    inClinicItems.length > 0
      ? `CONTEXT — IN-CLINIC TREATMENT PERFORMED TODAY (if provided)

Only consider these items if present.
Do NOT assume additional interventions.

In-clinic treatment performed today:
${inClinicItems.map((item) => `${item}`).join('\n\n')}

`
      : '';

  const hepSection =
    homeProgram.length > 0
      ? `CONTEXT — HOME EXERCISE PROGRAM (if provided)

This represents the current or adjusted home program.
Do NOT invent new home exercises unless clearly justified by the update.

Home exercise program:
${homeProgram.map((item) => `${item}`).join('\n\n')}

`
      : '';

  const prompt = `PATIENT CONTEXT — Follow-up visit. The patient and condition were established at the previous visit; the baseline below contains who we are talking about and what injury/condition is being treated.

SYSTEM / INSTRUCTION

You are a licensed clinical documentation assistant supporting a follow-up visit.

This follow-up documentation is for Ontario, Canada.

ROLE AND LANGUAGE:
- You assist with documentation, you do NOT diagnose
- Reflect ONLY the information provided in the baseline and today's update
- Output in Canadian English (en-CA)
- Use Canadian physiotherapy terminology and spelling

This is NOT an initial assessment.

You must:

Continue care from an existing clinical baseline

Update the patient's condition, do NOT re-evaluate from scratch

Generate a SOAP note only

Be concise, clinically accurate, and consistent with the prior baseline

You must NOT:

Re-diagnose the condition unless the update clearly indicates a change

Invent tests, findings, or interventions not supported by the input

Return highlights, summaries, or analysis sections

Return anything other than the single JSON object defined below.

CONTEXT — BASELINE (PREVIOUS VISIT)

This is the established baseline from the patient's previous evaluation.
Use it as the clinical reference point for this follow-up.

Subjective (previous):
${subj}

Objective (previous):
${obj}

Assessment (previous):
${ass}

Plan (previous):
${plan}

CONTEXT — TODAY'S CLINICAL UPDATE

This is the patient's update from today's follow-up session.
It may include symptom changes, functional progress, tolerance, or adherence.

${(clinicalUpdate ?? '').trim() || 'No additional clinical update provided.'}

${inClinicSection}${hepSection}TASK

Using only the information above:

Update the Subjective based on today's report

Update the Objective based on observed or reported changes

Update the Assessment to reflect progression, response, or tolerance

Do NOT restate the entire diagnosis unless it has changed

Update the Plan:

Reflect progressions or adjustments

Clearly distinguish in-clinic treatment vs home program

The plan should logically follow from the baseline and today's update.

=== OUTPUT FORMAT (MANDATORY) ===

You MUST return ONLY a valid JSON object.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include text before or after the JSON.

Return EXACTLY this structure:

{
  "soap": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "alerts": {
    "red_flags": ["..."] 
  }
}

If there are no red flags, return:

"alerts": { "red_flags": [] }

Red flags MUST include urgent neurological deficits such as:
- Loss of bladder or bowel control
- Saddle anesthesia
- Rapid neurological deterioration

CRITICAL: Only report red flags if they are explicitly mentioned in TODAY'S CLINICAL UPDATE.
Do NOT report red flags based on the baseline alone.
If the baseline documents a prior referral for these symptoms, do NOT re-report them unless today's update confirms they are new or ongoing.

Do NOT include any text outside the JSON object.`;

  return prompt;
}
