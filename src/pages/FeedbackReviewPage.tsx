/**
 * Revisión de feedback pendiente (solo admins).
 * Expone problema, urgencia/impacto y permite anotar solución propuesta para implementación.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  FeedbackService,
  type UserFeedback,
  type FeedbackSeverity,
  type FeedbackType,
} from '@/services/feedbackService';

type FeedbackItem = { id: string } & UserFeedback;

const SEVERITY_LABEL: Record<FeedbackSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};
const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: 'Bug',
  suggestion: 'Sugerencia',
  question: 'Pregunta',
  other: 'Otro',
};

function formatDate(d: Date): string {
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

/** Mismo día en zona horaria local que "hoy". */
function isToday(d: Date | undefined): boolean {
  if (!d || typeof d.getTime !== 'function' || Number.isNaN(d.getTime())) return false;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/** Orden de prioridad: 1 = más urgente. Severidad (critical > high > medium > low) + prioridad calculada + fecha reciente. */
const SEVERITY_WEIGHT: Record<FeedbackSeverity, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
};
function priorityScore(item: FeedbackItem): number {
  const severity = SEVERITY_WEIGHT[item.severity] ?? 0;
  const calc = item.calculatedPriority ?? 0;
  const time = item.timestamp ? item.timestamp.getTime() : 0;
  return severity + calc + time / 1e12; // severidad + prioridad + tie-break por fecha
}

export const FeedbackReviewPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [solutionDraft, setSolutionDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [soloHoy, setSoloHoy] = useState(true);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await FeedbackService.listUnresolvedFeedback(80);
      setList(data);
      setSolutionDraft((prev) => {
        const next = { ...prev };
        data.forEach((item) => {
          if (item.solutionProposal != null && next[item.id] === undefined) {
            next[item.id] = item.solutionProposal;
          }
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar feedback');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredList = React.useMemo(() => {
    let items = list;
    if (soloHoy) {
      items = items.filter((item) => item.timestamp && isToday(item.timestamp));
    }
    return [...items].sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [list, soloHoy]);

  const saveSolution = async (id: string, solution: string) => {
    setSavingId(id);
    try {
      await FeedbackService.updateFeedbackAdmin(id, { solutionProposal: solution || undefined });
      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, solutionProposal: solution || undefined } : item))
      );
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const markResolved = async (id: string) => {
    setSavingId(id);
    try {
      await FeedbackService.updateFeedbackAdmin(id, {
        resolved: true,
        resolvedBy: user?.uid,
      });
      setList((prev) => prev.filter((item) => item.id !== id));
      setEditingId(null);
      setSolutionDraft((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-slate-600">Inicia sesión para acceder.</p>
        <Link to="/login" className="text-blue-600 underline mt-2 inline-block">
          Ir a login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Revisión de feedback</h1>
        <p className="text-slate-600">Acceso solo para administradores.</p>
        <Link to="/command-center" className="text-blue-600 underline mt-2 inline-block">
          Volver al Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Feedback pendiente</h1>
        <Link to="/command-center" className="text-sm text-slate-500 hover:text-slate-700">
          ← Command Center
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={soloHoy}
            onChange={(e) => setSoloHoy(e.target.checked)}
            className="rounded border-slate-300"
          />
          Solo hoy
        </label>
        <p className="text-sm text-slate-500">
          Orden: prioridad = severidad (crítico → bajo) + prioridad calculada + fecha. Más urgente primero.
        </p>
      </div>

      {loading && <p className="text-slate-500">Cargando…</p>}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm mb-4">
          {error}
        </div>
      )}

      {!loading && !error && filteredList.length === 0 && (
        <p className="text-slate-500">
          {soloHoy ? 'No hay feedback pendiente de hoy.' : 'No hay feedback pendiente.'}
        </p>
      )}

      {!loading && filteredList.length > 0 && (
        <ul className="space-y-4">
          {filteredList.map((item, index) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold">
                  {index + 1}
                </span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${item.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : item.severity === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                >
                  {SEVERITY_LABEL[item.severity]}
                </span>
                <span className="text-xs text-slate-500">{TYPE_LABEL[item.type]}</span>
                {item.calculatedPriority != null && item.calculatedPriority > 0 && (
                  <span className="text-xs text-slate-400">Prioridad {item.calculatedPriority.toFixed(1)}</span>
                )}
                <span className="text-xs text-slate-400 ml-auto">
                  {item.timestamp ? formatDate(item.timestamp) : '—'}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-xs font-medium text-slate-500">Problema / descripción</span>
                <p className="mt-0.5 text-sm text-slate-900 whitespace-pre-wrap break-words">
                  {item.description}
                </p>
              </div>

              {item.url && (
                <p className="text-xs text-slate-500 mb-2 truncate" title={item.url}>
                  URL: {item.url}
                </p>
              )}

              {item.autoTags && item.autoTags.length > 0 && (
                <p className="text-xs text-slate-400 mb-2">Tags: {item.autoTags.join(', ')}</p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Solución propuesta (para revisión e implementación)
                </label>
                {editingId === item.id ? (
                  <div>
                    <textarea
                      className="w-full rounded border border-slate-300 p-2 text-sm min-h-[80px]"
                      value={solutionDraft[item.id] ?? item.solutionProposal ?? ''}
                      onChange={(e) =>
                        setSolutionDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Describir solución o pasos para implementar…"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        className="rounded bg-slate-700 text-white px-3 py-1.5 text-sm disabled:opacity-50"
                        disabled={savingId === item.id}
                        onClick={() => saveSolution(item.id, solutionDraft[item.id] ?? '')}
                      >
                        {savingId === item.id ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-3 py-1.5 text-sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1 min-w-0">
                      {item.solutionProposal || '—'}
                    </p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        onClick={() => setEditingId(item.id)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded bg-green-700 text-white px-2 py-1 text-xs disabled:opacity-50"
                        disabled={savingId === item.id}
                        onClick={() => markResolved(item.id)}
                      >
                        {savingId === item.id ? '…' : 'Marcar resuelto'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeedbackReviewPage;
