#!/usr/bin/env node
/**
 * Analiza un export JSON de user_feedback y clasifica:
 * - Candidatos a marcar como RESUELTOS (localhost, dev antiguo)
 * - NO resueltos: fecha de hoy (no tocar) o pilot/prod (revisar)
 *
 * Uso:
 *   node scripts/analyze-feedback-resolved.cjs scripts/exports/user_feedback_XXX.json [--today 2026-02-04]
 *
 * Genera:
 *   scripts/exports/feedback-ids-to-mark-resolved.txt  (IDs a marcar como resueltos)
 *   scripts/exports/feedback-analysis-report.md       (resumen + pendientes)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.endsWith('.json'));
const todayIdx = args.indexOf('--today');
const markAllNotToday = args.includes('--mark-all-not-today');
const todayStr = todayIdx >= 0 && args[todayIdx + 1] ? args[todayIdx + 1] : '2026-02-04'; // YYYY-MM-DD

if (!fileArg || !fs.existsSync(fileArg)) {
  console.error('Uso: node scripts/analyze-feedback-resolved.cjs scripts/exports/user_feedback_XXX.json [--today YYYY-MM-DD] [--mark-all-not-today]');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
if (!Array.isArray(data)) {
  console.error('El JSON debe ser un array de objetos.');
  process.exit(1);
}

function parseDate(item) {
  const t = item.timestamp;
  if (!t) return null;
  if (typeof t === 'string') {
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function isToday(date, todayYYYYMMDD) {
  if (!date) return false;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` === todayYYYYMMDD;
}

const resolvedCandidates = []; // marcar como resueltos
const notResolvedToday = [];   // fecha hoy → no tocar
const notResolvedReview = [];  // pilot/prod o sin fecha clara → revisar manual

for (const item of data) {
  const id = item.id;
  const url = (item.url || '').toLowerCase();
  const date = parseDate(item);
  const alreadyResolved = item.resolved === true;

  if (alreadyResolved) continue;

  if (date && isToday(date, todayStr)) {
    notResolvedToday.push({ id, url: item.url, type: item.type, description: (item.description || '').slice(0, 80) });
    continue;
  }

  if (markAllNotToday) {
    resolvedCandidates.push({ id, url: item.url, type: item.type, description: (item.description || '').slice(0, 80) });
    continue;
  }

  if (url.includes('localhost')) {
    resolvedCandidates.push({ id, url: item.url, type: item.type, description: (item.description || '').slice(0, 80) });
    continue;
  }

  if (url.includes('dev.aiduxcare.com')) {
    if (date && date < new Date(todayStr)) {
      resolvedCandidates.push({ id, url: item.url, type: item.type, description: (item.description || '').slice(0, 80) });
    } else {
      notResolvedReview.push({ id, url: item.url, type: item.type, description: (item.description || '').slice(0, 80), reason: 'dev (sin fecha o reciente)' });
    }
    continue;
  }

  notResolvedReview.push({ id, url: item.url, type: item.type, description: (item.description || '').slice(0, 80), reason: 'pilot/prod o sin URL' });
}

const outDir = path.resolve(process.cwd(), 'scripts', 'exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const idsToMarkPath = path.join(outDir, 'feedback-ids-to-mark-resolved.txt');
fs.writeFileSync(
  idsToMarkPath,
  resolvedCandidates.map((r) => r.id).join('\n'),
  'utf8'
);

const reportPath = path.join(outDir, 'feedback-analysis-report.md');
const report = `# Análisis de feedback (resuelto / no resuelto)

Export analizado: \`${path.basename(fileArg)}\`  
Fecha "hoy" usada: **${todayStr}** (los de esta fecha no se marcan como resueltos).

## Resumen

| Categoría | Cantidad | Acción |
|-----------|----------|--------|
| **Candidatos a marcar como resueltos** (localhost o dev antiguo) | ${resolvedCandidates.length} | \`node scripts/mark-feedback-resolved.cjs --file scripts/exports/feedback-ids-to-mark-resolved.txt\` |
| **No resueltos (fecha de hoy)** | ${notResolvedToday.length} | No tocar |
| **Revisar manual** (pilot/prod o sin fecha) | ${notResolvedReview.length} | Revisar y marcar a mano si aplica |

---

## IDs a marcar como resueltos (${resolvedCandidates.length})

Lista en \`feedback-ids-to-mark-resolved.txt\`. Ejemplo de entradas:

${resolvedCandidates.slice(0, 15).map((r) => `- \`${r.id}\` ${r.type} – ${r.description.replace(/\n/g, ' ')}`).join('\n')}
${resolvedCandidates.length > 15 ? `\n... y ${resolvedCandidates.length - 15} más.\n` : ''}

---

## No resueltos (fecha de hoy) – ${notResolvedToday.length}

${notResolvedToday.length === 0 ? '_Ninguno con fecha de hoy en el export._' : notResolvedToday.map((r) => `- \`${r.id}\` ${r.type} – ${r.description.replace(/\n/g, ' ')}`).join('\n')}

---

## Revisar manual (pilot/prod) – ${notResolvedReview.length}

${notResolvedReview.length === 0 ? '_Ninguno._' : notResolvedReview.map((r) => `- \`${r.id}\` ${r.type} – ${r.description.replace(/\n/g, ' ')} (${r.reason || ''})`).join('\n')}
`;

fs.writeFileSync(reportPath, report, 'utf8');

console.log('Análisis completado.');
console.log('  Candidatos a RESUELTO (localhost/dev antiguo):', resolvedCandidates.length);
console.log('  No resueltos (fecha hoy):', notResolvedToday.length);
console.log('  Revisar manual (pilot/prod):', notResolvedReview.length);
console.log('  IDs a marcar →', idsToMarkPath);
console.log('  Reporte →', reportPath);
console.log('');
console.log('Para marcar los candidatos como resueltos en Firestore:');
console.log('  node scripts/mark-feedback-resolved.cjs --file scripts/exports/feedback-ids-to-mark-resolved.txt');
console.log('');
