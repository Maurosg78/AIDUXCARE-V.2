/**
 * Laboratorio QA: transcript → generateSOAPNote (Vertex real).
 *
 * Uso:
 *   pnpm qa:simulate
 *   pnpm qa:simulate -- --case basic_lumbar_improvement --runs 5
 *   pnpm qa:simulate -- --case basic_lumbar_improvement --runs 3 --mutator strip_pain_scale
 *   pnpm qa:simulate -- --gate
 *
 * Gate (--gate): QA_GATE_PASS_RATE_MIN (default 0.9), QA_GATE_P95_MS (default 120000).
 * Falla si: passRate bajo, p95 alta, fallo/error en caso critical, o mezcla pass/fail en caso critical.
 * (La variación solo de hash entre corridas no bloquea el gate para críticos.)
 */

import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

if (typeof (globalThis as unknown as { window?: unknown }).window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = {
    location: {
      search: '',
      pathname: '/',
      hostname: 'localhost',
      href: 'http://localhost/',
    },
  };
}

import type { QACaseFile, QARunCaseResult, QARunReport } from './types';
import { buildContextFromQACase } from './buildCaseContext';
import { combinedEvaluate } from './evaluators/combinedEvaluator';
import { writeRunReport } from './reporters/jsonReporter';
import { soapHash } from './soapHash';
import { buildAggregateSummary } from './aggregateSummary';
import { applyMutatorById, listMutatorIds, STRIP_PAIN_SCALE_ID } from './mutators/index';

function getGitSha(): string | null {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function getPromptBrainVersion(): string | undefined {
  return (
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: { VITE_PROMPT_BRAIN_VERSION?: string } }).env
        ?.VITE_PROMPT_BRAIN_VERSION) ||
    process.env.VITE_PROMPT_BRAIN_VERSION ||
    undefined
  );
}

function parseArgs(argv: string[]) {
  let caseId: string | null = null;
  let runs = 1;
  let mutatorId: string | undefined;
  let gate = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--case' && argv[i + 1]) caseId = argv[++i];
    else if (argv[i] === '--runs' && argv[i + 1]) {
      const n = parseInt(argv[++i], 10);
      runs = Number.isFinite(n) && n >= 1 ? Math.min(n, 100) : 1;
    } else if (argv[i] === '--mutator' && argv[i + 1]) {
      mutatorId = argv[++i];
    } else if (argv[i] === '--gate') {
      gate = true;
    }
  }
  if (mutatorId && !listMutatorIds().includes(mutatorId)) {
    console.error('Mutador desconocido:', mutatorId, '| disponibles:', listMutatorIds().join(', '));
    process.exit(1);
  }
  return { caseId, runs, mutatorId, gate };
}

function evaluateGate(
  aggregate: NonNullable<QARunReport['aggregate']>,
  results: QARunCaseResult[],
  thresholds: { passRateMin: number; p95MaxMs: number },
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (aggregate.passRate < thresholds.passRateMin) {
    reasons.push(`passRate=${aggregate.passRate.toFixed(3)}<${thresholds.passRateMin}`);
  }
  if (aggregate.latencyMs.p95 > thresholds.p95MaxMs) {
    reasons.push(`p95=${Math.round(aggregate.latencyMs.p95)}ms>${thresholds.p95MaxMs}ms`);
  }
  const criticalFails = results.filter((r) => r.critical && (!r.evaluation.pass || r.error));
  if (criticalFails.length) {
    reasons.push(`critical_case_failures=${criticalFails.length}`);
  }
  const criticalUnstable = aggregate.unstableCases.filter(
    (u) => u.critical && u.reasons.includes('mezcla_pass_fail'),
  );
  if (criticalUnstable.length) {
    reasons.push(`critical_pass_fail_mixed=${criticalUnstable.length}`);
  }
  return { ok: reasons.length === 0, reasons };
}

function loadCases(casesDir: string, filterId: string | null): QACaseFile[] {
  const names = fs.readdirSync(casesDir).filter((f) => f.endsWith('.json'));
  const cases: QACaseFile[] = [];
  for (const n of names.sort()) {
    const raw = fs.readFileSync(path.join(casesDir, n), 'utf8');
    const c = JSON.parse(raw) as QACaseFile;
    if (filterId && c.id !== filterId) continue;
    cases.push(c);
  }
  return cases;
}

