import type { QAUnstableCaseSummary, QARunCaseResult, QARunReport } from './types';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function buildAggregateSummary(results: QARunCaseResult[]): NonNullable<QARunReport['aggregate']> {
  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const n = durations.length;
  const sum = durations.reduce((a, b) => a + b, 0);
  const mean = n ? sum / n : 0;
  const p95 = percentile(durations, 95);

  const failuresByRule: Record<string, number> = {};
  for (const r of results) {
    if (r.error) {
      failuresByRule.pipeline_error = (failuresByRule.pipeline_error ?? 0) + 1;
      continue;
    }
    if (!r.evaluation.pass) {
      let anyCheck = false;
      for (const [key, ok] of Object.entries(r.evaluation.checks)) {
        if (ok === false) {
          failuresByRule[key] = (failuresByRule[key] ?? 0) + 1;
          anyCheck = true;
        }
      }
      if (!anyCheck && r.evaluation.failures.length) {
        failuresByRule.eval_failures = (failuresByRule.eval_failures ?? 0) + 1;
      }
    }
  }

  const byGroup = new Map<string, QARunCaseResult[]>();
  for (const r of results) {
    const key = `${r.caseId}::${r.mutationId ?? 'none'}`;
    const arr = byGroup.get(key) ?? [];
    arr.push(r);
    byGroup.set(key, arr);
  }

  const unstableCases: QAUnstableCaseSummary[] = [];
  const multiRunGroups: QARunCaseResult[][] = [];
  for (const [key, runs] of byGroup) {
    if (runs.length < 2) continue;
    multiRunGroups.push(runs);
    const hashes = new Set(runs.map((r) => r.soapHash ?? ''));
    const passes = runs.filter((r) => r.evaluation.pass && !r.error).length;
    const fails = runs.length - passes;
    const hashUnstable = hashes.size > 1;
    const passUnstable = passes > 0 && fails > 0;
    if (hashUnstable || passUnstable) {
      const [caseId, mutationPart] = key.split('::');
      unstableCases.push({
        caseId,
        critical: runs[0]?.critical === true,
        mutationId: mutationPart === 'none' ? undefined : mutationPart,
        runs: runs.length,
        distinctSoapHashes: hashes.size,
        passCount: passes,
        failCount: fails,
        reasons: [
          hashUnstable ? 'salida_soap_distinta_entre_corridas' : '',
          passUnstable ? 'mezcla_pass_fail' : '',
        ].filter(Boolean),
      });
    }
  }

  let stabilityRate = 1;
  let distinctHashRate = 0;
  if (multiRunGroups.length > 0) {
    const stable = multiRunGroups.filter((runs) => new Set(runs.map((r) => r.soapHash ?? '')).size === 1).length;
    stabilityRate = stable / multiRunGroups.length;
    const ratios = multiRunGroups.map((runs) => {
      const d = new Set(runs.map((r) => r.soapHash ?? '')).size;
      return d / runs.length;
    });
    distinctHashRate = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  }

  const passed = results.filter((r) => r.evaluation.pass && !r.error).length;
  const total = results.length;

  return {
    passRate: total ? passed / total : 0,
    stabilityRate,
    distinctHashRate,
    latencyMs: { mean, p95, max: n ? durations[durations.length - 1] : 0 },
    failuresByRule,
    unstableCases,
  };
}
