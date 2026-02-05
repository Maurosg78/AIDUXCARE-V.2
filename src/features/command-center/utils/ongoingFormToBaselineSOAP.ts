/**
 * Parses Ongoing intake form data into baseline SOAP strings.
 * Form designed for what baseline needs: S/O/A/P.
 *
 * This baseline is persisted (clinical_baselines) and then injected into the
 * Vertex follow-up SOAP prompt via buildFollowUpPromptV3 (subjective, objective,
 * assessment, plan). All sections should be filled so the prompt is fully hydrated.
 */

export interface OngoingFormData {
  chiefComplaint?: string;
  painPresent?: boolean;
  painNPRS?: number;
  impactNotes?: string;
  antecedentesPrevios?: string; // history, imaging, onset — includes doc extracted text
  objectiveFindings?: string;
  clinicalImpression?: string;
  sessionNotes?: string;
  plannedNextFocus?: string;
}

const t = (s: string | undefined) => (s ?? '').trim();
const lines = (...parts: (string | undefined)[]): string =>
  parts
    .map((p) => t(p))
    .filter(Boolean)
    .join('\n');

export function ongoingFormToBaselineSOAP(form: OngoingFormData): {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
} {
  const painParts: string[] = [];
  if (form.painPresent && form.painNPRS != null) painParts.push(`NPRS ${form.painNPRS}/10`);
  if (form.impactNotes) painParts.push(form.impactNotes);
  const painText = painParts.length > 0 ? 'Pain: ' + painParts.join('. ') : '';

  const subjective = lines(
    form.chiefComplaint ? `Chief complaint: ${form.chiefComplaint}` : undefined,
    painText || undefined,
    form.antecedentesPrevios ? `Previous history: ${form.antecedentesPrevios}` : undefined
  ).trim() || 'Not documented.';

  const objective = t(form.objectiveFindings) || 'Not documented.';

  const assessment = t(form.clinicalImpression) || 'Not documented.';

  const planParts: string[] = [];
  if (form.sessionNotes) planParts.push(form.sessionNotes);
  if (form.plannedNextFocus) planParts.push(`Planned next: ${form.plannedNextFocus}`);
  let plan = planParts.length > 0 ? planParts.join('\n') : t(form.plannedNextFocus) || '';

  if (plan.trim().length < 15 && t(form.clinicalImpression).length >= 3) {
    plan = 'Establish treatment plan at first in-person follow-up session.';
  }

  return { subjective, objective, assessment, plan };
}

export function hasMinimumForBaseline(form: OngoingFormData): boolean {
  const cc = t(form.chiefComplaint);
  const imp = t(form.clinicalImpression);
  const plan = ongoingFormToBaselineSOAP(form).plan.trim();
  if (cc.length < 3) return false;
  if (imp.length >= 3) return true;
  if (plan.length >= 15) return true;
  return false;
}

const GENERIC_PLAN = /^(paciente en tratamiento|en tratamiento|n\/a)\.?$/i;

export function isPlanGeneric(plan: string): boolean {
  return GENERIC_PLAN.test(plan.trim());
}
