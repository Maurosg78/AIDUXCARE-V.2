/**
 * WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1
 * Validación semántica de SOAP parseado antes de persistir como baseline.
 * No persiste; solo valida y devuelve si es apto para baseline.
 * Criterio clínico y legal: baseline debe ser interpretable, mínimo completo y defendible en auditoría.
 *
 * TODO (próximo WO): En el flujo de persistencia de baseline (p. ej. OngoingPatientIntakeModal,
 * createBaselineFromMinimalSOAP, o donde se guarde SOAP como historia), llamar isValidBaselineSOAP()
 * antes de persistir; si invalid, no guardar y opcionalmente log getBaselineValidationFailureReason() para auditoría.
 */

import type { SOAPNote } from '../types/vertex-ai';

const NOT_DOCUMENTED = 'Not documented.';
const MIN_SUBJECTIVE_LENGTH = 10;
const MIN_PLAN_LENGTH = 15;

/** Planes genéricos o no accionables que NO son baseline válida */
const GENERIC_PLAN_PATTERNS = [
  /^continue treatment\.?$/i,
  /^continue treatment as planned\.?$/i,
  /^as planned\.?$/i,
  /^paciente en tratamiento\.?$/i,
  /^en tratamiento\.?$/i,
  /^n\/a\.?$/i,
  /^not documented\.?$/i,
  /^none\.?$/i,
  /^to be determined\.?$/i,
  /^tbd\.?$/i,
  /^increase activity\.?$/i, // demasiado vago para baseline
];

function isMeaningfulText(s: string, minLen: number): boolean {
  const t = (s ?? '').trim();
  return t.length >= minLen && t !== NOT_DOCUMENTED;
}

function isPlanGeneric(plan: string): boolean {
  const trimmed = (plan ?? '').trim();
  if (trimmed.length < MIN_PLAN_LENGTH) return true;
  return GENERIC_PLAN_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Devuelve el motivo de rechazo si el SOAP no es baseline válida; null si es válida.
 * Usado para trazabilidad/auditoría cuando se rechaza persistir.
 */
export function getBaselineValidationFailureReason(parsedSOAP: SOAPNote | null): string | null {
  if (!parsedSOAP || typeof parsedSOAP !== 'object') return 'Missing or invalid SOAP object';

  const subj = (parsedSOAP.subjective ?? '').trim();
  const plan = (parsedSOAP.plan ?? '').trim();

  if (!isMeaningfulText(subj, MIN_SUBJECTIVE_LENGTH)) return 'Missing or insufficient Subjective section';
  if (!plan || plan.length < MIN_PLAN_LENGTH) return 'Missing or insufficient Plan section';
  if (plan === NOT_DOCUMENTED) return 'Plan is placeholder (Not documented.)';
  if (isPlanGeneric(plan)) return 'Plan is generic or not actionable';

  return null;
}

/**
 * Indica si un SOAP parseado cumple requisitos mínimos para ser persistido como baseline.
 * Requisitos: al menos Subjective y Plan; Plan no vacío ni genérico; contenido accionable.
 * Si no cumple, no debe marcarse como baseline válida ni persistirse como historia clínica.
 * Cuando rechaza, registra motivo con console.warn para trazabilidad en auditoría.
 */
export function isValidBaselineSOAP(parsedSOAP: SOAPNote | null): boolean {
  const reason = getBaselineValidationFailureReason(parsedSOAP);
  if (reason !== null) {
    console.warn('[BaselineValidation]', reason);
    return false;
  }
  return true;
}
