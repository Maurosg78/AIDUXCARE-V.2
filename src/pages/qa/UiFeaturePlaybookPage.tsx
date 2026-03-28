/**
 * Matriz de enlaces para probar la app por UI sin crear pacientes nuevos en cada paso.
 * Activa en desarrollo o con VITE_ENABLE_UI_PLAYBOOK=true (útil en VPS de QA).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ClipboardCopy, ExternalLink } from 'lucide-react';

const STORAGE_PATIENT = 'aidux:ui-playbook:patientId';
const STORAGE_NOTE = 'aidux:ui-playbook:noteId';
const STORAGE_SESSION = 'aidux:ui-playbook:sessionId';
const STORAGE_TOKEN = 'aidux:ui-playbook:consentToken';

export function uiPlaybookEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_UI_PLAYBOOK === 'true';
}

export function UiFeaturePlaybookGate() {
  if (!uiPlaybookEnabled()) {
    return <Navigate to="/command-center" replace />;
  }
  return <UiFeaturePlaybookPage />;
}

type PlayRow = {
  id: string;
  title: string;
  hint: string;
  /** Path + query only (same origin). Use <PATIENT>, <NOTE>, <SESSION>, <TOKEN> placeholders. */
  path: string;
  /** If true, shown in "público" section — opened as absolute URL (still same origin in practice). */
  publicFacing?: boolean;
};

const AUTH_ROWS: PlayRow[] = [
  {
    id: 'cmd',
    title: 'Command Center',
    hint: 'Panel principal; crea o abre pacientes desde aquí si hace falta.',
    path: '/command-center',
  },
  {
    id: 'wf-initial',
    title: 'Workflow — valoración inicial',
    hint: 'Mismo paciente; pestañas análisis, evaluación, SOAP.',
    path: '/workflow?type=initial&patientId=<PATIENT>',
  },
  {
    id: 'wf-followup',
    title: 'Workflow — seguimiento',
    hint: 'Limpia estado local según reglas del flujo; probá después de una IA finalizada.',
    path: '/workflow?type=followup&patientId=<PATIENT>',
  },
  {
    id: 'wf-resume',
    title: 'Workflow — reanudar sesión (IA)',
    hint: 'Sustituí <SESSION> por id de sesión real (URL o Firestore).',
    path: '/workflow?patientId=<PATIENT>&sessionId=<SESSION>&resume=true',
  },
  {
    id: 'patient',
    title: 'Ficha / dashboard paciente',
    hint: 'Historial y visitas del paciente canario.',
    path: '/patients/<PATIENT>',
  },
  {
    id: 'patient-history',
    title: 'Historial explícito',
    hint: 'Alias útil para probar duplicados de notas / timeline.',
    path: '/patients/<PATIENT>/history',
  },
  {
    id: 'notes',
    title: 'Lista de notas',
    hint: 'Todas las notas del profesional.',
    path: '/notes',
  },
  {
    id: 'note-detail',
    title: 'Detalle de nota',
    hint: 'Sustituí <NOTE> por id de documento de nota (ej. note_...).',
    path: '/notes/<NOTE>',
  },
  {
    id: 'feedback-review',
    title: 'Revisión de feedback (interno)',
    hint: 'Lista de user_feedback (requiere rol/acceso igual que en prod).',
    path: '/feedback-review',
  },
  {
    id: 'consent-verification',
    title: 'Verificación de consentimiento (interno)',
    hint: 'Ruta legacy interna; muchas pruebas reales van por token público.',
    path: '/consent-verification/<PATIENT>',
  },
];

const PUBLIC_ROWS: PlayRow[] = [
  {
    id: 'disclosure',
    title: 'Disclosure (SMS / post-consent verbal)',
    hint: 'Probá ?lang=es. Requiere patientId real existente.',
    path: '/disclosure/<PATIENT>?lang=es',
    publicFacing: true,
  },
  {
    id: 'consent-portal',
    title: 'Portal de consentimiento paciente',
    hint: 'Pegá el token que devuelve el flujo o el SMS; no uses un placeholder inventado.',
    path: '/consent/<TOKEN>',
    publicFacing: true,
  },
  {
    id: 'privacy',
    title: 'Política de privacidad',
    hint: 'Enlace que suele abrirse desde portales paciente.',
    path: '/privacy-policy',
    publicFacing: true,
  },
];

