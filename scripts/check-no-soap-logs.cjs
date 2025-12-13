const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const PATTERNS = [
  /\[PHASE2\]/,
  /\[SOAP\]/,
  /\[WORKFLOW\]/,
  /\[IMAGING_/,
  /console\.log\(/,
  /console\.debug\(/,
  /console\.warn\(/,
  /console\.error\(/
];

const IGNORE = [/node_modules/, /dist/, /build/, /coverage/];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (IGNORE.some(r => r.test(p))) continue;
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(p)) out.push(p);
  }
  return out;
}

let hits = [];

if (fs.existsSync(SRC_DIR)) {
  for (const file of walk(SRC_DIR)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((l, i) => {
      if (PATTERNS.some(r => r.test(l))) {
        hits.push(`${file}:${i + 1}  ${l.trim()}`);
      }
    });
  }
}

if (hits.length) {
  console.error('❌ Forbidden logs found:');
  hits.slice(0, 200).forEach(h => console.error(h));
  if (hits.length > 200) console.error(`...and ${hits.length - 200} more`);
  process.exit(1);
}

console.log('✅ No forbidden logs found');
