/**
 * WO-FU-VERTEX-SPLIT-01 / PROMPT FINAL FOLLOW-UP SOAP (V3)
 * WO-PHASE1B: Enhanced with professional profile, in-clinic adjustment notes, item notes.
 * WO-PHASE1C: P0 Red flags screening + P1 CPO context (promesa iBooks).
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

import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import {
  buildCapabilityContext,
  buildProfessionalContext,
  buildPracticePreferencesContext,
} from '@/core/ai/PromptFactory-Canada';

export interface FollowUpPromptV3BaselineSOAP {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  date?: Date;
  encounterId?: string;
}

/** Item with optional notes (WO-PHASE1B). */
export interface FollowUpPromptItem {
  label: string;
  notes?: string;
}

export interface FollowUpPromptV3Input {
  /** Baseline from previous evaluation (clinicalState.baselineSOAP). Required. */
  baselineSOAP: FollowUpPromptV3BaselineSOAP;
  /** Today's clinical update (transcript). Required. */
  clinicalUpdate: string;
  /** In-clinic treatment performed today. Optional. Supports string[] or {label, notes}[]. */
  inClinicItems?: (string | FollowUpPromptItem)[];
  /** WO-PHASE1B: Treatment adjustments/modifications documented today. */
  inClinicAdjustmentsNotes?: string;
  /** Home exercise program (current or adjusted). Optional. Supports string[] or {label, notes}[]. */
  homeProgram?: (string | FollowUpPromptItem)[];
  /** WO-PHASE1B: Professional profile for personalized AI response. */
  professionalProfile?: ProfessionalProfile | null;
}

/** WO-PHASE1B: Check if profile can use personalization (consent). */
function canUsePersonalization(profile: ProfessionalProfile | null | undefined): boolean {
  return (profile as { dataUseConsent?: { personalizationFromClinicianInputs?: boolean } })?.dataUseConsent
    ?.personalizationFromClinicianInputs !== false;
}

