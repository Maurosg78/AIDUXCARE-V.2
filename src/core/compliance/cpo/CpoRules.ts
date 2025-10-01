export type CpoContext = {
  patientId: string;
  clinicianId: string;
  noteMarkdown: string;
  createdAtISO: string;
};

export type CpoResult = {
  ok: boolean;
  failures: string[];
};

/**
 * Deterministic, non-LLM rules for CPO Ontario SOAP notes.
 * Keep it simple: check required sections exist and are non-empty.
 */
export function runCpoRules(ctx: CpoContext): CpoResult {
  const md = ctx.noteMarkdown || "";
  const failures: string[] = [];

  const hasSubjective = /(^|\n)\s*(#+\s*Subjective\b|\*\*Subjective\*\*:|^S:)/i.test(md);
  const hasObjective  = /(^|\n)\s*(#+\s*Objective\b|\*\*Objective\*\*:|^O:)/i.test(md);
  const hasAssessment = /(^|\n)\s*(#+\s*Assessment\b|\*\*Assessment\*\*:|^A:)/i.test(md);
  const hasPlan       = /(^|\n)\s*(#+\s*Plan\b|\*\*Plan\*\*:|^P:)/i.test(md);

  if (!hasSubjective) failures.push("Missing Subjective section.");
  if (!hasObjective)  failures.push("Missing Objective section.");
  if (!hasAssessment) failures.push("Missing Assessment section.");
  if (!hasPlan)       failures.push("Missing Plan section.");

  if (!ctx.patientId)    failures.push("Missing patient identifier.");
  if (!ctx.clinicianId)  failures.push("Missing clinician identifier.");
  if (!ctx.createdAtISO) failures.push("Missing creation timestamp.");

  return { ok: failures.length === 0, failures };
}
