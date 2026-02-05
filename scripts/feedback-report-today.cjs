#!/usr/bin/env node
/**
 * Genera informe en Markdown con el feedback de un día (por defecto hoy).
 * Ordenado por prioridad (severidad + prioridad calculada).
 *
 * Uso:
 *   node scripts/feedback-report-today.cjs [scripts/exports/user_feedback_XXX.json] [--today 2026-02-04]
 * Si no se pasa archivo, usa el JSON más reciente en scripts/exports/.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.endsWith('.json'));
const todayIdx = args.indexOf('--today');
const todayStr = todayIdx >= 0 && args[todayIdx + 1] ? args[todayIdx + 1] : null;

function getTodayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const targetDate = todayStr || getTodayYYYYMMDD();

function parseDate(item) {
  const t = item.timestamp;
  if (!t) return null;
  if (typeof t === 'string') {
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function isSameDay(date, yyyymmdd) {
  if (!date) return false;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` === yyyymmdd;
}

const SEVERITY_WEIGHT = { critical: 40, high: 30, medium: 20, low: 10 };
function priorityScore(item) {
  const w = SEVERITY_WEIGHT[item.severity] ?? 0;
  const calc = item.calculatedPriority ?? 0;
  const t = item.timestamp;
  const time = t ? new Date(t).getTime() : 0;
  return w + calc + time / 1e12;
}

function findLatestExport(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('user_feedback_') && f.endsWith('.json'));
  if (files.length === 0) return null;
  files.sort();
  return path.join(dir, files[files.length - 1]);
}

const exportsDir = path.resolve(process.cwd(), 'scripts', 'exports');
const jsonPath = fileArg
  ? path.resolve(process.cwd(), fileArg)
  : findLatestExport(exportsDir);

if (!jsonPath || !fs.existsSync(jsonPath)) {
  console.error('No se encontró archivo de export. Ejecuta: node scripts/export-user-feedback.cjs');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const list = Array.isArray(data) ? data : [];

const todayItems = list.filter((item) => {
  const d = parseDate(item);
  return d && isSameDay(d, targetDate);
});

todayItems.sort((a, b) => priorityScore(b) - priorityScore(a));

const severityLabel = { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' };
const typeLabel = { bug: 'Bug', suggestion: 'Sugerencia', question: 'Pregunta', other: 'Otro' };

function formatTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

const lines = [
  `# Informe de feedback — ${targetDate}`,
  '',
  `**Fecha del informe:** ${new Date().toLocaleString('es-CL')}`,
  `**Export usado:** \`${path.basename(jsonPath)}\``,
  `**Total ítems con fecha ${targetDate}:** ${todayItems.length}`,
  '',
  '---',
  '',
];

if (todayItems.length === 0) {
  lines.push('No hay feedback registrado para esta fecha en el export.');
  lines.push('');
  lines.push('Para incluir feedback de hoy, ejecuta primero:');
  lines.push('  `node scripts/export-user-feedback.cjs`');
  lines.push('y luego vuelve a ejecutar este script.');
} else {
  lines.push('## Por prioridad (mayor urgencia primero)');
  lines.push('');
  todayItems.forEach((item, i) => {
    const ts = typeof item.timestamp === 'string' ? item.timestamp : item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toISOString() : null;
    lines.push(`### ${i + 1}. ${severityLabel[item.severity] || item.severity} — ${typeLabel[item.type] || item.type}`);
    lines.push('');
    lines.push(`- **ID:** \`${item.id}\``);
    lines.push(`- **Prioridad calculada:** ${item.calculatedPriority ?? '—'}`);
    lines.push(`- **Hora:** ${formatTs(ts)}`);
    if (item.url) lines.push(`- **URL:** ${item.url}`);
    if (item.autoTags?.length) lines.push(`- **Tags:** ${item.autoTags.join(', ')}`);
    lines.push('');
    lines.push('**Descripción / problema:**');
    lines.push('');
    lines.push('```');
    lines.push((item.description || '').trim());
    lines.push('```');
    lines.push('');
    if (item.solutionProposal) {
      lines.push('**Solución propuesta:**');
      lines.push('');
      lines.push(item.solutionProposal);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  });
}

const outPath = path.join(exportsDir, `INFORME_FEEDBACK_${targetDate}.md`);
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Informe guardado:', outPath);
console.log('Ítems de', targetDate + ':', todayItems.length);
