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
  /**
   * Optional longitudinal summary since last visit (deltas, progress, alerts).
   * Built from SessionComparisonService / longitudinal analysis.
   */
  longitudinalSummary?: string;
  /**
   * Optional trajectory pattern from TrajectoryClassifier (improved | regressed | plateau | fluctuating).
   * Context only; model must only describe evolution, not infer treatment strategy.
   */
  trajectoryPattern?: string;
  /** Optional confidence for trajectory (low | medium | high). */
  trajectoryConfidence?: string;
  /**
   * Optional short pain series for narrative continuity (e.g. "7 → 5 → 4" or "7 → 4").
   * Helps the model generate natural evolution phrasing without inferring treatment.
   */
  painSeriesSummary?: string;
  /**
   * Optional summary of previous treatment plan(s) (e.g. last 1–2 plans from treatment_plans).
   * For documentation continuity only. Model must use ONLY as context; no new interventions unless in today's input.
   */
  previousPlansSummary?: string;
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
    longitudinalSummary,
    trajectoryPattern,
    trajectoryConfidence,
    painSeriesSummary,
    previousPlansSummary,
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

  const longitudinalSection =
    longitudinalSummary && longitudinalSummary.trim().length > 0
      ? `LONGITUDINAL CONTEXT — CHANGES SINCE LAST VISIT (if provided)

Use this ONLY to understand evolution between the previous completed session and today.
Do NOT invent new findings; reflect only what is clearly documented here.
The longitudinal context is provided for documentation continuity. Do not infer new diagnoses or treatment decisions from it.
If longitudinal context is provided, use it only to describe evolution of symptoms or response to care. Do not transform the longitudinal information into treatment strategy.

${longitudinalSummary.trim()}

`
      : '';

  const trajectorySection =
    (trajectoryPattern && trajectoryPattern.trim().length > 0) || (painSeriesSummary && painSeriesSummary.trim().length > 0)
      ? `TRAJECTORY PATTERN (context only)

${painSeriesSummary && painSeriesSummary.trim().length > 0 ? `Pain series (recent visits): ${painSeriesSummary.trim()}\n\n` : ''}${trajectoryPattern && trajectoryPattern.trim().length > 0 ? `Pain trajectory classification: ${trajectoryPattern.trim()}${trajectoryConfidence ? ` (confidence: ${trajectoryConfidence})` : ''}\nSignal source: longitudinal analysis.\n` : ''}Use this information only to describe patient evolution. Do not infer treatment decisions.

`
      : '';

  const previousPlansSection =
    previousPlansSummary && previousPlansSummary.trim().length > 0
      ? `PREVIOUS TREATMENT PLAN(S) — CONTEXT ONLY

Use the previous plan ONLY as context to maintain narrative continuity.
Do NOT introduce new interventions, progressions, or recommendations unless explicitly documented in today's session input.
Your task is to document what was done and decided today, not to decide next treatment strategy.

${previousPlansSummary.trim()}

`
      : '';

  const prompt = `MANDATORY: All output MUST be in Canadian English (en-CA). Do not use any other language regardless of the language of the transcript or input data.
Today's date: ${new Date().toLocaleDateString('en-CA')}. Use this as the current date for all clinical reasoning. Do not infer dates from document metadata.

PATIENT CONTEXT — Follow-up visit. The patient and condition were established at the previous visit; the baseline below contains who we are talking about and what injury/condition is being treated.

SYSTEM / INSTRUCTION

You are a licensed clinical documentation assistant supporting a follow-up visit.

This follow-up documentation is for Ontario, Canada.

ROLE AND LANGUAGE:
- You assist with documentation, you do NOT diagnose
- Reflect ONLY the information provided in the baseline and today's update
- Output in Canadian English (en-CA)
- Use Canadian physiotherapy terminology and spelling

SOURCE OF TRUTH CONSTRAINT:
- All clinical statements must originate from:
  - the baseline SOAP,
  - today's clinical update,
  - in-clinic items and home program items provided.
- Do NOT introduce new tests, findings, diagnoses, treatments, or recommendations that are not present in the input data.

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

${inClinicSection}${hepSection}${longitudinalSection}${trajectorySection}${previousPlansSection}TASK

Your role is to rewrite the SOAP note reflecting today's encounter. You must NOT decide next treatment strategy.

Using only the information above:

Update the Subjective based on today's report

Update the Objective based on observed or reported changes

Update the Assessment to summarise progression, response, or tolerance as documented by the clinician

Do NOT restate the entire diagnosis unless it has changed

Update the Plan:

Reflect progressions or adjustments ONLY if they are clearly documented in the baseline and today's inputs

Clearly distinguish in-clinic treatment vs home program

The plan should logically follow from the baseline and today's update, without adding new interventions not present in the input data. Structure and summarise; do not generate treatment decisions.

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
