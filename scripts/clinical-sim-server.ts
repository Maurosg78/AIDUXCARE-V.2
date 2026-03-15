import http from 'http';
import { URL } from 'url';
import { generateEsReferralReportForSession } from '@/core/clinical/clinicalReportService';
import type { SessionState } from '@/types/sessionState';
import { hasRegulatoryForbiddenLanguage } from '@/utils/regulatoryLanguageGuard';
import {
  buildLongitudinalEvolutionFromFacts,
  renderLongitudinalEvolutionParagraph,
} from '@/core/synthesis/LongitudinalEvolution';
import type { ClinicalFactSetLike } from '@/core/synthesis/synthesizeClinicalNarrative';

const PORT = Number(process.env.PORT || 3011);
const ENGINE_VERSION = process.env.CLINICAL_ENGINE_VERSION || '2026.03.10';
const ENABLED = process.env.NODE_ENV === 'development' || process.env.ENABLE_CLINICAL_SIM === 'true';

if (!ENABLED) {
  console.warn(
    '[clinical-sim-server] Clinical simulator is disabled. Set NODE_ENV=development or ENABLE_CLINICAL_SIM=true to enable.'
  );
  process.exit(0);
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      // simple guard against very large payloads
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const json = data ? JSON.parse(data) : {};
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function buildFixtureSession(originalSOAP: any): SessionState {
  const now = new Date();
  return {
    sessionId: `SIM-FIXTURE-${now.getTime()}`,
    patientId: 'fixture-patient',
    patientName: 'Fixture Patient',
    sessionType: 'initial',
    subtype: undefined,
    additionalOutputs: [],
    transcript: '',
    soapNote: {
      subjective: originalSOAP?.subjective ?? '',
      objective: originalSOAP?.objective ?? '',
      assessment: originalSOAP?.assessment ?? '',
      plan: originalSOAP?.plan ?? '',
      followUp: originalSOAP?.followUp ?? '',
      referrals: originalSOAP?.referrals ?? '',
      precautions: originalSOAP?.precautions ?? '',
      additionalNotes: originalSOAP?.additionalNotes ?? '',
      planInClinic: originalSOAP?.planInClinic ?? [],
      planHomeProgram: originalSOAP?.planHomeProgram ?? [],
      followUpSummary: originalSOAP?.followUpSummary ?? '',
    } as any,
    isRecording: false,
    startTime: now,
    lastUpdated: now,
    status: 'completed',
  } as SessionState;
}

function createFactsSeriesFromNumericSeries(series: number[]): ClinicalFactSetLike[] {
  const baseContext: ClinicalFactSetLike['context'] = {
    patientName: 'Fixture Patient',
    patientAge: undefined,
    patientId: 'fixture-patient',
    episodeStartDate: undefined,
    visitType: 'followup',
    sessionSubtype: 'followup',
  };

  return series.map((value, idx) => ({
    context: {
      ...baseContext,
      sessionSubtype: idx === 0 ? 'initial' : 'followup',
    },
    facts: {
      chiefComplaint: `Dolor lumbar ${value}/10`,
      diagnosis: 'Lumbalgia mecánica',
      relevantHistory: undefined,
      subjectiveText: `El paciente refiere dolor lumbar de ${value}/10.`,
      objectiveText: '',
      assessmentText: '',
      planText: '',
      pain: {
        cursoTextoLibre: `Dolor referido de ${value}/10`,
      },
      mobility: [],
      tests: [],
      evolutionText: undefined,
      treatments: {},
      plan: {},
    },
  }));
}

const server = http.createServer(async (req, res) => {
  // Dev-only: never write to repositories or EMR — this server is pure simulation.
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/dev/simulate-clinical-case') {
    try {
      const body = await readJsonBody(req);
      const { language, originalSOAP } = body || {};

      if (!originalSOAP || typeof originalSOAP !== 'object') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'originalSOAP is required' }));
        return;
      }

      const session = buildFixtureSession(originalSOAP);
      const reportResult = generateEsReferralReportForSession(session);

      if (!reportResult) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Report could not be generated (insufficient clinical data)',
          })
        );
        return;
      }

      const reportText = reportResult.reportText;
      const forbiddenLanguage = hasRegulatoryForbiddenLanguage(reportText);
      const sectionsCount = reportText.split('\n').filter((line) => line.trim().length > 0).length;
      const narrativeLength = reportText.length;
      // Detect presence of a documented plan section in a robust, wording-agnostic way.
      const planDetected =
        /Plan\b/i.test(reportText) || /Plan documentado en la sesi[oó]n:/i.test(reportText);
      const sectionsDetected = /Paciente:/i.test(reportText) && /Evoluci[oó]n:/i.test(reportText);

      const regulatoryBoundaryCheck = forbiddenLanguage ? 'FAIL' : 'PASS';

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify(
          {
            engineVersion: ENGINE_VERSION,
            language: language || 'es',
            soap: originalSOAP,
            referralReportEs: reportText,
            warnings: [],
            metrics: {
              sectionsDetected,
              forbiddenLanguage,
              regulatoryBoundaryCheck,
              sectionsCount,
              narrativeLength,
              planDetected,
              recordWriteAttempt: false,
            },
          },
          null,
          2
        )
      );
    } catch (err: any) {
      console.error('[clinical-sim-server] Error handling /api/dev/simulate-clinical-case', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: err?.message || 'Internal error',
          stack: err?.stack,
        })
      );
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/dev/simulate-longitudinal') {
    try {
      const body = await readJsonBody(req);
      const { series } = body || {};
      if (!Array.isArray(series) || series.length === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'series (number[]) is required' }));
        return;
      }

      const factsSeries = createFactsSeriesFromNumericSeries(series.map((n: any) => Number(n)));
      const evolution = buildLongitudinalEvolutionFromFacts(factsSeries);
      const narrative = renderLongitudinalEvolutionParagraph(evolution);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify(
          {
            series,
            evolution,
            narrative,
          },
          null,
          2
        )
      );
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err?.message || 'Internal error' }));
    }
    return;
  }

  // Default: 404 for any other path/method
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[clinical-sim-server] Listening on http://localhost:${PORT}`);
});

