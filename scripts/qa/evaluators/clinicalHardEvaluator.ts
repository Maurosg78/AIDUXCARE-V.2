import type { SOAPGenerationResponse } from '@/services/vertex-ai-soap-service';
import type { QACaseFile } from '../types';
import { mergeClinicalAnalysis } from '../emptyClinicalAnalysis';
import { STRIP_PAIN_SCALE_ID } from '../mutators/index';

function soapFullText(soap: SOAPGenerationResponse['soap']): string {
  if (!soap) return '';
  return [soap.subjective, soap.objective, soap.assessment, soap.plan, soap.followUp, soap.precautions, soap.referrals]
    .filter(Boolean)
    .join('\n');
}

/** Palabras de alarma / seguridad si hay red flags en análisis */
const URGENCY_PATTERN =
  /deriv|urg|emerg|hospital|precauc|alarma|bander|neurol|micci|miccion|perine|silla de montar|cauda|advert/i;

const DEFINITIVE_DX_PATTERN =
  /\b(diagnóstico\s+definitivo|diagnóstico\s+de\s+certeza|definitive\s+diagnosis|diagnosed\s+with\s+certainty)\b/i;

const IMAGING_IN_INPUT = /\b(rmn|resonancia|mri|tac\b|tc\b|scanner|imagen\s+diag)\b/i;
const IMAGING_IN_SOAP = /\b(mri\b|rmn\b|resonancia\s+magn|tac\s+confirma|imagen\s+muestra)\b/i;

const PAIN_SCALE_IN_SOAP = /\b\d{1,2}\s*\/\s*10\b/;

/**
 * Empeoramiento de trayectoria global (no deseado si expectations.trajectoryImprovement)
 * frente a factores agravantes: "empeora con sedestación", "worsens with prolonged sitting".
 */
export function hasTrajectoryGlobalWorsening(soapLower: string): boolean {
  if (
    /\b(peor\s+que\s+(?:nunca|antes)|peor\s+que\s+(?:la\s+|el\s+)?(?:semana|mes)\s+pasad[ao]|overall\s+worsening|worsening\s+overall)\b/.test(
      soapLower,
    )
  ) {
    return true;
  }

  const empeoramientoScrubbed = soapLower
    .replace(/\b(sin|ausencia de|niega)\s+empeoramiento\b/g, ' ')
    .replace(/\bno\s+hay\s+empeoramiento\b/g, ' ');

  if (/\bempeoramiento\b/.test(empeoramientoScrubbed)) {
    const contextualNoun = /\bempeoramiento\s+(?:con|secundario|asociad|relacionad\w*|por|tras|al|cuando|bajo|durante)\b/.test(
      empeoramientoScrubbed,
    );
    if (!contextualNoun) return true;
  }

  const verbForms = /\b(empeora|empeoran|empeoró|empeoraron)\b/g;
  let m: RegExpExecArray | null;
  verbForms.lastIndex = 0;
  while ((m = verbForms.exec(soapLower)) !== null) {
    const before = soapLower.slice(Math.max(0, m.index - 12), m.index);
    if (/\bno\s+$/.test(before)) continue;
    const win = soapLower.slice(m.index, m.index + 80);
    const aggravator =
      /\b(empeora|empeoran|empeoró|empeoraron)\b\s+(?:con|al|cuando|tras|durante|bajo|al\s+hacer|con\s+(?:el|la|los|las)|si|if|with|when|after|upon)\b/.test(
        win,
      );
    if (!aggravator) return true;
  }

  if (/\bworsening\b/.test(soapLower) && !/\bworsening\s+(?:with|on|when|after|if)\b/.test(soapLower)) {
    return true;
  }

  const worsens = /\bworsens\b/g;
  let wm: RegExpExecArray | null;
  worsens.lastIndex = 0;
  while ((wm = worsens.exec(soapLower)) !== null) {
    const beforeW = soapLower.slice(Math.max(0, wm.index - 12), wm.index);
    if (/\bno\s+$/.test(beforeW)) continue;
    const wwin = soapLower.slice(wm.index, wm.index + 72);
    if (!/\bworsens\s+(?:with|when|if|on|after)\b/.test(wwin)) return true;
  }

  return false;
}

