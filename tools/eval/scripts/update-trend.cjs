/**
 * update-trend.cjs
 * Appends/updates tools/eval/trends/quality-trend.md with one row per tag.
 * Uses latest JSONL per tag (expects CI to generate on tag builds).
 */
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

function gitTags() {
  const raw = execSync('git tag --list --sort=creatordate', {encoding:'utf8'}).trim();
  return raw ? raw.split('\n').filter(Boolean) : [];
}

function latestJsonlForTag(tag) {
  // convention: CI stores report as tools/eval/reports/<tag>*.jsonl OR fallback to most recent *.jsonl
  const dir = path.resolve('tools/eval/reports');
  if (!fs.existsSync(dir)) return null;
  const candidates = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  const tagMatches = candidates.filter(f => f.startsWith(`${tag}__`));
  const files = (tagMatches.length ? tagMatches : candidates).map(f => path.join(dir,f));
  if (!files.length) return null;
  files.sort((a,b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

function parseJsonl(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(l => JSON.parse(l));
}

function compute(rows) {
  let passed=0, failed=0, critical=0, minor=0, durationMs=0;
  for (const r of rows) {
    if (typeof r.duration_ms === 'number') durationMs += r.duration_ms;
    if (r.status === 'pass') passed++;
    else {
      failed++;
      if (r.severity === 'critical') critical++; else minor++;
    }
  }
  const total = passed + failed;
  return {
    passRate: total ? passed/total : 0,
    failures: failed,
    durationSec: +(durationMs/1000).toFixed(2)
  };
}

function tagDate(tag) {
  const iso = execSync(`git log -1 --format=%aI ${tag}`, {encoding:'utf8'}).trim();
  return iso || new Date().toISOString();
}

function upsertMarkdown(rows) {
  const out = path.resolve('tools/eval/trends/quality-trend.md');
  const header = `# Quality Trendline (per tag)

| Date (ISO) | Tag | Pass rate | Failures | Duration (s) | Note |
|---|---|---:|---:|---:|---|
`;
  let current = fs.existsSync(out) ? fs.readFileSync(out,'utf8') : header;
  if (!current.startsWith('# Quality Trendline')) current = header;

  // Build a map for replacement (idempotent)
  for (const r of rows) {
    const line = `| ${r.date} | ${r.tag} | ${(r.passRate*100).toFixed(1)}% | ${r.failures} | ${r.durationSec} | ${r.note || ''} |`;
    const regex = new RegExp(`\\|\\s[^|]*\\s\\|\\s${r.tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s\\|.*`, 'g');
    if (current.match(regex)) {
      current = current.replace(regex, line);
    } else {
      current += line + '\n';
    }
  }
  fs.writeFileSync(out, current, 'utf8');
}

function main() {
  const tags = gitTags();
  const rows = [];
  for (const tag of tags) {
    const jsonl = latestJsonlForTag(tag);
    if (!jsonl) continue;
    const m = compute(parseJsonl(jsonl));
    rows.push({ date: tagDate(tag), tag, passRate: m.passRate, failures: m.failures, durationSec: m.durationSec, note: '' });
  }
  if (!rows.length) {
    console.log('No trend rows to write.');
    return;
  }
  upsertMarkdown(rows);
  console.log('Trendline updated:', 'tools/eval/trends/quality-trend.md');
}
main();