/** Normalize item to { label, notes } for prompt. */
function normalizeItem(item: string | FollowUpPromptItem): { label: string; notes?: string } {
  return typeof item === 'string' ? { label: item } : { label: item.label, notes: item.notes };
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
    inClinicAdjustmentsNotes,
    homeProgram = [],
    professionalProfile,
  } = input;

  if (!baselineSOAP) {
    throw new Error('Follow-up SOAP requires baselineSOAP; do not call Vertex without baseline.');
  }

  const subj = (baselineSOAP.subjective ?? '').trim() || 'Not documented.';
  const obj = (baselineSOAP.objective ?? '').trim() || 'Not documented.';
  const ass = (baselineSOAP.assessment ?? '').trim() || 'Not documented.';
  const plan = (baselineSOAP.plan ?? '').trim() || 'Not documented.';

  // WO-PHASE1B: Professional profile sections (if profile exists and consent allows)
  let profilePrefix = '';
  if (professionalProfile && canUsePersonalization(professionalProfile)) {
    const cap = buildCapabilityContext(professionalProfile);
    const prof = buildProfessionalContext(professionalProfile);
    const prefs = buildPracticePreferencesContext(professionalProfile);
    if (cap || prof || prefs) {
      profilePrefix = [cap, prof, prefs].filter(Boolean).join('\n\n') + '\n\n';
    }
  }

  // WO-PHASE1B: In-clinic with item notes
  const inClinicNormalized = inClinicItems.map(normalizeItem);
  const inClinicSection =
    inClinicNormalized.length > 0
      ? `CONTEXT — IN-CLINIC TREATMENT PERFORMED TODAY (if provided)

Only consider these items if present.
Do NOT assume additional interventions.

In-clinic treatment performed today:
${inClinicNormalized
  .map(
    (item) =>
      `- ${item.label}${item.notes?.trim() ? `\n  Notes: ${item.notes.trim()}` : ''}`
  )
  .join('\n\n')}

`
      : '';

  // WO-PHASE1B: In-clinic adjustments section
  const adjustmentsSection =
    inClinicAdjustmentsNotes?.trim()
      ? `CONTEXT — IN-CLINIC ADJUSTMENTS / UPDATES TODAY:
${inClinicAdjustmentsNotes.trim()}

`
      : '';

  // WO-PHASE1B: HEP with item notes
  const hepNormalized = homeProgram.map(normalizeItem);
  const hepSection =
    hepNormalized.length > 0
      ? `CONTEXT — HOME EXERCISE PROGRAM (if provided)

This represents the current or adjusted home program.
Do NOT invent new home exercises unless clearly justified by the update.

Home exercise program:
${hepNormalized
  .map(
    (item) =>
      `- ${item.label}${item.notes?.trim() ? `\n  Notes: ${item.notes.trim()}` : ''}`
  )
  .join('\n\n')}

`
      : '';

  // WO-PHASE1C P0: Red flags screening — must be between clinical update and TASK
  const safetyCheckSection = `CRITICAL SAFETY CHECK — RED FLAGS / YELLOW FLAGS

Review today's clinical update for NEW red flags or yellow flags that were NOT present at baseline.
If the patient reports any of the following, you MUST document them clearly and recommend medical review/referral:

Red flags (urgent — document and recommend referral):
- Neurological changes: new weakness, numbness, incontinence, saddle anesthesia
- Night pain (especially if new or worsening)
- Unexplained weight loss
- Symptom escalation despite treatment
- Systemic signs: fever, infection
- Major trauma, progressive weakness
- Cancer history with new symptoms
- Medication interactions (NSAIDs + SSRIs/SNRIs)

Yellow flags (monitor — document for clinical awareness):
- Fear avoidance, catastrophizing
- Work/compensation concerns
- Poor adherence patterns
- Psychosocial barriers to recovery

Wording: Use "Clinical concern: [finding]. Recommend medical review/referral based on red flags."
Do NOT use diagnostic language. Do NOT ignore red flags in the update.
If no new flags: Omit this section. Do NOT invent flags.

`;

  const prompt = `${profilePrefix}PATIENT CONTEXT — Follow-up visit. The patient and condition were established at the previous visit; the baseline below contains who we are talking about and what injury/condition is being treated.

SYSTEM / INSTRUCTION

You are a clinical documentation assistant for a registered physiotherapist in Ontario, Canada.
Scope: CPO (College of Physiotherapists of Ontario) regulated practice.
Ensure all suggestions and documentation are within physiotherapy scope per CPO standards.
This is a follow-up visit — focus on changes and progress, not re-evaluation.

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

Return JSON or structured metadata

Your output must be plain clinical text under SOAP headings.

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

${safetyCheckSection}${inClinicSection}${adjustmentsSection}${hepSection}TASK

Using only the information above:

Update the Subjective based on today's report

Update the Objective based on observed or reported changes

Update the Assessment to reflect progression, response, or tolerance

Do NOT restate the entire diagnosis unless it has changed

Update the Plan:

Reflect progressions or adjustments

Clearly distinguish in-clinic treatment vs home program

The plan should logically follow from the baseline and today's update

OUTPUT FORMAT (STRICT)

Return ONLY the following sections, in order.
Each section must describe ONLY what is new or changed today — do not repeat the baseline.

Subjective:
(text)

Objective:
(text)

Assessment:
(text)

Plan:
(text)

FINAL REMINDERS (NON-NEGOTIABLE)

This is a follow-up, not an initial assessment

Do NOT copy the baseline sections verbatim. Your output will be rejected if it repeats large portions of the baseline. Each section must describe ONLY what is new or changed today.

Do NOT return analysis, highlights, or recommendations sections

Do NOT include explanations or meta commentary

Return SOAP only`;

  // WO-PHASE1C: Log temporal para validar que la sección se inyecta
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[buildFollowUpPromptV3] Prompt includes CRITICAL SAFETY CHECK:',
      prompt.includes('CRITICAL SAFETY CHECK')
    );
  }

  return prompt;
}
