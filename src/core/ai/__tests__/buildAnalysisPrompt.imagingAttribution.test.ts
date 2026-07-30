import { describe, expect, it } from 'vitest';
import { buildCanadianAnalysisPrompt } from '../markets/ca/buildAnalysisPrompt.ca';
import { buildSpanishAnalysisPrompt } from '../markets/es/buildAnalysisPrompt.es';

const ambiguousVerbalImagingComment =
  'The physiotherapist says the X-ray seems to show a small irregularity, but this has not been confirmed in a written report.';

describe('buildAnalysisPrompt imaging attribution', () => {
  it('injects the en-CA guardrail for an ambiguous verbal imaging comment without an attachment', () => {
    const prompt = buildCanadianAnalysisPrompt({
      contextoPaciente: 'Patient attending an Ontario physiotherapy assessment.',
      transcript: ambiguousVerbalImagingComment,
      visitType: 'initial',
      attachments: [],
    });

    expect(prompt).toContain('[PROMPT_VERSION: ca-analysis-v1.2 | 2026-07-30]');
    expect(prompt).toContain('[ATTRIBUTION RULE — CLINICAL IMAGING IN TRANSCRIPT]');
    expect(prompt).toContain(
      'Commented by the professional during the session: [finding], pending clinical correlation and not a substitute for a radiology report.'
    );
    expect(prompt).toContain(
      'DO NOT use phrases such as "the X-ray shows..." or "radiological findings..." unless they come from an attached written radiology or medical report.'
    );
    expect(prompt).toContain(
      'Do not include observations generated automatically from image/* attachments in key_findings, alert_notes, red_flags, or recommendations.'
    );
    expect(prompt).toContain(`<transcript>
${ambiguousVerbalImagingComment}
</transcript>`);
    expect(prompt).not.toContain('[REGLA DE ATRIBUCIÓN — IMÁGENES CLÍNICAS EN TRANSCRIPCIÓN]');
    expect(prompt.indexOf('[ATTRIBUTION RULE — CLINICAL IMAGING IN TRANSCRIPT]')).toBeLessThan(
      prompt.indexOf('[Transcript]')
    );
  });

  it('preserves the complete ES imaging attribution and OCR medication rules', () => {
    const prompt = buildSpanishAnalysisPrompt({
      contextoPaciente: 'Paciente en valoración de fisioterapia.',
      transcript: 'El fisioterapeuta comenta una radiografía ambigua.',
      visitType: 'initial',
      attachments: [],
    });

    expect(prompt).toContain(`[REGLA DE ATRIBUCIÓN — IMÁGENES CLÍNICAS EN TRANSCRIPCIÓN]
Cuando la transcripción incluya comentarios del profesional sobre imágenes clínicas (radiografías, RM, TAC, ecografías):
- Conserva la información, pero formula el hallazgo como "Comentado por el profesional durante la sesión: [hallazgo], pendiente de correlación clínica y sin sustituir informe radiológico."
- NO uses frases como "la radiografía muestra…" o "hallazgos radiológicos…" a menos que provengan de un informe radiológico o médico escrito adjunto.
- Para hechos procedentes de un informe escrito adjunto: usa "según informe adjunto — [hecho]".
- Para observaciones generadas automáticamente desde adjuntos image/*: no incluirlas en key_findings, alert_notes, red_flags ni recomendaciones.
- Medicación explícita presente en texto OCR o informe adjunto (incluyendo Enantyum, dexketoprofeno, intramuscular, IM): incluirla en medications aunque la confianza sea medium o low; marcar requires_review: true si el nombre OCR es incierto en lugar de omitirla.`);
    expect(prompt).not.toContain('[ATTRIBUTION RULE — CLINICAL IMAGING IN TRANSCRIPT]');
  });
});
