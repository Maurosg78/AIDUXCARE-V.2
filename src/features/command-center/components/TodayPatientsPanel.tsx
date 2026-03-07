/**
 * Today's Patients Panel
 *
 * Quick schedule: add patient + session type to today's list; when it's time, press Start on that row.
 * Optional: "Start in-clinic session now" for immediate start without adding to list.
 */

import React, { useState, useEffect } from 'react';
import { Patient } from '@/services/patientService';
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
  /** pending = can press Start; done = session completed, Start disabled, recycle to set pending again */
  status?: 'pending' | 'done' | 'incomplete';
}

export interface TodayPatientsPanelProps {
  appointments: TodayAppointment[];
  loading: boolean;
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  /** Open modal to add patient + type to today's quick list */
  onAddToToday?: () => void;
  /** Start session for a quick-list row (navigate or open Ongoing intake) */
  onStartFromToday?: (patientId: string, sessionType: 'initial' | 'followup' | 'ongoing') => void;
  /** Remove item from today's quick list (index to remove) */
  onRemoveFromToday?: (index: number) => void;
  /** Mark item as pending again (recycle) after it was done */
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
}

const SESSION_TYPE_LABELS: Record<'initial' | 'followup' | 'ongoing', string> = {
  initial: 'Initial Assessment',
  followup: 'Follow-up',
  ongoing: 'Ongoing (first time)',
};

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

