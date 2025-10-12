/**
 * eval-gate.cjs — Quality Gate (flex schema + skip non-evaluative rows)
 */
const fs = require('fs');
const path = require('path');

function readThresholds() {
  const p = path.resolve('.github/eval-thresholds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function resolveLatestJsonl(argPath) {
  if (argPath) return argPath;
  const dir = path.resolve('tools/eval/reports');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')) : [];
  if (!files.length) throw new Error('No JSONL reports found.');
  files.sort((a,b) => fs.statSync(path.join(dir,b)).mtimeMs - fs.statSync(path.join(dir,a)).mtimeMs);
  return path.join(dir, files[0]);
}
function parseJsonl(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(l => JSON.parse(l));
}
function isEvaluative(r) {
  return (
    typeof r.status === 'string' ||
    typeof r.result === 'string' ||
    typeof r.ok === 'boolean' ||
    typeof r.passed === 'boolean' ||
    typeof r.success === 'boolean' ||
    typeof r.score === 'number'
  );
}
// Flexible pass/fail interpretation
function rowIsPass(r) {
  const statusStr =
    typeof r.status === 'string' ? r.status.toLowerCase() :
    typeof r.result === 'string' ? r.result.toLowerCase() : '';
  const boolPass = (r.ok === true || r.passed === true || r.success === true);
  const scorePass = (typeof r.score === 'number' && r.score >= 0.5);
  if (statusStr) return statusStr === 'pass';
  if (typeof r.ok === 'boolean' || typeof r.passed === 'boolean' || typeof r.success === 'boolean') return boolPass;
  if (typeof r.score === 'number') return scorePass;
  return false; // non-evaluative should be skipped before calling this
}
function severityOf(r) {
  const sev = ((r.severity ?? r.level) + '').toLowerCase();
  if (sev === 'critical' || sev === 'blocker') return 'critical';
  return 'minor';
}
function computeMetrics(rows) {
  let passed=0, failed=0, critical=0, minor=0, durationMs=0, total=0;
  const suites = new Set();
  for (const r of rows) {
    if (r.suite) suites.add(r.suite);
    if (typeof r.duration_ms === 'number') durationMs += r.duration_ms;

    if (!isEvaluative(r)) continue;     // ⟵ ignora logs/meta/noise
    total++;

    if (rowIsPass(r)) {
      passed++;
    } else {
      failed++;
      if (severityOf(r) === 'critical') critical++; else minor++;
    }
  }
  const passRate = total ? passed / total : 0;
  return { passed, failed, total, passRate, critical, minor, durationMs, suites: [...suites] };
}
function fmtPct(x) { return (x*100).toFixed(1) + '%'; }
function isoNow() { return new Date().toISOString(); }

function main() {
  const thresholds = readThresholds();
  const jsonlPath = resolveLatestJsonl(process.argv[2]);
  const rows = parseJsonl(jsonlPath);
  const m = computeMetrics(rows);

  const ok = (m.passRate >= thresholds.passRateMin) &&
             (m.critical <= thresholds.criticalMax) &&
             (m.minor <= thresholds.minorMax);

  const outMd = [
    `# Eval Gate Summary`,
    ``,
    `**When:** ${isoNow()}`,
    `**Report:** ${path.relative(process.cwd(), jsonlPath)}`,
    ``,
    `| Metric | Value | Threshold |`,
    `|---|---:|---:|`,
    `| Pass rate | ${fmtPct(m.passRate)} | ≥ ${fmtPct(thresholds.passRateMin)} |`,
    `| Critical failures | ${m.critical} | ≤ ${thresholds.criticalMax} |`,
    `| Minor failures | ${m.minor} | ≤ ${thresholds.minorMax} |`,
    `| Passed / Total | ${m.passed} / ${m.total} | — |`,
    `| Duration (s) | ${(m.durationMs/1000).toFixed(2)} | — |`,
    `| Suites | ${m.suites.join(', ') || '—'} | — |`,
    ``,
    ok ? `**Result:** ✅ PASSED` : `**Result:** ❌ FAILED`,
    ``
  ].join('\n');

  fs.writeFileSync(path.resolve('tools/eval/reports/latest.gate.md'), outMd, 'utf8');
  console.log(outMd);
  process.exit(ok ? 0 : 1);
}
main();
