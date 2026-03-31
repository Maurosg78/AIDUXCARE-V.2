import type { SOAPGenerationResponse } from '@/services/vertex-ai-soap-service';
import type { QAExpectations } from '../types';

function soapFullText(soap: SOAPGenerationResponse['soap']): string {
  if (!soap) return '';
  return [soap.subjective, soap.objective, soap.assessment, soap.plan, soap.followUp, soap.precautions, soap.referrals]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

function hasNonTrivialSoap(soap: SOAPGenerationResponse['soap']): boolean {
  if (!soap) return false;
  const parts = [soap.subjective, soap.objective, soap.assessment, soap.plan].filter(Boolean);
  if (parts.length === 0) return false;
  return parts.some((p) => String(p).trim().length >= 20);
}

export function basicEvaluate(
  result: SOAPGenerationResponse,
  expectations: QAExpectations | undefined
): { pass: boolean; checks: Record<string, boolean>; failures: string[] } {
  const checks: Record<string, boolean> = {};
  const failures: string[] = [];

  if (!expectations) {
    checks['noExpectations'] = true;
    return { pass: true, checks, failures };
  }

  const text = soapFullText(result.soap);
  const guardBlocked = result.metadata?.model === 'guard-blocked' || result.metadata?.quality?.level === 'unsafe';

  if (expectations.expectSoap === true) {
    checks['expectSoap'] = result.soap != null && !guardBlocked;
    if (!checks['expectSoap']) failures.push('Se esperaba objeto SOAP y no hubo nota (guard o null).');
  }

  if (expectations.expectNonTrivialSoap === true) {
    checks['expectNonTrivialSoap'] = hasNonTrivialSoap(result.soap);
    if (!checks['expectNonTrivialSoap']) failures.push('SOAP demasiado vacío o trivial.');
  }

  if (expectations.mustContain?.length) {
    for (const s of expectations.mustContain) {
      const key = `mustContain:${s.slice(0, 24)}`;
      checks[key] = text.includes(s.toLowerCase());
      if (!checks[key]) failures.push(`Falta mustContain: "${s}"`);
    }
  }

  if (expectations.mustNotContain?.length) {
    for (const s of expectations.mustNotContain) {
      const key = `mustNotContain:${s.slice(0, 24)}`;
      checks[key] = !text.includes(s.toLowerCase());
      if (!checks[key]) failures.push(`Prohibido mustNotContain pero apareció: "${s}"`);
    }
  }

  if (expectations.suggestContainAny?.length) {
    const found = expectations.suggestContainAny.some((s) => text.includes(s.toLowerCase()));
    checks['suggestContainAny'] = found;
    if (!found) failures.push(`Ninguno de suggestContainAny apareció: ${expectations.suggestContainAny.join(', ')}`);
  }

  const pass = failures.length === 0;
  return { pass, failures, checks };
}
