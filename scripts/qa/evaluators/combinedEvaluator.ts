import type { SOAPGenerationResponse } from '@/services/vertex-ai-soap-service';
import type { QACaseFile } from '../types';
import { basicEvaluate } from './basicEvaluator';
import { clinicalHardEvaluate } from './clinicalHardEvaluator';

/**
 * Evaluación básica (expectations JSON) + reglas clínicas duras.
 * expectations.clinicalStrict === false omite el bloque clínico.
 */
export function combinedEvaluate(
  response: SOAPGenerationResponse,
  caseFile: QACaseFile,
  mutationId: string | undefined,
  effectiveTranscript: string,
): { pass: boolean; checks: Record<string, boolean>; failures: string[] } {
  const basic = basicEvaluate(response, caseFile.expectations);

  const skipHard = caseFile.expectations?.clinicalStrict === false;
  if (skipHard) {
    return basic;
  }

  const hard = clinicalHardEvaluate(response, caseFile, { mutationId, effectiveTranscript });

  return {
    pass: basic.pass && hard.pass,
    checks: { ...basic.checks, ...hard.checks },
    failures: [...basic.failures, ...hard.failures],
  };
}
