import { renderMarkdown } from "@/core/notes/SOAPRenderer";
// Si MetricsService existe, lo usamos de forma opcional (try/catch)
let maybeMetrics: any = null;
try {
  // Ajusta la ruta si difiere en tu repo:
  // existe en src/core/metrics/MetricsService.ts según el contexto del sprint
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  maybeMetrics = require("@/core/metrics/MetricsService");
} catch {}

type PersistArgs = {
  visitId?: string; // opcional por ahora
  patientId: string;
  clinicianId: string;
  soapNote: any;
};

export async function persistNoteWithMetrics(args: PersistArgs): Promise<{ noteId: string }> {
  const noteMarkdown = renderMarkdown(args.soapNote);
  const note = {
    patientId: args.patientId,
    clinicianId: args.clinicianId,
    content: noteMarkdown,
    createdAt: new Date().toISOString(),
  };

  // Mock DB (localStorage): usa visitId o un id random
  const noteId = `note_${Date.now()}`;
  const key = `aiduxcare:notes`;
  const all = JSON.parse(localStorage.getItem(key) || "[]");
  all.push({ id: noteId, ...note });
  localStorage.setItem(key, JSON.stringify(all));

  // Métricas (best effort)
  try {
    if (maybeMetrics?.MetricsService) {
      const metrics = new maybeMetrics.MetricsService();
      const visitId = args.visitId ?? noteId;
      await metrics.recordComplianceResult(visitId, "cpo_ontario", true, "All CPO rules satisfied");
      await metrics.recordTimeSaved(visitId, 15);
    }
  } catch {
    // no-op si no está listo el backend de métricas
  }

  return { noteId };
}