/** Aplica mutación de transcript y limpia pistas en patientContext si aplica */
function buildEffectiveCase(caseFile: QACaseFile, mutatorId: string | undefined): QACaseFile {
  let transcript = caseFile.transcript;
  if (mutatorId) transcript = applyMutatorById(mutatorId, transcript);

  const patientContext =
    mutatorId === STRIP_PAIN_SCALE_ID && caseFile.patientContext
      ? (() => {
          const { painScale: _p, ...rest } = caseFile.patientContext;
          return Object.keys(rest).length ? rest : undefined;
        })()
      : caseFile.patientContext;

  return { ...caseFile, transcript, patientContext };
}

async function main() {
  const { caseId, runs, mutatorId, gate } = parseArgs(process.argv.slice(2));
  const gatePassRateMin = parseFloat(process.env.QA_GATE_PASS_RATE_MIN || '0.9');
  const gateP95Ms = parseInt(process.env.QA_GATE_P95_MS || '120000', 10);
  const { generateSOAPNote } = await import('@/services/vertex-ai-soap-service');

  const casesDir = path.join(__dirname, 'cases');
  const resultsDir = path.join(__dirname, 'results');
  const caseFiles = loadCases(casesDir, caseId);

  if (caseFiles.length === 0) {
    console.error('No hay casos JSON en scripts/qa/cases/ o el filtro --case no coincide.');
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const runResults: QARunCaseResult[] = [];
  const pbVersion = getPromptBrainVersion();

  console.log('=== AiDux QA simulate (SOAP pipeline) v3 ===');
  console.log('Casos:', caseFiles.map((c) => c.id).join(', '));
  console.log(
    '--runs:',
    runs,
    mutatorId ? `--mutator ${mutatorId}` : '',
    gate ? '--gate' : '',
  );
  console.log('VITE_ENABLE_ES_PILOT:', process.env.VITE_ENABLE_ES_PILOT || '(no set)');
  console.log('VITE_PROMPT_BRAIN_VERSION:', pbVersion || '(default v2)');
  console.log('GIT_SHA:', getGitSha() || '(n/a)');
  console.log('');

  for (const caseFile of caseFiles) {
    const effectiveCase = buildEffectiveCase(caseFile, mutatorId);

    for (let runIndex = 0; runIndex < runs; runIndex++) {
      const t0 = Date.now();
      const started = new Date().toISOString();
      let error: string | undefined;
      let output: QARunCaseResult['output'] = { soap: null, metadata: {} };
      let model: string | undefined;
      const label = runs > 1 ? `${caseFile.id} [${runIndex + 1}/${runs}]` : caseFile.id;

      try {
        const ctx = buildContextFromQACase(effectiveCase);
        const response = await generateSOAPNote(ctx, {
          analysisLevel:
            effectiveCase.visitType === 'follow-up' || effectiveCase.visitType === 'follow_up'
              ? 'full'
              : undefined,
        });
        output = { soap: response.soap, metadata: response.metadata };
        model = response.metadata?.model;

        const evaluation = combinedEvaluate(response, caseFile, mutatorId, effectiveCase.transcript);
        const hash = soapHash(response.soap);

        if (!evaluation.pass) {
          console.warn(`FAIL evaluación: ${label}`, evaluation.failures);
        } else {
          console.log(`PASS evaluación: ${label} | soapHash=${hash} | ${Date.now() - t0}ms`);
        }

        runResults.push({
          caseId: caseFile.id,
          critical: caseFile.critical === true,
          description: caseFile.description,
          runIndex,
          soapHash: hash,
          mutationId: mutatorId,
          startedAt: started,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
          model,
          promptBrainVersion: pbVersion,
          input: {
            visitType: caseFile.visitType,
            transcriptPreview:
              effectiveCase.transcript.slice(0, 200) +
              (effectiveCase.transcript.length > 200 ? '…' : ''),
          },
          output,
          evaluation: {
            pass: evaluation.pass,
            checks: evaluation.checks,
            failures: evaluation.failures,
          },
        });
      } catch (e) {
        error =
          e instanceof Error
            ? e.message
            : typeof e === 'object' && e !== null
              ? JSON.stringify(e)
              : String(e);
        console.error(`ERROR pipeline: ${label}`, error);
        runResults.push({
          caseId: caseFile.id,
          critical: caseFile.critical === true,
          description: caseFile.description,
          runIndex,
          soapHash: undefined,
          mutationId: mutatorId,
          startedAt: started,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
          model,
          promptBrainVersion: pbVersion,
          input: {
            visitType: caseFile.visitType,
            transcriptPreview: effectiveCase.transcript.slice(0, 200),
          },
          output,
          evaluation: { pass: false, checks: {}, failures: [error] },
          error,
        });
      }
    }
  }

  const finishedAt = new Date().toISOString();
  const passed = runResults.filter((r) => r.evaluation.pass && !r.error).length;
  const aggregate = buildAggregateSummary(runResults);

  const gateResult = gate
    ? evaluateGate(aggregate, runResults, { passRateMin: gatePassRateMin, p95MaxMs: gateP95Ms })
    : null;

  const report: QARunReport = {
    schemaVersion: 3,
    startedAt,
    finishedAt,
    gitSha: getGitSha(),
    promptBrainVersion: pbVersion,
    nodeVersion: process.version,
    env: {
      viteEnableEsPilot: process.env.VITE_ENABLE_ES_PILOT === 'true',
      firebaseProject: process.env.VITE_FIREBASE_PROJECT_ID,
    },
    runOptions: {
      runsPerCase: runs,
      mutatorId,
      ...(gate ? { gate: true } : {}),
    },
    ...(gate && gateResult
      ? {
          gate: {
            enabled: true,
            ok: gateResult.ok,
            reasons: gateResult.reasons,
            thresholds: { passRateMin: gatePassRateMin, p95MaxMs: gateP95Ms },
          },
        }
      : {}),
    cases: runResults,
    summary: {
      total: runResults.length,
      passed,
      failed: runResults.length - passed,
    },
    aggregate,
  };

  const outFile = writeRunReport(report, resultsDir);

  console.log('');
  console.log('--- Resumen agregado ---');
  console.log(
    `Pass rate: ${(aggregate.passRate * 100).toFixed(1)}% (${report.summary.passed}/${report.summary.total})`
  );
  if (runs > 1) {
    console.log(
      `Estabilidad (grupos multi-corrida): stabilityRate=${aggregate.stabilityRate.toFixed(3)} distinctHashRate=${aggregate.distinctHashRate.toFixed(3)}`
    );
  }
  console.log(
    `Latencia ms: mean=${Math.round(aggregate.latencyMs.mean)} p95=${Math.round(aggregate.latencyMs.p95)} max=${aggregate.latencyMs.max}`
  );
  const rules = Object.entries(aggregate.failuresByRule);
  if (rules.length) {
    console.log('Fallos por regla:', Object.fromEntries(rules));
  }
  if (aggregate.unstableCases.length) {
    console.log(
      'Casos inestables:',
      aggregate.unstableCases.map((u) => `${u.caseId}(${u.runs} runs, ${u.distinctSoapHashes} hashes, reasons=${u.reasons.join(',')})`).join('; ')
    );
  } else if (runs > 1) {
    console.log('Casos inestables: ninguno (misma salida y mismo pass/fail en todas las corridas).');
  }
  console.log('');
  if (gate) {
    if (gateResult!.ok) {
      console.log(
        'Gate: OK',
        `(passRate≥${gatePassRateMin}, p95≤${gateP95Ms}ms, críticos sin fail ni mezcla pass/fail)`,
      );
    } else {
      console.warn('Gate: FAIL', gateResult!.reasons.join('; '));
    }
  }
  console.log('Reporte JSON:', outFile);
  const gateFailed = gate && gateResult && !gateResult.ok;
  process.exit(report.summary.failed > 0 || gateFailed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
