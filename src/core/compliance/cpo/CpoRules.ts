export function runCpoRules(ctx: {
  patientId: string;
  clinicianId: string;
  noteMarkdown: string;
  createdAtISO: string;
}): { failures?: string[] } {
  // TODO: implementar reglas reales; ejemplo detecta nota vacía
  if (!ctx.noteMarkdown || !ctx.noteMarkdown.trim()) {
    return { failures: ['Note content is empty'] };
  }
  return { failures: [] };
}
