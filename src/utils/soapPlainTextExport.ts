import type { SOAPNote } from '@/types/vertex-ai';

export interface SoapPlainTextLabels {
  title: string;
  date: string;
  time: string;
  visitType: string;
  visitTypeInitial: string;
  visitTypeFollowUp: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  referrals: string;
  precautions: string;
  additionalNotes: string;
  noSubjective: string;
  noObjective: string;
  noAssessment: string;
  noPlan: string;
}

export interface SoapPlainTextOptions {
  locale: string;
  visitType: 'initial' | 'follow-up';
  labels: SoapPlainTextLabels;
  generatedAt?: Date;
}

export function buildSoapPlainText(soapNote: SOAPNote, options: SoapPlainTextOptions): string {
  const { locale, visitType, labels, generatedAt = new Date() } = options;
  const dateStr = generatedAt.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = generatedAt.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const visitTypeLabel = visitType === 'initial'
    ? labels.visitTypeInitial
    : labels.visitTypeFollowUp;

  const sections = [
    labels.title,
    '',
    `${labels.date}: ${dateStr}`,
    `${labels.time}: ${timeStr}`,
    `${labels.visitType}: ${visitTypeLabel}`,
    '',
    `S: ${labels.subjective.toUpperCase()}`,
    soapNote.subjective || labels.noSubjective,
    '',
    `O: ${labels.objective.toUpperCase()}`,
    soapNote.objective || labels.noObjective,
    '',
    `A: ${labels.assessment.toUpperCase()}`,
    soapNote.assessment || labels.noAssessment,
    '',
    `P: ${labels.plan.toUpperCase()}`,
    soapNote.plan || labels.noPlan,
  ];

  if (soapNote.referrals) {
    sections.push('', `${labels.referrals}:`, soapNote.referrals);
  }

  if (soapNote.precautions) {
    sections.push('', `${labels.precautions}:`, soapNote.precautions);
  }

  if (soapNote.additionalNotes) {
    sections.push('', `${labels.additionalNotes}:`, soapNote.additionalNotes);
  }

  return sections.join('\n');
}
