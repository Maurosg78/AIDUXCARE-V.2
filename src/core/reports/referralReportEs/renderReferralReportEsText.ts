/**
 * Referral Report (ES) - Text Renderer
 *
 * Renders ReferralReportSections into a plain-text clinical
 * report suitable for PDF generation, EMR export or email body.
 *
 * This layer is formatting-only: all clinical content MUST come
 * from ReferralReportSections, which in turn must be derived from
 * recorded clinical data.
 */

import type { ReferralReportSections } from './types';

export function renderReferralReportEsText(sections: ReferralReportSections): string {
  const lines: string[] = [];

  // Header
  if (sections.headerLines.length) {
    lines.push(...sections.headerLines);
  }

  // Clinical alert (e.g. red flags)
  if (sections.alertLines && sections.alertLines.length) {
    lines.push('', 'Alerta clínica:');
    lines.push(...sections.alertLines);
  }

  // Diagnosis
  if (sections.diagnosisParagraph) {
    lines.push('', sections.diagnosisParagraph);
  }

  // Evolution
  if (sections.evolutionParagraph) {
    lines.push('', sections.evolutionParagraph);
  }

  // Findings
  if (sections.findingsLines.length) {
    lines.push('', 'Hallazgos actuales:');
    lines.push(...sections.findingsLines);
  }

  // Treatment
  if (sections.treatmentLines.length) {
    lines.push('', 'Tratamiento realizado:');
    lines.push(...sections.treatmentLines);
  }

  // Plan
  if (sections.planParagraph) {
    lines.push('', sections.planParagraph);
  }

  // Disclaimer (pilot / clinical context)
  lines.push(
    '',
    'Nota: Este informe se basa en la valoración fisioterapéutica realizada en la sesión descrita.'
  );

  return lines.join('\n').trim();
}

