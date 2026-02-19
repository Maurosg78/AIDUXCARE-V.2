#!/usr/bin/env node
/**
 * Export User Feedback (formulario flotante)
 *
 * Lee la colección user_feedback de Firestore y exporta a JSON (y opcionalmente CSV).
 * Sirve para rescatar sugerencias y feedback del piloto.
 *
 * Uso:
 *   node scripts/export-user-feedback.cjs [--csv] [--report] [--unresolved-only | --resolved-only] [--project PROYECTO]
 *
 *   --report: genera informe CTO en docs/reports/ (requiere --unresolved-only)
 *
 * Credenciales (una de las dos):
 *   - GOOGLE_APPLICATION_CREDENTIALS=ruta/real/al/service-account.json
 *   - O sin esa variable: gcloud auth application-default login
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const path = resolve(process.cwd(), '.env.local');
if (fs.existsSync(path)) {
  require('dotenv').config({ path });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
const COLLECTION = 'user_feedback';

function initializeAdmin(projectId) {
  if (getApps().length === 0) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const fullPath = serviceAccountPath
      ? (isAbsolute(serviceAccountPath) ? serviceAccountPath : resolve(process.cwd(), serviceAccountPath))
      : null;
    if (fullPath && fs.existsSync(fullPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
    } else {
      if (serviceAccountPath) {
        console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo que no existe. Usando credenciales por defecto (gcloud).');
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      initializeApp({ projectId: projectId || PROJECT_ID });
    }
  }
  return getFirestore();
}

function toPlain(obj) {
  if (obj == null) return obj;
  if (obj && typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(toPlain);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = toPlain(v);
    return out;
  }
  return obj;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEVERITY_LABEL = { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' };
const TYPE_LABEL = { bug: 'Bug', suggestion: 'Sugerencia', question: 'Pregunta', other: 'Otro' };

function priorityScore(row) {
  const sev = SEVERITY_ORDER[row.severity] ?? 4;
  const calc = row.calculatedPriority ?? 0;
  const time = row.timestamp ? new Date(row.timestamp).getTime() : 0;
  return 100 - sev * 20 + calc + time / 1e12;
}

function generateCtoReport(rows, projectId, baseName) {
  const sorted = [...rows].sort((a, b) => priorityScore(b) - priorityScore(a));
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  rows.forEach((r) => {
    if (bySeverity[r.severity] !== undefined) bySeverity[r.severity]++;
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  let md = `# Informe de feedback pendiente — AiDuxCare Pilot

**Fecha del informe:** ${dateStr}  
**Export usado:** \`${baseName}.json\`  
**Proyecto:** ${projectId}  
**Estado:** ⏳ Pendientes por resolver

---

## Resumen

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| Crítico   | ${bySeverity.critical} | ${bySeverity.critical > 0 ? '🔴 Por resolver' : '—'} |
| Alto      | ${bySeverity.high} | ${bySeverity.high > 0 ? '🟠 Por resolver' : '—'} |
| Medio     | ${bySeverity.medium} | ${bySeverity.medium > 0 ? '🟡 Por resolver' : '—'} |
| Bajo      | ${bySeverity.low} | ${bySeverity.low > 0 ? '🟢 Por resolver' : '—'} |

**Total:** ${rows.length} ítems pendientes

---

## Ítems (ordenados por prioridad)

`;

  function formatTimestamp(ts) {
    if (!ts) return '—';
    if (typeof ts === 'string') return ts.slice(0, 19).replace('T', ' ');
    if (ts && typeof ts.toDate === 'function') return ts.toDate().toISOString().slice(0, 19).replace('T', ' ');
    if (ts && (ts.seconds || ts._seconds)) return new Date((ts.seconds || ts._seconds) * 1000).toISOString().slice(0, 19).replace('T', ' ');
    return '—';
  }

  sorted.forEach((item, idx) => {
    const desc = (item.description || '').replace(/\n/g, ' ').slice(0, 200);
    const url = (item.url || '').replace(/^https?:\/\/[^/]+/, '').slice(0, 60);
    md += `### ${idx + 1}. ${SEVERITY_LABEL[item.severity] || item.severity} — ${TYPE_LABEL[item.type] || item.type} | ⏳ Pendiente

- **ID:** \`${item.id}\`
- **Descripción:** "${desc}${desc.length >= 200 ? '…' : ''}"
- **URL:** ${url || '—'}
- **Prioridad calculada:** ${item.calculatedPriority ?? '—'}
- **Tags:** ${(item.autoTags || []).join(', ') || '—'}
- **Fecha:** ${formatTimestamp(item.timestamp)}

**Solución propuesta (para CTO):** _[pendiente]_

---

`;
  });

  md += `## Estrategia de trabajo (para CTO)

### Priorización
1. **Crítico/Alto** → Sprint actual (bloquean workflow o experiencia)
2. **Medio** → Próximo sprint (mejoras importantes)
3. **Bajo** → Backlog (cuando haya capacidad)

### Flujo de resolución
| Paso | Acción | Herramienta |
|------|--------|-------------|
| 1 | Revisar ítem | App \`/feedback-review\` (admin) |
| 2 | Anotar solución propuesta | Firestore o este informe |
| 3 | Crear WO/ticket | Repo o Jira |
| 4 | Implementar fix | Branch + PR |
| 5 | Marcar resuelto | \`node scripts/mark-feedback-resolved.cjs <id>\` |

### Comandos útiles
\`\`\`bash
# Exportar pendientes + generar este informe
node scripts/export-user-feedback.cjs --unresolved-only --report --csv

# Marcar como resuelto (uno o varios)
node scripts/mark-feedback-resolved.cjs <id1> <id2>
\`\`\`

---

## Próximos pasos

1. Revisar cada ítem en la app: \`/feedback-review\` (requiere admin)
2. Anotar solución propuesta en el informe o en Firestore
3. Crear WOs/tickets para implementación
4. Marcar como resuelto cuando se implemente: \`node scripts/mark-feedback-resolved.cjs <id>\`

---

*Generado por scripts/export-user-feedback.cjs --unresolved-only --report*
`;

  return md;
}

function rowToCsvRow(row) {
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    row.id,
    row.type,
    row.severity,
    row.description,
    row.url,
    row.userId ?? '',
    row.timestamp ?? '',
    row.resolved === true ? 'true' : (row.resolved === false ? 'false' : ''),
    row.resolvedAt ?? '',
    row.resolvedBy ?? '',
    row.autoTags ? row.autoTags.join(';') : '',
    row.calculatedPriority ?? '',
    row.enrichedContext ? JSON.stringify(row.enrichedContext) : '',
  ].map(esc).join(',');
}

async function main() {
  const args = process.argv.slice(2);
  const outCsv = args.includes('--csv');
  const outReport = args.includes('--report');
  const unresolvedOnly = args.includes('--unresolved-only');
  const resolvedOnly = args.includes('--resolved-only');
  const projectIdx = args.indexOf('--project');
  const projectId = projectIdx >= 0 && args[projectIdx + 1] ? args[projectIdx + 1] : PROJECT_ID;

  console.log('Proyecto:', projectId);
  console.log('Colección:', COLLECTION);

  const db = initializeAdmin(projectId);
  const snap = await db.collection(COLLECTION).orderBy('timestamp', 'desc').get();

  let rows = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...toPlain(data),
    };
  });

  if (unresolvedOnly) {
    rows = rows.filter((r) => r.resolved !== true);
    console.log('Filtro: solo no resueltos');
  } else if (resolvedOnly) {
    rows = rows.filter((r) => r.resolved === true);
    console.log('Filtro: solo resueltos');
  }

  console.log('Registros encontrados:', rows.length);

  const outDir = resolve(process.cwd(), 'scripts', 'exports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const baseName = `user_feedback_${projectId}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const jsonPath = resolve(outDir, `${baseName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log('JSON guardado:', jsonPath);

  if (outCsv) {
    const header = 'id,type,severity,description,url,userId,timestamp,resolved,resolvedAt,resolvedBy,autoTags,calculatedPriority,enrichedContext';
    const csvLines = [header, ...rows.map(rowToCsvRow)];
    const csvPath = resolve(outDir, `${baseName}.csv`);
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log('CSV guardado:', csvPath);
  }

  if (outReport && unresolvedOnly && rows.length > 0) {
    const reportsDir = resolve(process.cwd(), 'docs', 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const reportName = `INFORME_FEEDBACK_PENDIENTES_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.md`;
    const reportPath = resolve(reportsDir, reportName);
    const reportMd = generateCtoReport(rows, projectId, baseName);
    fs.writeFileSync(reportPath, reportMd, 'utf8');
    console.log('Informe CTO guardado:', reportPath);
  } else if (outReport && !unresolvedOnly) {
    console.warn('⚠️  --report requiere --unresolved-only. Informe no generado.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