function formatDateLabel(d: Date): string {
  const today = new Date();
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= -2 && diffDays >= -7) return `${-diffDays} days ago`;
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
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
}) => {
  const { patients: allPatients } = usePatientsList();
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const [dismissIncompleteItem, setDismissIncompleteItem] = useState<TodayQuickItem | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(
    appointments.length > 0 || todayQuickList.length > 0
  );

  React.useEffect(() => {
    setIsListExpanded(appointments.length > 0 || todayQuickList.length > 0);
  }, [appointments.length, todayQuickList.length]);

  const hasQuickItems = todayQuickList.length > 0;
  const hasAppointments = appointments.length > 0;

  const displayDate = selectedDate || new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
            {isToday(displayDate) ? "Today's Patients" : `${formatDateLabel(displayDate)}'s schedule`}
          </h2>
          <p className="text-base text-gray-600 font-apple font-light">
            {hasQuickItems
              ? `${todayQuickList.length} scheduled — press Start when it's time`
              : hasAppointments && isToday(displayDate)
                ? `${appointments.length} appointment${appointments.length > 1 ? 's' : ''} today`
                : `No scheduled patients ${isToday(displayDate) ? 'today' : 'for this day'}`}
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

      {/* Quick list: pending = Start enabled; done = Start disabled + recycle to set pending again */}
      {hasQuickItems && (
        <div className="mt-4 space-y-2">
          {onClearList && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={onClearList}
                className="text-sm text-gray-500 hover:text-red-600 font-apple flex items-center gap-1.5"
                title="Clear list to build a new schedule"
              >
                <Trash2 className="w-4 h-4" />
                Clear list
              </button>
            </div>
          )}
          {todayQuickList.map((item, index) => {
            const isDone = item.status === 'done';
            const isIncomplete = item.status === 'incomplete';
            const isOverdue = !isDone && isPastDate(displayDate); // Pasaron del día y no vistos → rojo
            const itemStyles = isDone
              ? 'border-gray-200 bg-gray-100/80'
              : isIncomplete
                ? 'border-red-400 bg-red-50 hover:bg-red-100 ring-1 ring-red-300'
              : isOverdue
                ? 'border-red-200 bg-red-50/60 hover:bg-red-50/80'
                : 'border-primary-blue/40 bg-primary-blue/5 hover:bg-primary-blue/10';
            const textStyles = isDone
              ? 'text-gray-900'
              : isIncomplete
                ? 'text-red-900 font-semibold'
              : isOverdue
                ? 'text-red-800'
                : 'text-primary-blue';
            const subTextStyles = isDone
              ? 'text-gray-600'
              : isIncomplete
                ? 'text-red-700'
              : isOverdue
                ? 'text-red-700'
                : 'text-primary-blue/80';
            return (
              <div
                key={`${item.patientId}-${item.sessionType}-${index}`}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${itemStyles}`}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className={`font-medium font-apple text-sm ${textStyles}`}>
                    {item.patientName}
                  </div>
                  <div className={`text-xs font-apple font-light mt-0.5 flex items-center gap-1.5 ${subTextStyles}`}>
                    {item.sessionType === 'initial' && <UserPlus className="w-3.5 h-3.5" />}
                    {item.sessionType === 'followup' && <RefreshCw className="w-3.5 h-3.5" />}
                    {item.sessionType === 'ongoing' && <FileText className="w-3.5 h-3.5" />}
                    {SESSION_TYPE_LABELS[item.sessionType]}
                    {isDone
                      ? <span className="text-gray-400 fomal">— done</span>
                      : isIncomplete
                        ? <span className="font-bold text-red-700">⚠ INCOMPLETE — resume required</span>
                      : isOverdue
                        ? <span className="font-medium">— overdue</span>
                        : <span className="font-medium">— pending</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDone ? (
                    <>
                      <button type="button" disabled className="p-2 rounded-lg bg-gray-200 text-gray-400 font-apple text-xs font-medium cursor-not-allowed flex items-center gap-1.5" aria-label="Session completed">
                        <Play className="w-4 h-4" /> Start
                      </button>
                      {onMarkPendingAgain && (
                        <button type="button" onClick={() => onMarkPendingAgain(index)} className="p-2 rounded-lg border border-primary-blue/40 bg-primary-blue/5 text-primary-blue hover:bg-primary-blue/10 transition-colors" title="Mark as pending again" aria-label="Mark as pending again">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {onRemoveFromToday && (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveIndex(index)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label="Remove from list"
                          title="Remove (e.g. if created in advance for future)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : isIncomplete ? (
                    <>
                      <button type="button" onClick={() => onStartFromToday?.(item.patientId, item.sessionType)} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-apple text-xs font-semibold transition-all flex items-center gap-1.5">
                        <Play className="w-4 h-4" /> Resume
                      </button>
                      {onDismissIncomplete && (
                        <button
                          type="button"
                          onClick={() => setDismissIncompleteItem(item)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label="Dismiss incomplete session"
                          title="Dismiss — remove from list (session will no longer appear as incomplete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {!onDismissIncomplete && onRemoveFromToday && (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveIndex(index)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label="Remove from list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => onStartFromToday?.(item.patientId, item.sessionType)} className="p-2 rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-apple text-xs font-medium transition-all flex items-center gap-1.5">
                        <Play className="w-4 h-4" /> Start
                      </button>
                      {onRemoveFromToday && (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveIndex(index)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          aria-label="Remove from list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
            {isToday(displayDate) ? 'Add to today' : 'Add to this day'}
          </button>
          {!hasQuickItems && appointments.length === 0 && !loading && (
            <p className="text-xs text-gray-500 font-apple font-light mt-2 text-center">
              Add patients and session type; press Start on each row when it's time. To start a session without adding to the list, use "Start in-clinic session" below.
            </p>
          )}
        </div>
      )}

      {/* Confirm dismiss incomplete session */}
      {dismissIncompleteItem && onDismissIncomplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-apple mb-2">Dismiss incomplete session?</h3>
            <p className="text-sm text-gray-600 font-apple mb-4">
              Remove {dismissIncompleteItem.patientName} from the incomplete list? You won't be able to resume this session from here.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDismissIncompleteItem(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-apple text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDismissIncomplete(dismissIncompleteItem.patientId, dismissIncompleteItem.sessionType);
                  setDismissIncompleteItem(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-apple text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemoveIndex !== null && todayQuickList[confirmRemoveIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-apple mb-2">Remove from list?</h3>
            <p className="text-sm text-gray-600 font-apple mb-4">
              Remove {todayQuickList[confirmRemoveIndex].patientName}? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemoveIndex(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-apple text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveFromToday?.(confirmRemoveIndex);
                  setConfirmRemoveIndex(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-apple text-sm"
              >
                Remove
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

