import type { SOAPContext, VisitType } from '@/core/soap/SOAPContextBuilder';
import { buildSOAPContext } from '@/core/soap/SOAPContextBuilder';
import type { QACaseFile } from './types';
import { mergeClinicalAnalysis } from './emptyClinicalAnalysis';

export function normalizeVisitType(v: QACaseFile['visitType']): VisitType {
  if (v === 'follow_up') return 'follow-up';
  return v;
}

/**
 * Construye el mismo SOAPContext que usa el workflow (Tab 1 + Tab 2),
 * y replica physicalExamResults para los guards que miran ese campo.
 */
export function buildContextFromQACase(caseFile: QACaseFile): SOAPContext {
  const visitType = normalizeVisitType(caseFile.visitType);
  const analysis = mergeClinicalAnalysis(caseFile.analysis ?? null);
  const ctx = buildSOAPContext(
    caseFile.transcript,
    analysis,
    caseFile.physicalTests ?? [],
    visitType,
    caseFile.patientContext,
    undefined
  );
  ctx.physicalExamResults = ctx.physicalEvaluation.tests;
  return ctx;
}
