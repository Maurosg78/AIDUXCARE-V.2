/**
 * Clinical Report Service
 *
 * Entry point for generating referral reports (ES) from SessionState.
 * This wires together:
 * - SessionState.soapNote (Vertex AI SOAP)
 * - Clinical synthesis engine
 * - ES referral report builder
 *
 * Phase 1: synchronous, text-only, not yet wired to UI.
 */

import type { SessionState } from '@/types/sessionState';
import {
  synthesizeClinicalNarrative,
  type ClinicalFactSetLike,
} from '@/core/synthesis/synthesizeClinicalNarrative';
import {
  buildReferralReportEsSections,
  renderReferralReportEsText,
  type ReferralReportData,
} from '@/core/reports/referralReportEs';
import { logRegulatoryLanguageWarnings } from '@/utils/regulatoryLanguageGuard';
import { extractClinicalFactsFromSessionState } from '@/core/clinical/extractClinicalFactsFromSessionState';
import { isSpainPilot } from '@/core/pilotDetection';

export type ClinicalStatus = 'stable' | 'improved' | 'worsened' | 'redflag';

export interface ReferralReportResult {
  reportText: string;
  clinicalStatus: ClinicalStatus;
}

type ReportTrace = {
  ts: string;
  jurisdiction: 'ES-ES';
  sessionId?: string;
  patientId?: string;
  clinicalStatus: ClinicalStatus;
  reportWordCount: number;
};

function traceReport(result: ReferralReportResult, ctx: { sessionId?: string; patientId?: string }) {
  const words = result.reportText.split(/\s+/).filter(Boolean);
  const reportWordCount = words.length;
  const trace: ReportTrace = {
    ts: new Date().toISOString(),
    jurisdiction: 'ES-ES',
    sessionId: ctx.sessionId,
    patientId: ctx.patientId,
    clinicalStatus: result.clinicalStatus,
    reportWordCount,
  };

  const isDevOrEsPilot =
    // Frontend (Vite) env: dev or Spain pilot
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.DEV) ||
    // Node / simulator env
    process.env.NODE_ENV === 'development' ||
    isSpainPilot();

  if (isDevOrEsPilot) {
    console.info('[REPORT_TRACE]', trace);
    if (reportWordCount < 40 || reportWordCount > 160) {
      console.warn('[REPORT_LENGTH_OUTLIER]', reportWordCount);
    }
  }
}

function clinicalFactsToReferralReportData(
  f: ClinicalFactSetLike,
  _summary: ReturnType<typeof synthesizeClinicalNarrative>
): ReferralReportData {
  const { context, facts } = f;

  // Evolution text: describe only what is explicitly documented in SOAP
  const evolutionText = facts.evolutionText ?? facts.pain?.cursoTextoLibre;

  return {
    paciente: {
      nombre: context.patientName,
      edad: context.patientAge,
      idHistoria: context.patientId,
    },
    episodio: {
      motivoPrincipal: facts.chiefComplaint || facts.diagnosis,
      fechaInicio: context.episodeStartDate,
    },
    diagnosticoFuncional: facts.diagnosis,
    sessionDate: undefined,
    evolucionTextoLibre: evolutionText,
    tratamiento: {
      ejercicios: facts.treatments?.ejercicios,
      tecnicasManuales: facts.treatments?.tecnicasManuales,
      educacion: facts.treatments?.educacion,
    },
    plan: {
      horizonteTiempo: facts.plan?.horizonteTiempo,
      textoLibre: facts.plan?.textoLibre,
    },
  };
}

/**
 * Generate ES referral report text for a given session state.
 *
 * Returns null if there is no SOAP note available yet.
 */
export function generateEsReferralReportForSession(session: SessionState): ReferralReportResult | null {
  // Guardrail: require at least subjective + assessment before generating report
  if (!session.soapNote?.assessment || !session.soapNote?.subjective) {
    return null;
  }

  const facts = extractClinicalFactsFromSessionState(session);
  if (!facts) return null;

  const summary = synthesizeClinicalNarrative(facts);
  const data = clinicalFactsToReferralReportData(facts, summary);
  // Attach human-readable session date when available
  if (session.startTime instanceof Date) {
    data.sessionDate = session.startTime.toLocaleDateString('es-ES');
  }

  const sections = buildReferralReportEsSections(data);
  const reportText = renderReferralReportEsText(sections);
  const clinicalStatus: ClinicalStatus =
    summary.evolution.direction && ['improved', 'worsened', 'redflag', 'stable'].includes(summary.evolution.direction)
      ? summary.evolution.direction
      : 'stable';

  // Log potential risky regulatory language in referral text (non-blocking)
  logRegulatoryLanguageWarnings('es_referral_report', { reportText });

  const result: ReferralReportResult = { reportText, clinicalStatus };
  traceReport(result, { sessionId: session.sessionId, patientId: session.patientId });
  return result;
}

