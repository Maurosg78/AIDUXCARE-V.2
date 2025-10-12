/**
 * eval-gate.cjs
 * Reads latest JSONL (or provided path), computes metrics vs thresholds, exits 0/1.
 * Outputs short Markdown summary to tools/eval/reports/latest.gate.md
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

// Expect each record to have: { status: "pass"|"fail", severity?: "critical"|"minor"|... , duration_ms?: number, suite?: string }
function computeMetrics(rows) {
  let passed = 0, failed = 0, critical = 0, minor = 0, durationMs = 0;
  const suites = new Set();
  for (const r of rows) {
    if (r.suite) suites.add(r.suite);
    if (typeof r.duration_ms === 'number') durationMs += r.duration_ms;
    if (r.status === 'pass') passed++;
    else {
      failed++;
      if (r.severity === 'critical') critical++;
      else minor++;
    }
  }
  const total = passed + failed;
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

  const gateOut = path.resolve('tools/eval/reports/latest.gate.md');
  fs.writeFileSync(gateOut, outMd, 'utf8');

  console.log(outMd);
  process.exit(ok ? 0 : 1);
}

main();