function replacePlaceholders(path: string, p: { patient: string; note: string; session: string; token: string }): string {
  return path
    .replaceAll('<PATIENT>', encodeURIComponent(p.patient) || '<PATIENT>')
    .replaceAll('<NOTE>', encodeURIComponent(p.note) || '<NOTE>')
    .replaceAll('<SESSION>', encodeURIComponent(p.session) || '<SESSION>')
    .replaceAll('<TOKEN>', encodeURIComponent(p.token) || '<TOKEN>');
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt('Copiar:', text);
  }
}

function PlayRowCard({
  row,
  href,
  absoluteHref,
}: {
  row: PlayRow;
  href: string;
  absoluteHref: string;
}) {
  const broken = href.includes('<');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{row.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{row.hint}</p>
          <code className="mt-2 block break-all text-xs text-slate-500">{href}</code>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <button
            type="button"
            onClick={() => copyText(absoluteHref)}
            disabled={broken}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ClipboardCopy className="h-4 w-4" />
            Copiar URL
          </button>
          {row.publicFacing ? (
            <a
              href={broken ? undefined : href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 ${broken ? 'pointer-events-none opacity-40' : ''}`}
            >
              Abrir
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : broken ? (
            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md bg-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600">
              Completa IDs
            </span>
          ) : (
            <Link
              to={href}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Abrir en app
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UiFeaturePlaybookPage() {
  const [patientId, setPatientId] = useState('');
  const [noteId, setNoteId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [consentToken, setConsentToken] = useState('');

  useEffect(() => {
    setPatientId(sessionStorage.getItem(STORAGE_PATIENT) || '');
    setNoteId(sessionStorage.getItem(STORAGE_NOTE) || '');
    setSessionId(sessionStorage.getItem(STORAGE_SESSION) || '');
    setConsentToken(sessionStorage.getItem(STORAGE_TOKEN) || '');
  }, []);

  const persist = useCallback(() => {
    sessionStorage.setItem(STORAGE_PATIENT, patientId.trim());
    sessionStorage.setItem(STORAGE_NOTE, noteId.trim());
    sessionStorage.setItem(STORAGE_SESSION, sessionId.trim());
    sessionStorage.setItem(STORAGE_TOKEN, consentToken.trim());
  }, [patientId, noteId, sessionId, consentToken]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const params = useMemo(
    () => ({
      patient: patientId.trim(),
      note: noteId.trim(),
      session: sessionId.trim(),
      token: consentToken.trim(),
    }),
    [patientId, noteId, sessionId, consentToken],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Matriz de pruebas UI</h1>
        <p className="mt-2 text-slate-600">
          Definí un <strong>paciente canario</strong> (un solo <code className="rounded bg-slate-100 px-1">patientId</code> de Firestore) y
          usá estos enlaces para recorrer cada feature como en producción, sin crear pacientes nuevos en cada clic.
        </p>
        <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Las rutas públicas (consentimiento con token) necesitan valores reales generados por el flujo o el SMS; no se pueden adivinar.
        </p>
      </div>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-slate-800">Valores guardados (sessionStorage)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Patient ID (obligatorio para la mayoría)</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onBlur={persist}
              placeholder="ej. lWYBYkOQ72wJqSCxBMsi"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Note ID (opcional)</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
              onBlur={persist}
              placeholder="ej. note_1774272918482_smxd37"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Session ID — reanudar IA (opcional)</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              onBlur={persist}
              placeholder="id de sesión / encounter"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Token consentimiento paciente (opcional)</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={consentToken}
              onChange={(e) => setConsentToken(e.target.value)}
              onBlur={persist}
              placeholder="token de /consent/..."
            />
          </label>
        </div>
        <button
          type="button"
          onClick={persist}
          className="mt-4 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          Guardar en este navegador
        </button>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Área autenticada (misma sesión)</h2>
        <div className="flex flex-col gap-3">
          {AUTH_ROWS.map((row) => {
            const href = replacePlaceholders(row.path, params);
            const absoluteHref = `${origin}${href}`;
            return <PlayRowCard key={row.id} row={row} href={href} absoluteHref={absoluteHref} />;
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Rutas paciente (sin login; mismo origen)</h2>
        <div className="flex flex-col gap-3">
          {PUBLIC_ROWS.map((row) => {
            const href = replacePlaceholders(row.path, params);
            const absoluteHref = `${origin}${href}`;
            return <PlayRowCard key={row.id} row={row} href={href} absoluteHref={absoluteHref} />;
          })}
        </div>
      </section>
    </div>
  );
}
