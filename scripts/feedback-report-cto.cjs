#!/usr/bin/env node
/**
 * Informe de feedback para CTO: todos los ítems (resueltos y no resueltos)
 * ordenados por prioridad. Incluye resumen y estado de resolución.
 *
 * Uso:
 *   node scripts/feedback-report-cto.cjs [scripts/exports/user_feedback_XXX.json]
 * Si no se pasa archivo, usa el JSON más reciente en scripts/exports/.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.endsWith('.json'));

const SEVERITY_WEIGHT = { critical: 40, high: 30, medium: 20, low: 10 };
function priorityScore(item) {
  const w = SEVERITY_WEIGHT[item.severity] ?? 0;
  const calc = item.calculatedPriority ?? 0;
  const t = toTimestamp(item);
  return w + calc + (t || 0) / 1e12;
}

function toTimestamp(item) {
  const t = item.timestamp;
  if (!t) return null;
  if (typeof t === 'string') {
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  if (t.seconds != null) return t.seconds * 1000;
  return null;
}

function formatTs(item) {
  const t = toTimestamp(item);
  if (!t) return '—';
  return new Date(t).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
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

const resolved = list.filter((i) => i.resolved === true);
const unresolved = list.filter((i) => i.resolved !== true);

const sorted = [...list].sort((a, b) => priorityScore(b) - priorityScore(a));

const severityLabel = { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' };
const typeLabel = { bug: 'Bug', suggestion: 'Sugerencia', question: 'Pregunta', other: 'Otro' };

const lines = [
  '# Informe de feedback — CTO',
  '',
  `**Fecha del informe:** ${new Date().toLocaleString('es-CL')}`,
  `**Export usado:** \`${path.basename(jsonPath)}\``,
  '',
  '## Resumen',
  '',
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Total ítems | ${list.length} |`,
  `| Resueltos | ${resolved.length} |`,
  `| Pendientes | ${unresolved.length} |`,
  '',
  '---',
  '',
  '## Ítems por prioridad (mayor urgencia primero)',
  '',
];

sorted.forEach((item, i) => {
  const resBadge = item.resolved ? ' ✅ Resuelto' : ' ⏳ Pendiente';
  const ts = typeof item.timestamp === 'string'
    ? item.timestamp
    : item.timestamp?.seconds
      ? new Date(item.timestamp.seconds * 1000).toISOString()
      : null;
  lines.push(`### ${i + 1}. ${severityLabel[item.severity] || item.severity} — ${typeLabel[item.type] || item.type}${resBadge}`);
  lines.push('');
  lines.push(`- **ID:** \`${item.id}\``);
  lines.push(`- **Prioridad calculada:** ${item.calculatedPriority ?? '—'}`);
  lines.push(`- **Hora:** ${formatTs(item)}`);
  if (item.resolvedAt) lines.push(`- **Resuelto:** ${item.resolvedAt} (${item.resolvedBy || '—'})`);
  if (item.url) lines.push(`- **URL:** ${item.url}`);
  if (item.autoTags?.length) lines.push(`- **Tags:** ${item.autoTags.join(', ')}`);
  lines.push('');
  lines.push('**Descripción / problema:**');
  lines.push('');
  lines.push('```');
  lines.push((item.description || '').trim().slice(0, 2000));
  if ((item.description || '').length > 2000) lines.push('...(recortado)');
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

const outPath = path.join(exportsDir, 'INFORME_CTO_FEEDBACK.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Informe CTO guardado:', outPath);
console.log('Total:', list.length, '| Resueltos:', resolved.length, '| Pendientes:', unresolved.length);
