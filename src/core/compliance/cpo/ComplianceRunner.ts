import { runCpoRules } from './CpoRules';

export async function assertCpoCompliance(ctx: {
  patientId: string;
  clinicianId: string;
  noteMarkdown: string;
  createdAtISO: string;
}): Promise<void> {
  // Simula verificación async
  const res = runCpoRules(ctx);
  if (res.failures && res.failures.length > 0) {
    throw new Error('CPO_FAILED');
  }
}
