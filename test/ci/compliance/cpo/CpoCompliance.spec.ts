import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const DOCS = [
  'docs/north/READING_GUIDE.md',
  'docs/north/SOURCE_OF_TRUTH.md',
  'docs/north/LIMITS.md',
];

const EXT_OK = new Set(['.ts', '.tsx', '.js', '.json', '.env']);
const IGNORE_DIRS = new Set([
  'node_modules','dist','build','.git','.github',
  // locales/ES permitidos como *opcional*, pero no deben ser default:
  'public/locales/es','src/locales/es','src/i18n/es','locales/es',
  // tests y artefactos
  'test','tests','artifacts','docs','scripts'
]);

function walk(dir: string, out: string[] = []) {
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e);
    let stat; try { stat = fs.statSync(p); } catch { continue; }
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(e)) walk(p, out);
    } else {
      const ext = path.extname(p);
      if (EXT_OK.has(ext)) out.push(p);
    }
  }
  return out;
}

function contains(p: string, re: RegExp): boolean {
  let txt = '';
  try { txt = fs.readFileSync(p, 'utf8'); } catch { return false; }
  return re.test(txt);
}

describe('CPO Compliance (Ontario) — SoT enforcement (Market: CA, Language: en-CA)', () => {
  it('SoT docs are present in repo', () => {
    const missing = DOCS.filter(f => !fs.existsSync(path.join(ROOT, f)));
    expect(missing, `Missing SoT docs: ${missing.join(', ')}`).toEqual([]);
  });

  it('No Spanish as default locale anywhere', () => {
    const files = walk(path.join(ROOT, 'src'));
    const offenders: string[] = [];
    const badRes = [
      /defaultLocale\s*:\s*['"](es(?:-ES)?)['"]/i,
      /lng\s*:\s*['"](es(?:-ES)?)['"]/i,
      /fallbackLng\s*:\s*['"](es(?:-ES)?)['"]/i,
      /DEFAULT_LOCALE\s*=\s*['"](es(?:-ES)?)['"]/i,
      /moment\.locale\(\s*['"]es['"]\s*\)/i,
      /VITE_LOCALE_DEFAULT\s*=\s*es(?:-ES)?/i,
    ];
    for (const f of files) {
      const txt = fs.readFileSync(f, 'utf8');
      if (badRes.some(re => re.test(txt))) offenders.push(path.relative(ROOT, f));
    }
    expect(offenders, `Spanish found as DEFAULT in: ${offenders.join(', ')}`).toEqual([]);
  });

  it('English is the default locale (en or en-CA)', () => {
    const files = walk(path.join(ROOT, 'src'));
    const goodRes = [
  /(?:export\s+)?(?:const\s+)?DEFAULT_LOCALE\s*=\s*['\"]en(?:-CA)?['\"]/i,
      /defaultLocale\s*:\s*['"]en(?:-CA)?['"]/i,
      /lng\s*:\s*['"]en(?:-CA)?['"]/i,
      /DEFAULT_LOCALE\s*=\s*['"]en(?:-CA)?['"]/i,
      /VITE_LOCALE_DEFAULT\s*=\s*en(?:-CA)?/i,
      /moment\.locale\(\s*['"]en(?:-CA)?['"]\s*\)/i,
    ];
    const found = files.some(f => {
      try {
        const txt = fs.readFileSync(f, 'utf8');
        return goodRes.some(re => re.test(txt));
      } catch { return false; }
    });
    expect(found).toBe(true);
  });
});