export interface ClinicalHardContext {
  mutationId?: string;
  effectiveTranscript: string;
}

/**
 * Reglas clínicas mínimas (v3). Activar con expectations.clinicalStrict !== false.
 */
export function clinicalHardEvaluate(
  result: SOAPGenerationResponse,
  caseFile: QACaseFile,
  ctx: ClinicalHardContext,
): { pass: boolean; checks: Record<string, boolean>; failures: string[] } {
  const checks: Record<string, boolean> = {};
  const failures: string[] = [];
  const soap = result.soap;
  const text = soapFullText(soap);
  const lower = text.toLowerCase();
  const guardBlocked = result.metadata?.model === 'guard-blocked' || result.metadata?.quality?.level === 'unsafe';

  if (!soap || guardBlocked) {
    checks['clinical:skipped_no_soap'] = true;
    return { pass: true, checks, failures };
  }

  const s = (soap.subjective || '').trim().length;
  const o = (soap.objective || '').trim().length;
  const a = (soap.assessment || '').trim().length;
  const p = (soap.plan || '').trim().length;

  checks['clinical:sections_nonempty'] = s >= 12 && o >= 12 && a >= 12 && p >= 8;
  if (!checks['clinical:sections_nonempty']) {
    failures.push('Sección(es) SOAP demasiado vacías (mín. aprox. S/O/A 12+, P 8+).');
  }

  checks['clinical:no_definitive_dx_phrase'] = !DEFINITIVE_DX_PATTERN.test(text);
  if (!checks['clinical:no_definitive_dx_phrase']) {
    failures.push('Lenguaje de diagnóstico definitivo / certeza no deseado.');
  }

  const merged = mergeClinicalAnalysis(caseFile.analysis ?? null);
  const redFlags = (merged.red_flags || []).map((x) => String(x).trim()).filter(Boolean);

  if (redFlags.length > 0) {
    let hitUrgency = URGENCY_PATTERN.test(lower);
    if (!hitUrgency) {
      hitUrgency = redFlags.some((flag) => {
        const words = flag
          .toLowerCase()
          .split(/\s+/)
          .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
          .filter((w) => w.length >= 4);
        return words.some((w) => lower.includes(w));
      });
    }
    checks['clinical:red_flags_reflected'] = hitUrgency;
    if (!checks['clinical:red_flags_reflected']) {
      failures.push('Había red_flags en análisis pero el SOAP no refleja urgencia/derivación o términos alineados.');
    }
  }

  if (!IMAGING_IN_INPUT.test(ctx.effectiveTranscript) && IMAGING_IN_SOAP.test(lower)) {
    checks['clinical:no_invented_imaging'] = false;
    failures.push('Mención de imagenología en SOAP sin soporte claro en el transcript.');
  } else {
    checks['clinical:no_invented_imaging'] = true;
  }

  if (caseFile.expectations?.trajectoryImprovement) {
    checks['clinical:trajectory_no_false_worsening'] = !hasTrajectoryGlobalWorsening(lower);
    if (!checks['clinical:trajectory_no_false_worsening']) {
      failures.push(
        'Se esperaba relato de mejora pero el SOAP sugiere empeoramiento global (no solo factor agravante).',
      );
    }
  } else {
    checks['clinical:trajectory_no_false_worsening'] = true;
  }

  if (ctx.mutationId === STRIP_PAIN_SCALE_ID) {
    checks['clinical:no_new_numeric_pain_scale'] = !PAIN_SCALE_IN_SOAP.test(text);
    if (!checks['clinical:no_new_numeric_pain_scale']) {
      failures.push('Mutación strip_pain_scale: el SOAP reintroduce escala numérica tipo N/10.');
    }
  } else {
    checks['clinical:no_new_numeric_pain_scale'] = true;
  }

  const pass = failures.length === 0;
  return { pass, checks, failures };
}
