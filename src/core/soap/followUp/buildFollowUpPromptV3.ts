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

import { getSoapJurisdictionContext } from '../../prompts/soapJurisdictionContext';

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
   * Optional pattern insight from patient trajectory memory.
   * Use as longitudinal memory to describe recurrent response patterns only.
   */
  patternInsightSummary?: string;
  /**
   * Optional structured summary of current HEP adherence from today's checklist.
   * Use only to document adherence explicitly confirmed today.
   */
  currentHepAdherenceSummary?: string;
  /**
   * Optional summary of previous treatment plan(s) (e.g. last 1–2 plans from treatment_plans).
   * For documentation continuity and linkage to today's response; no new interventions unless in today's input.
   */
  previousPlansSummary?: string;
  /**
   * Optional structured summary of attachments explicitly reviewed in today's session.
   * Attachment findings may enter Objective only when this section is present.
   */
  reviewedAttachmentsSummary?: string;
  /** In-clinic treatment performed today. Optional. */
  inClinicItems?: string[];
  /** Home exercise program (current or adjusted). Optional. */
  homeProgram?: string[];
  /** Whether the clinician explicitly edited or confirmed today's HEP decision. */
  homeProgramDecisionProvided?: boolean;
  /** When ES-ES, prompt and model output target Spanish; otherwise en-CA. */
  jurisdiction?: string;
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
    patternInsightSummary,
    currentHepAdherenceSummary,
    previousPlansSummary,
    reviewedAttachmentsSummary,
    inClinicItems = [],
    homeProgram = [],
  } = input;
  const homeProgramDecisionWasMade = input.homeProgramDecisionProvided === true;

  if (!baselineSOAP) {
    throw new Error('Follow-up SOAP requires baselineSOAP; do not call Vertex without baseline.');
  }

  const soapJurisdiction = getSoapJurisdictionContext(input.jurisdiction);
  const followUpJurisdictionNarrativeEs = `Este seguimiento se documenta para la práctica en ${soapJurisdiction.region}, conforme a ${soapJurisdiction.regulation} y a ${soapJurisdiction.standard} del ${soapJurisdiction.college}.`;
  const followUpJurisdictionNarrativeEn = `This follow-up documentation is for ${soapJurisdiction.region}. Regulatory context: ${soapJurisdiction.regulation}. Professional standards: ${soapJurisdiction.college} (${soapJurisdiction.standard}).`;
  const followApplicableJurisdictionNarrative =
    input.jurisdiction === 'ES-ES' ? followUpJurisdictionNarrativeEs : followUpJurisdictionNarrativeEn;

  const outputLanguage = input.jurisdiction === 'ES-ES' ? 'español' : 'Canadian English (en-CA)';
  const outputLocale = input.jurisdiction === 'ES-ES' ? 'es-ES' : 'en-CA';
  const physiotherapyTerminologyGuidance =
    input.jurisdiction === 'ES-ES'
      ? 'Use standard Spanish physiotherapy terminology and spelling'
      : 'Use Canadian physiotherapy terminology and spelling';
  const objectiveEvolutionInstructionEs = `INSTRUCCIÓN CRÍTICA PARA SECCIÓN O — EVOLUCIÓN OBJETIVA:
Cuando LONGITUDINAL CONTEXT o TRAJECTORY PATTERN AND PAIN TREND contengan métricas comparativas documentadas, incluye esas métricas en la sección O como evolución objetiva documentada longitudinalmente, no como hallazgos medidos de nuevo hoy.

Formato requerido para datos comparativos:
- Datos de dolor: "Dolor EVA: [previo]/10 → [actual]/10"
- Datos de ROM: "ROM [movimiento]: [previo]° → [actual]°"
- Medida funcional/objetiva: "[medida]: [previo] → [actual]"
- Progreso general solo cuando esté explícitamente documentado: "Evolución clínica: [mejoría/deterioro/estable] desde la sesión anterior"

NO uses lenguaje vago como "progreso estable" o "mejoría general" si hay datos comparativos específicos disponibles.
NO inventes datos que no estén presentes en LONGITUDINAL CONTEXT o TRAJECTORY PATTERN AND PAIN TREND.
NO conviertas narrativa del paciente en hallazgos objetivos salvo que se proporcione como métrica comparativa estructurada.
Si no hay datos comparativos disponibles, documenta solo los hallazgos de hoy.`;
  const objectiveEvolutionInstructionEn = `CRITICAL INSTRUCTION FOR OBJECTIVE SECTION — OBJECTIVE EVOLUTION:
When LONGITUDINAL CONTEXT or TRAJECTORY PATTERN AND PAIN TREND contains documented comparative metrics, include those metrics in the O section as longitudinally documented objective evolution, not as newly measured findings from today.

Required format for comparative data:
- Pain data: "Pain VAS: [previous]/10 → [current]/10"
- ROM data: "ROM [movement]: [previous]° → [current]°"
- Functional/objective measure: "[measure]: [previous] → [current]"
- General progress only when explicitly documented: "Clinical evolution: [improved/regressed/stable] since last session"

Do NOT use vague language like "stable progress" or "general improvement" if specific comparative data is available.
Do NOT invent data not present in LONGITUDINAL CONTEXT or TRAJECTORY PATTERN AND PAIN TREND.
Do NOT convert patient narrative into objective findings unless it is provided as a structured comparative metric.
If no comparative data is available, document only today's findings.`;
  const objectiveEvolutionInstruction =
    input.jurisdiction === 'ES-ES'
      ? objectiveEvolutionInstructionEs
      : objectiveEvolutionInstructionEn;

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

  const hepSection = (() => {
    const currentHepItems = homeProgram;
    const hasDecision = homeProgramDecisionWasMade;
    const hasItems = currentHepItems.length > 0;

    if (!hasDecision && !hasItems) {
      return '';
    }

    if (hasDecision && !hasItems) {
      const noHepMessageEs = 'PROGRAMA DE EJERCICIOS EN CASA: Ninguno prescrito hoy por decisión del profesional.';
      const noHepMessageEn = 'HOME EXERCISE PROGRAM: None prescribed today by clinician decision.';
      const noHepMessage = input.jurisdiction === 'ES-ES' ? noHepMessageEs : noHepMessageEn;
      return `${noHepMessage}\n\n`;
    }

    const hepListItems = currentHepItems.map((item) => `${item}`).join('\n\n');
    const canonicalNoteEs = 'Esta es la lista canónica y definitiva. No añadir ejercicios desde sesiones anteriores ni historial.';
    const canonicalNoteEn = 'This is the canonical and final list. Do not add exercises from previous sessions or history.';
    const canonicalNote = input.jurisdiction === 'ES-ES' ? canonicalNoteEs : canonicalNoteEn;
    const hepHeaderEs = 'CONTEXTO — PROGRAMA DE EJERCICIOS EN CASA (decisión del profesional — canónico)';
    const hepHeaderEn = 'CONTEXT — HOME EXERCISE PROGRAM (clinician decision — canonical)';
    const hepHeader = input.jurisdiction === 'ES-ES' ? hepHeaderEs : hepHeaderEn;

    return `${hepHeader}\n\n${canonicalNote}\n\n${hepListItems}\n\n`;
  })();

  const longitudinalSection =
    longitudinalSummary && longitudinalSummary.trim().length > 0
      ? `LONGITUDINAL CONTEXT — CHANGES SINCE LAST VISIT (if provided)

Use this to understand and document evolution between the previous completed session and today.
Do NOT invent new findings; reflect only what is clearly documented here.
The longitudinal context is part of the documentation source of truth for symptom evolution, functional change, response to care, and continuity with the previous session.
Do not infer new diagnoses or undocumented treatment decisions from it.

${longitudinalSummary.trim()}

`
      : '';

  const trajectorySection =
    (trajectoryPattern && trajectoryPattern.trim().length > 0) || (painSeriesSummary && painSeriesSummary.trim().length > 0)
      ? `TRAJECTORY PATTERN AND PAIN TREND

${painSeriesSummary && painSeriesSummary.trim().length > 0 ? `Pain series (recent visits): ${painSeriesSummary.trim()}\n\n` : ''}${trajectoryPattern && trajectoryPattern.trim().length > 0 ? `Pain trajectory classification: ${trajectoryPattern.trim()}${trajectoryConfidence ? ` (confidence: ${trajectoryConfidence})` : ''}\nSignal source: longitudinal analysis.\n` : ''}Use this information only to describe patient evolution. Do not infer treatment decisions.

`
      : '';

  const patternInsightSection =
    patternInsightSummary && patternInsightSummary.trim().length > 0
      ? `PATIENT LONGITUDINAL MEMORY PATTERN

Use this pattern insight to keep continuity with how this patient has been responding across sessions.
Use it to describe the patient's usual response pattern only when it is compatible with today's documented update.
Do not convert this pattern into a new diagnosis or an undocumented treatment recommendation.

${patternInsightSummary.trim()}

`
      : '';

  const currentHepAdherenceSection =
    currentHepAdherenceSummary && currentHepAdherenceSummary.trim().length > 0
      ? `CURRENT HOME PROGRAM ADHERENCE

Use this as a structured fact from today's follow-up checklist.
Use it only to document adherence confirmed today.
Do not infer longer-term adherence beyond what is explicitly provided here.

${currentHepAdherenceSummary.trim()}

`
      : '';

  const previousPlansSection =
    previousPlansSummary && previousPlansSummary.trim().length > 0
      ? `PREVIOUS TREATMENT PLAN(S)

Use the previous plan only to maintain clinical continuity with today's encounter.
Do NOT copy prior plan content into today's note.
Only include prior-plan material when today's clinical update or confirmed checklist explicitly continues, changes, progresses, or stops it.
Do NOT introduce new interventions, progressions, or recommendations unless explicitly documented in today's session input.
Your task is to document what was done and decided today. Reflect logical progressions of existing interventions when the clinical input supports them — this is clinical documentation, not treatment invention.

${previousPlansSummary.trim()}

`
      : '';

  const reviewedAttachmentsSection =
    reviewedAttachmentsSummary && reviewedAttachmentsSummary.trim().length > 0
      ? `OBJECTIVE FINDINGS FROM ATTACHMENTS REVIEWED TODAY

Use this section only when the clinician reviewed attachments in today's follow-up session.
Findings from this section may be documented in Objective only if they are clearly attributable to a reviewed attachment or report from today.
Do NOT convert ambiguous patient retelling into objective findings.
If you use this section in Objective, make the source explicit as attachment/report review from today.
For image-based attachments, describe findings as suggestive visual observations only.
Do NOT write that an image "confirms" a diagnosis, fracture status, cartilage injury, hyperlaxity, bone quality, or prognosis.
If image quality or provenance is limited, state that interpretation is limited and that the image does not constitute a diagnosis.

${reviewedAttachmentsSummary.trim()}

`
      : '';

  const prompt = `MANDATORY: All output MUST be in ${outputLanguage}. Do not use any other language regardless of the language of the transcript or input data.
Today's date: ${new Date().toLocaleDateString(outputLocale)}. Use this as the current date for all clinical reasoning. Do not infer dates from document metadata.

PATIENT CONTEXT — Follow-up visit. The patient and condition were established at the previous visit; the baseline below contains who we are talking about and what injury/condition is being treated.

SYSTEM / INSTRUCTION

You are a licensed clinical documentation assistant supporting a follow-up visit.

${followApplicableJurisdictionNarrative}

ROLE AND LANGUAGE:
- You assist with documentation, you do NOT diagnose
- Reflect ONLY the information provided in the baseline and today's update
- Output in ${outputLanguage}
- ${physiotherapyTerminologyGuidance}
- Prefer concise EMR-style clinical wording over narrative prose
- Do NOT reproduce conversations verbatim or include unnecessary quotations
- Prioritise what changed since the last session over repeating the full baseline

SOURCE OF TRUTH CONSTRAINT:
- All clinical statements must originate from:
  - today's clinical update,
  - in-clinic items and home program items provided,
  - the baseline SOAP as context only,
  - current structured HEP adherence provided,
  - longitudinal context / pain trend / trajectory data provided,
  - previous treatment plan information as continuity only,
  - patient longitudinal memory pattern provided,
  - attachment findings explicitly marked as reviewed today.
- Today's clinical update and confirmed in-clinic checklist govern this note.
- The baseline SOAP provides context only. Do NOT copy baseline content into today's note.
- The previous plan provides continuity only. Do NOT copy it unless today's input explicitly changes, continues, progresses, or stops it.
- Never write a vague reference such as "el plan previo se mantiene", "plan anterior se mantiene", "previous plan is maintained", or "continue previous plan" unless the same Plan section explicitly states the concrete in-clinic actions and HEP items being continued, progressed, adjusted, or stopped.
- If prior plan details are absent, generic, or not clinically actionable, do not refer to a previous plan. Document only today's confirmed treatment and HEP, or state that the item was not documented today.
- Do NOT introduce new tests, findings, diagnoses, treatments, or recommendations that are not present in the input data.
- Longitudinal memory may be used to document change over time, response to prior care, and continuity of the plan.
- Longitudinal memory must NOT be used to invent undocumented interventions or new diagnoses.

INPUT SOURCES:
You will receive:
1. Clinical Transcript -> patient-reported information and interaction
2. Additional Professional Notes -> clinician-confirmed findings, treatment actions, and responses

RULES:
- Treat Additional Professional Notes as HIGH PRIORITY clinical input
- If there is any conflict, prioritize Additional Professional Notes
- Use Additional Professional Notes especially for:
  - Objective findings
  - Treatment performed
  - Response to treatment
  - Plan adjustments
- DO NOT ignore transcript, but DO NOT override clinician notes with it

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

${reviewedAttachmentsSection}${inClinicSection}${hepSection}${longitudinalSection}${trajectorySection}${patternInsightSection}${currentHepAdherenceSection}${previousPlansSection}
HIERARCHY: today's clinical update and confirmed checklist > baseline SOAP context > previous plan continuity.
If conflict exists between sources, today's clinical update and confirmed checklist govern today's note.
Use baseline SOAP only to understand the established condition; do not restate baseline findings as today's content.
Use previous plans only for continuity; do not copy prior interventions into today's note unless today's input explicitly confirms them.

TASK

Normalize patient colloquial terms to standard clinical anatomical terminology in Spanish (e.g. 'isquionidiales' → 'isquiotibiales', 'nalga' → 'glúteo'). Never reproduce patient misnomers in the SOAP output.

Your role is to rewrite the SOAP note reflecting today's encounter. You do not invent interventions absent from the input.
When the clinical input documents a response pattern (pain with movement, improvement with modification, tolerance change), you MUST reflect the logical progression of existing interventions — this is documentation of clinical reasoning, not generation of new treatment decisions absent from the record.
Justify each plan bullet in ≤8 words using only documented input.

Using only the information above:

SOAP DISTRIBUTION RULES — each section has a unique clinical role:

S (Subjective): Patient's reported experience TODAY ONLY.
   → symptoms, pain level, functional limitations reported verbally, adherence, frustration, goals mentioned
   → DO NOT include: clinical observations, treatment performed, assessment conclusions

O (Objective): Clinician's observations TODAY ONLY.
   → ROM observed, exercise tolerance, performance of exercises, treatments applied, functional tests
   → DO NOT include: patient-reported symptoms, assessment conclusions, future plans

A (Assessment): Clinical synthesis — ONE statement per problem.
   → evolution vs previous session, clinical significance of today's findings
   → DO NOT repeat: specific exercises, patient complaints already in S, treatment details already in O

P (Plan): Next actions ONLY — no evaluation content.
   → progression, home program changes, next session focus, referrals
   → DO NOT include: what was done today (already in O), assessment conclusions (already in A)

DEDUPLICATION RULE:
Do not repeat the same clinical fact in more than one SOAP section.
If a finding appears across sections, each mention must serve a different clinical role.
If you cannot assign a different clinical role, include it only in the most appropriate section.

EN ESPAÑOL:
No repitas el mismo hallazgo clínico en S/O/A/P.
Si un ejercicio o síntoma aparece en más de una sección, cada aparición debe tener una función clínica distinta.
Si no puedes asignar función distinta, inclúyelo solo en la sección más apropiada.

Update the Subjective based on today's report and documented change from prior sessions when longitudinal data is provided
Subjective MUST be MAX 4 lines
Include ONLY NEW information from today's session
Do NOT repeat prior history already documented in the record
Use concise consensus abbreviations when clinically appropriate: EVA, ROM, HEP, Cx, Rx, AINE

O: OBJETIVO — Extract from the transcript:
- Patient's observable response to techniques applied today
  (e.g., 'tolerated cervical mobilization without pain',
  'TENS applied 15min to cervical region, well tolerated')
- Any ROM or functional observation mentioned, even if informal
  (e.g., 'cervical rotation estimated 60° bilaterally')
- Physical findings observed during session
- If and ONLY IF no objective data whatsoever appears in the transcript,
  write: 'No se registraron medidas objetivas formales.
  [technique applied] aplicado/a, tolerado/a sin incidencias.'
- NEVER write only 'No se registraron nuevas medidas objetivas hoy.'
  without mentioning what treatment was applied and how it was tolerated.
Objective MUST be MAX 2 lines
Do NOT restate baseline objective findings as if they were newly measured today
Do NOT place progress, stability, response to treatment, or general clinical interpretation in Objective unless they are directly observable during the session
Only include attachment-derived findings in Objective when they are present in the "attachments reviewed today" section
If attachment-derived findings are included, make clear that they come from material reviewed today rather than from direct measurement by the physiotherapist
You may reference previous objective findings only as prior clinical reference when needed for continuity
${objectiveEvolutionInstruction}

Update the Assessment to summarise progression, response, or tolerance as documented by the clinician
Assessment MUST be MAX 4 lines
If longitudinal information is provided, explicitly state the clinical change versus the previous completed session
Include, when documented, the EVA pain change, HEP adherence percentage, and relevant functional or psychosocial factors affecting progression
If previous plan or longitudinal data is provided, explicitly link today's status to the patient's documented response to prior care
If current structured HEP adherence is provided, include that adherence fact in the Assessment or Plan when it is clinically relevant, using only the documented ratio or percentage

Do NOT restate the entire diagnosis unless it has changed
Do NOT elaborate on known diagnoses already documented in the record

Update the Plan:

Reflect progressions or adjustments ONLY if they are clearly documented in the baseline and today's inputs
When supported by the input, connect today's plan to the patient's response, tolerance, adherence, or progression since the prior session
If previous plan or longitudinal data is provided, begin the Plan with one brief continuity sentence stating whether today's care continues, progresses, or adjusts the prior plan, and why, using only documented input
Any continuity sentence must name the concrete treatment or HEP action. Do NOT use standalone references like "El plan previo se mantiene" or "The previous plan is maintained."
If you cannot name the concrete continued/progressed/adjusted action from the input, omit the continuity sentence.
If the documented input shows improved pain, function, tolerance, or adherence, avoid saying "without changes" unless the input explicitly states that today's plan was unchanged
When improvement is documented but no new intervention is listed, prefer wording such as continuing care with progression according to tolerance, rather than implying a static plan
If current structured HEP adherence is provided, prefer integrating that adherence fact into the continuity sentence rather than appending it as an isolated line
If TODAY'S CLINICAL UPDATE contains explicit red flags or urgent neurological deficits, the Plan must prioritise urgent medical referral / escalation and must not present routine physiotherapy or home exercise progression as the primary next step unless that continuation is explicitly documented in the input
If urgent red flags are present, keep the Plan short and safety-first
Keep the Plan concise and operational. Avoid narrative explanation after the treatment sections
The Plan must contain ONLY these two treatment sections and no additional section:
TRATAMIENTO EN CLÍNICA:
- [item]
HEP:
- [item]
Use HEP exactly as the section label
Do NOT expand HEP to "programa de ejercicios en casa" inside the Plan section label
CRITICAL RULE: The home exercise section label MUST be exactly 'HEP:'
in uppercase. NEVER write 'programa de ejercicios en casa' as a section label.
This rule has no exceptions.
Do NOT include any "additional recommendations" section
Do NOT include duplicate labels or expanded duplicate headings

Clearly distinguish in-clinic treatment vs home program

The plan should logically follow from the hierarchy above and the input data. Structure and summarise; do not add interventions absent from the input, and when the input supports it, document progression or adjustment of existing interventions as clinical reasoning grounded in that input.

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
If red flags are reported, the SOAP Plan must align with that urgency.

Do NOT include any text outside the JSON object.`;

  return prompt;
}
