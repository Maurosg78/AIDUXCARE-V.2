/**
 * Today's Patients Panel
 *
 * Quick schedule: add patient + session type to today's list; when it's time, press Start on that row.
 * Optional: "Start in-clinic session now" for immediate start without adding to list.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Patient } from '@/services/patientService';
import { PatientWorkflowStatus } from '../../../domain/patientStatus';
import type { ClinicalDayRow } from '../utils/clinicalDayView';
import { usePatientsList } from '../hooks/usePatientsList';
import { Play, UserPlus, RefreshCw, FileText, Trash2, RotateCcw, Calendar } from 'lucide-react';

export interface TodayAppointment {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  sessionType?: string;
  chips?: {
    type: 'wsib' | 'consent-required' | 'pending-note';
    label: string;
  }[];
}

/** Quick-schedule item: patient + session type for today's list */
export interface TodayQuickItem {
  patientId: string;
  patientName: string;
  sessionType: 'initial' | 'followup' | 'ongoing';
  /** Firestore session id when the row comes from an interrupted/in-progress session. */
  resumeSessionId?: string;
  /** Legacy persisted field. UI render must derive status from clinicalDayRows, not from this value. */
  status?: 'pending' | 'documented' | 'done' | 'incomplete';
}

export interface TodayPatientsPanelProps {
  appointments: TodayAppointment[];
  loading: boolean;
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  /** Open modal to add patient + type to today's quick list */
  onAddToToday?: () => void;
  /** Start session for a quick-list row (navigate or open Ongoing intake) */
  onStartFromToday?: (
    patientId: string,
    sessionType: 'initial' | 'followup' | 'ongoing',
    resumeSessionId?: string,
  ) => void;
  /** Remove item from today's quick list (index to remove) */
  onRemoveFromToday?: (index: number) => void;
  /** Mark item as pending again (recycle) after it was documented */
  onMarkPendingAgain?: (index: number) => void;
  /** Clear entire list to start fresh */
  onClearList?: () => void;
  /** Dismiss an incomplete (red) session so it no longer appears in the list (marks session as cancelled). */
  onDismissIncomplete?: (patientId: string, sessionType: 'initial' | 'followup' | 'ongoing') => void;
  /** Selected date for the list (for planning ahead) */
  selectedDate?: Date;
  /** Callback when user changes the date */
  onDateChange?: (date: Date) => void;
  /** Today's quick list (patient + type per row) */
  todayQuickList?: TodayQuickItem[];
  /** Single-source clinical rows derived for the selected date */
  clinicalDayRows?: ClinicalDayRow[];
  /** Open the existing clinical artifact for a derived row */
  onOpenClinicalRow?: (row: ClinicalDayRow) => void;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(d: Date): boolean {
  const today = new Date();
  return formatDateKey(d) === formatDateKey(today);
}

/** True if date is before today (past calendar day) */
function isPastDate(d: Date): boolean {
  return formatDateKey(d) < formatDateKey(new Date());
}

function formatDateLabel(
  d: Date,
  t: (key: string, opts?: { count?: number }) => string
): string {
  const today = new Date();
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('shell.todayPatients.today');
  if (diffDays === 1) return t('shell.todayPatients.tomorrow');
  if (diffDays === -1) return t('shell.todayPatients.yesterday');
  if (diffDays >= 2 && diffDays <= 7) return t('shell.todayPatients.inDays', { count: diffDays });
  if (diffDays <= -2 && diffDays >= -7) return t('shell.todayPatients.daysAgo', { count: -diffDays });
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function getStatusBadgeClass(status: PatientWorkflowStatus): string {
  switch (status) {
    case PatientWorkflowStatus.SCHEDULED:
      return 'border-slate-200 bg-slate-100 text-slate-700';
    case PatientWorkflowStatus.IN_PROGRESS:
      return 'border-blue-200 bg-blue-100 text-blue-700';
    case PatientWorkflowStatus.DOCUMENTED_DRAFT:
      return 'border-purple-200 bg-purple-100 text-purple-700';
    case PatientWorkflowStatus.DOCUMENTED_FINAL:
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    case PatientWorkflowStatus.ABANDONED:
      return 'border-orange-200 bg-orange-100 text-orange-700';
    case PatientWorkflowStatus.CANCELLED:
      return 'border-red-200 bg-red-100 text-red-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

function getStatusLabel(status: PatientWorkflowStatus): string {
  switch (status) {
    case PatientWorkflowStatus.SCHEDULED:
      return 'Pending';
    case PatientWorkflowStatus.IN_PROGRESS:
      return 'In progress';
    case PatientWorkflowStatus.DOCUMENTED_DRAFT:
      return 'Draft';
    case PatientWorkflowStatus.DOCUMENTED_FINAL:
      return 'Completed';
    case PatientWorkflowStatus.ABANDONED:
      return 'Incomplete';
    case PatientWorkflowStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

function getPrimaryActionLabel(status: PatientWorkflowStatus): 'Iniciar' | 'Continuar' | 'Revisar' | 'Abrir SOAP' | 'Reanudar' | null {
  switch (status) {
    case PatientWorkflowStatus.SCHEDULED:
      return 'Iniciar';
    case PatientWorkflowStatus.IN_PROGRESS:
      return 'Continuar';
    case PatientWorkflowStatus.DOCUMENTED_DRAFT:
      return 'Revisar';
    case PatientWorkflowStatus.DOCUMENTED_FINAL:
      return 'Abrir SOAP';
    case PatientWorkflowStatus.ABANDONED:
      return 'Reanudar';
    case PatientWorkflowStatus.CANCELLED:
      return null;
    default:
      return null;
  }
}

function findDuplicates(ids: string[]): string[] {
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const id of ids) {
    const hasSeenId = seenIds.has(id);
    if (hasSeenId) {
      duplicateIds.add(id);
    }

    seenIds.add(id);
  }

  return Array.from(duplicateIds);
}

export const TodayPatientsPanel: React.FC<TodayPatientsPanelProps> = ({
  appointments,
  loading,
  selectedPatient,
  onSelectPatient,
  onAddToToday,
  onStartFromToday,
  onRemoveFromToday,
  onMarkPendingAgain,
  onClearList,
  onDismissIncomplete,
  selectedDate,
  onDateChange,
  todayQuickList = [],
  clinicalDayRows = [],
  onOpenClinicalRow,
}) => {
  const { t } = useTranslation();
  const { patients: allPatients } = usePatientsList();
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const [dismissIncompleteItem, setDismissIncompleteItem] = useState<TodayQuickItem | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(
    appointments.length > 0 || clinicalDayRows.length > 0
  );

  React.useEffect(() => {
    setIsListExpanded(appointments.length > 0 || clinicalDayRows.length > 0);
  }, [appointments.length, clinicalDayRows.length]);

  const hasQuickItems = clinicalDayRows.length > 0;
  const hasAppointments = appointments.length > 0;

  const displayDate = selectedDate || new Date();
  const quickItemIndexByPatientId = new Map<string, number>();
  const quickItemByPatientId = new Map<string, TodayQuickItem>();

  for (const [index, item] of todayQuickList.entries()) {
    if (!quickItemIndexByPatientId.has(item.patientId)) {
      quickItemIndexByPatientId.set(item.patientId, index);
    }

    if (!quickItemByPatientId.has(item.patientId)) {
      quickItemByPatientId.set(item.patientId, item);
    }
  }

  const actionRows = clinicalDayRows.filter((row) => {
    const isActionRow = row.status !== PatientWorkflowStatus.DOCUMENTED_FINAL;
    return isActionRow;
  });
  const completedRows = clinicalDayRows.filter((row) => {
    const isCompletedRow = row.status === PatientWorkflowStatus.DOCUMENTED_FINAL;
    return isCompletedRow;
  });
  const totalRows = clinicalDayRows.length;
  const renderedPatients = [...actionRows, ...completedRows];
  const renderedPatientIds = renderedPatients.map((row) => {
    const patientId = row.patientId;
    return patientId;
  });
  const duplicateRenderedPatients = findDuplicates(renderedPatientIds);
  const hasDuplicateRenderedPatients = duplicateRenderedPatients.length > 0;

  if (hasDuplicateRenderedPatients) {
    console.error('DUPLICATE PATIENT RENDER', duplicateRenderedPatients);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
            {isToday(displayDate) ? t('shell.todayPatients.title') : `${formatDateLabel(displayDate, t)}${t('shell.todayPatients.scheduleSuffix')}`}
          </h2>
          <p className="text-base text-gray-600 font-apple font-light">
            {hasQuickItems
              ? t('shell.todayPatients.scheduledCount', { count: totalRows })
              : hasAppointments && isToday(displayDate)
                ? t('shell.todayPatients.appointmentsToday', { count: appointments.length })
                : isToday(displayDate)
                  ? t('shell.todayPatients.noScheduledToday')
                  : t('shell.todayPatients.noScheduledDay')}
          </p>
        </div>
        {onDateChange && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={formatDateKey(displayDate)}
              onChange={(e) => {
                const [y, m, d] = (e.target.value || '').split('-').map(Number);
                if (y && m && d) onDateChange(new Date(y, m - 1, d));
              }}
              className="text-sm font-apple border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Clinical render list derived from status machine; quick-list persistence is backing data only. */}
      {hasQuickItems && (
        <div className="mt-4 space-y-2">
          {onClearList && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={onClearList}
                className="text-sm text-gray-500 hover:text-red-600 font-apple flex items-center gap-1.5"
                title={t('shell.todayPatients.clearListTitle')}
              >
                <Trash2 className="w-4 h-4" />
                {t('shell.todayPatients.clearList')}
              </button>
            </div>
          )}
          {actionRows.length > 0 ? (
            <div className="space-y-2">
              {actionRows.map((row) => {
                const quickItem = quickItemByPatientId.get(row.patientId);
                const quickItemIndex = quickItemIndexByPatientId.get(row.patientId);
                const primaryActionLabel = getPrimaryActionLabel(row.status);
                const sessionType = row.sessionType ?? quickItem?.sessionType ?? 'followup';
                const isOverdue =
                  row.status === PatientWorkflowStatus.SCHEDULED &&
                  isPastDate(displayDate);
                const badgeClass = getStatusBadgeClass(row.status);
                const itemStyles = isOverdue
                  ? 'border-red-200 bg-red-50/60 hover:bg-red-50/80'
                  : 'border-slate-200 bg-white hover:bg-slate-50';
                const hasDismissAction = row.status === PatientWorkflowStatus.ABANDONED && onDismissIncomplete && quickItem;
                const hasInvalidAction =
                  (primaryActionLabel === 'Iniciar' && row.status !== PatientWorkflowStatus.SCHEDULED) ||
                  (primaryActionLabel === 'Continuar' && row.status !== PatientWorkflowStatus.IN_PROGRESS) ||
                  (primaryActionLabel === 'Revisar' && row.status !== PatientWorkflowStatus.DOCUMENTED_DRAFT) ||
                  (primaryActionLabel === 'Abrir SOAP' && row.status !== PatientWorkflowStatus.DOCUMENTED_FINAL) ||
                  (primaryActionLabel === 'Reanudar' && row.status !== PatientWorkflowStatus.ABANDONED);

                if (hasInvalidAction) {
                  console.error('INVALID ACTION FOR STATE', {
                    patientId: row.patientId,
                    status: row.status,
                    action: primaryActionLabel,
                  });
                }

                return (
                  <div
                    key={`${row.patientId}-${row.status}-${sessionType}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${itemStyles}`}
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium font-apple text-sm text-slate-900">
                          {row.patientName}
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                          {getStatusLabel(row.status)}
                        </span>
                      </div>
                      <div className="text-xs font-apple font-light mt-0.5 flex items-center gap-1.5 text-slate-500">
                        {sessionType === 'initial' && <UserPlus className="w-3.5 h-3.5" />}
                        {sessionType === 'followup' && <RefreshCw className="w-3.5 h-3.5" />}
                        {sessionType === 'ongoing' && <FileText className="w-3.5 h-3.5" />}
                        {t(`shell.sessionType.${sessionType}`)}
                        {isOverdue ? <span className="font-medium text-red-700">— {t('shell.todayPatients.overdue')}</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {primaryActionLabel === 'Iniciar' || primaryActionLabel === 'Continuar' || primaryActionLabel === 'Reanudar' ? (
                        <button
                          type="button"
                          onClick={() => onStartFromToday?.(row.patientId, sessionType, row.resumeSessionId)}
                          className="p-2 rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-apple text-xs font-medium transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-4 h-4" /> {primaryActionLabel}
                        </button>
                      ) : null}
                      {primaryActionLabel === 'Revisar' || primaryActionLabel === 'Abrir SOAP' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenClinicalRow) {
                              onOpenClinicalRow(row);
                            }
                          }}
                          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-apple text-xs font-medium transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-4 h-4" /> {primaryActionLabel}
                        </button>
                      ) : null}
                      {hasDismissAction ? (
                        <button
                          type="button"
                          onClick={() => setDismissIncompleteItem(quickItem)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label={t('shell.todayPatients.dismissIncompleteAria')}
                          title={t('shell.todayPatients.dismissIncompleteTooltip')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                      {quickItemIndex != null && onRemoveFromToday ? (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveIndex(quickItemIndex)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label={t('shell.todayPatients.removeFromList')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {completedRows.length > 0 ? (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 font-apple">
                Completed
              </div>
              {completedRows.map((row) => {
                const quickItemIndex = quickItemIndexByPatientId.get(row.patientId);
                const sessionType = row.sessionType ?? quickItemByPatientId.get(row.patientId)?.sessionType ?? 'followup';
                const primaryActionLabel = getPrimaryActionLabel(row.status);
                const hasInvalidAction = primaryActionLabel !== 'Abrir SOAP';

                if (hasInvalidAction) {
                  console.error('INVALID ACTION FOR STATE', {
                    patientId: row.patientId,
                    status: row.status,
                    action: primaryActionLabel,
                  });
                }

                return (
                  <div
                    key={`${row.patientId}-${row.status}-${sessionType}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/80 transition-all"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium font-apple text-sm text-emerald-900">
                          {row.patientName}
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(row.status)}`}>
                          {getStatusLabel(row.status)}
                        </span>
                      </div>
                      <div className="text-xs font-apple font-light mt-0.5 flex items-center gap-1.5 text-emerald-700">
                        {sessionType === 'initial' && <UserPlus className="w-3.5 h-3.5" />}
                        {sessionType === 'followup' && <RefreshCw className="w-3.5 h-3.5" />}
                        {sessionType === 'ongoing' && <FileText className="w-3.5 h-3.5" />}
                        {t(`shell.sessionType.${sessionType}`)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenClinicalRow) {
                            onOpenClinicalRow(row);
                          }
                        }}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-apple text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-4 h-4" /> Abrir SOAP
                      </button>
                      {onMarkPendingAgain && quickItemIndex != null ? (
                        <button type="button" onClick={() => onMarkPendingAgain(quickItemIndex)} className="p-2 rounded-lg border border-primary-blue/40 bg-primary-blue/5 text-primary-blue hover:bg-primary-blue/10 transition-colors" title={t('shell.todayPatients.markPendingAgain')} aria-label={t('shell.todayPatients.markPendingAgain')}>
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : null}
                      {quickItemIndex != null && onRemoveFromToday ? (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveIndex(quickItemIndex)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label={t('shell.todayPatients.removeFromList')}
                          title={t('shell.todayPatients.removeFromListTitle')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {/* Add to list — build schedule for selected date. "Start session now" lives in Work with Patients. */}
      {onAddToToday && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onAddToToday}
            className="w-full py-3 px-4 rounded-xl border-2 border-primary-blue/40 bg-primary-blue/5 hover:bg-primary-blue/10 text-primary-blue font-medium text-sm font-apple transition-all flex items-center justify-center gap-2 hover:bg-primary-blue/15"
          >
            <UserPlus className="w-4 h-4" />
            {isToday(displayDate) ? t('shell.todayPatients.addToToday') : t('shell.todayPatients.addToThisDay')}
          </button>
          {!hasQuickItems && appointments.length === 0 && !loading && (
            <p className="text-xs text-gray-500 font-apple font-light mt-2 text-center">
              {t('shell.todayPatients.addPatientsHint')}
            </p>
          )}
        </div>
      )}

      {/* Confirm dismiss incomplete session */}
      {dismissIncompleteItem && onDismissIncomplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-apple mb-2">{t('shell.todayPatients.dismissIncompleteTitle')}</h3>
            <p className="text-sm text-gray-600 font-apple mb-4">
              {t('shell.todayPatients.dismissIncompleteMessage', { name: dismissIncompleteItem.patientName })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDismissIncompleteItem(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-apple text-sm"
              >
                {t('shell.todayPatients.cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDismissIncomplete(dismissIncompleteItem.patientId, dismissIncompleteItem.sessionType);
                  setDismissIncompleteItem(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-apple text-sm"
              >
                {t('shell.todayPatients.dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemoveIndex !== null && todayQuickList[confirmRemoveIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-apple mb-2">{t('shell.todayPatients.confirmRemoveTitle')}</h3>
            <p className="text-sm text-gray-600 font-apple mb-4">
              {t('shell.todayPatients.confirmRemoveMessage', { name: todayQuickList[confirmRemoveIndex].patientName })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemoveIndex(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-apple text-sm"
              >
                {t('shell.todayPatients.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveFromToday?.(confirmRemoveIndex);
                  setConfirmRemoveIndex(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-apple text-sm"
              >
                {t('shell.todayPatients.remove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend appointments list (only when viewing today) */}
      {hasAppointments && isToday(displayDate) && isListExpanded && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {appointments.map((apt) => {
            const patient = allPatients.find(p => p.id === apt.patientId);
            if (!patient) return null;
            return (
              <button
                key={apt.id}
                onClick={() => {
                  const fullPatient: Patient = {
                    id: patient.id,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    fullName: patient.fullName,
                    email: patient.email || '',
                    phone: patient.phone || '',
                  } as Patient;
                  onSelectPatient(fullPatient);
                }}
                className={`w-full p-3 rounded-lg border transition-all duration-200 text-left hover:shadow-sm ${selectedPatient?.id === apt.patientId
                  ? 'border-primary-blue bg-primary-blue/5'
                  : 'border-gray-200 bg-white hover:border-primary-blue/30 hover:bg-primary-blue/5'
                  }`}
              >
                <div className="font-medium text-gray-900 font-apple text-sm">{apt.patientName}</div>
                <div className="text-xs text-gray-600 font-apple font-light mt-0.5">
                  {apt.time} • {apt.sessionType || 'Session'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
