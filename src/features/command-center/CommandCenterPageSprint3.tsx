/**
 * Command Center Page - Sprint 3 Unified
 * 
 * Unifica Command Centre en una sola página con flujo claro:
 * Login → Command Centre → Pacientes del día → Elegir paciente → Elegir acción → Flujo clínico
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { SessionTypeService, type SessionType } from '../../services/sessionTypeService';
import { useAppointmentSchedule, type Appointment } from './hooks/useAppointmentSchedule';
import { useInProgressSessions, type InProgressSession } from './hooks/useInProgressSessions';
import { usePatientsList } from './hooks/usePatientsList';
import { Patient } from '../../services/patientService';
import PatientService from '../../services/patientService';
import sessionService from '../../services/sessionService';
import { appointmentService } from '../../services/appointmentService';

// Components
import { CommandCenterHeader } from './components/CommandCenterHeader';
import { TodayPatientsPanel, type ClinicalQueueGroupKey, type TodayAppointment, type TodayQuickItem } from './components/TodayPatientsPanel';
import type { StartSessionModalMode } from './components/StartSessionTwoStepModal';
import { WorkWithPatientsPanel } from './components/WorkWithPatientsPanel';
import { PatientSearchBar } from './components/PatientSearchBar';
import { PatientSelectorModal } from './components/PatientSelectorModal';
import { StartSessionTwoStepModal } from './components/StartSessionTwoStepModal';
import { CreatePatientModal } from './components/CreatePatientModal';
import { OngoingPatientIntakeModal } from './components/OngoingPatientIntakeModal';
import { FloatingAssistant } from '../../components/FloatingAssistant';
import { PatientWorkflowStatus } from '../../domain/patientStatus';

import logger from '../../shared/utils/logger';
import { LAST_STARTED_KEY } from './todayListSessionStorage';
import { getTodayList as loadTodayList, subscribeTodayList, saveTodayList } from '../../services/todayListService';
import { buildClinicalDayView, type ClinicalDayRow } from './utils/clinicalDayView';
import { patientHasClosedClinicalEvidenceForDate } from './utils/patientClosedEvidenceForDate';
import {
  collectPendingTodayItemsForMigration,
  filterOpenTodayItemsByClosedClinicalEvidence,
  mergeTodayItemsWithMigratedPendingItems,
} from './utils/migratePendingTodayItems';

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function workflowPath(
  sessionType: string,
  patientId: string,
  dateKey: string,
  sessionId?: string
): string {
  const params = new URLSearchParams({
    type: sessionType,
    patientId,
    dateKey,
  });
  if (sessionId) {
    params.set('sessionId', sessionId);
    params.set('resume', 'true');
  }
  return `/workflow?${params.toString()}`;
}

type DaySummaryTarget = ClinicalQueueGroupKey | 'seenToday';

function trackStatusTransition(
  prev: PatientWorkflowStatus | undefined,
  next: PatientWorkflowStatus
): void {
  const hasChanged = prev != null && prev !== next;
  if (!hasChanged) {
    return;
  }

  console.log('Patient workflow status transition', {
    prevStatus: prev,
    nextStatus: next,
    timestamp: new Date().toISOString(),
  });
}

function getTodayQuickItemKey(item: TodayQuickItem): string {
  return `${item.patientId}::${item.sessionType}`;
}

function getTodayQuickItemScopedKey(dateKey: string, item: TodayQuickItem): string {
  return `${dateKey}::${getTodayQuickItemKey(item)}`;
}

function getTodayQuickItemSignature(item: TodayQuickItem): string {
  return [
    getTodayQuickItemKey(item),
    item.patientName ?? '',
    item.resumeSessionId ?? '',
    item.status ?? '',
  ].join('::');
}

function areTodayQuickListsEqual(
  leftItems: TodayQuickItem[],
  rightItems: TodayQuickItem[]
): boolean {
  if (leftItems.length !== rightItems.length) return false;
  const leftSignatures = [...leftItems].map(getTodayQuickItemSignature).sort();
  const rightSignatures = [...rightItems].map(getTodayQuickItemSignature).sort();
  return leftSignatures.every((signature, index) => signature === rightSignatures[index]);
}

function mergeTodayQuickItems(
  localItems: TodayQuickItem[],
  incomingItems: TodayQuickItem[]
): TodayQuickItem[] {
  const mergedByKey = new Map<string, TodayQuickItem>();

  for (const localItem of localItems) {
    const key = getTodayQuickItemKey(localItem);
    mergedByKey.set(key, localItem);
  }

  for (const incomingItem of incomingItems) {
    const key = getTodayQuickItemKey(incomingItem);
    const localItem = mergedByKey.get(key);
    if (!localItem) {
      mergedByKey.set(key, incomingItem);
      continue;
    }

    const mergedItem = {
      ...localItem,
      // Firestore is the source of truth for status and name; local wins for transient UI fields.
      status: incomingItem.status ?? localItem.status,
      patientName: incomingItem.patientName ?? localItem.patientName,
      resumeSessionId: localItem.resumeSessionId ?? incomingItem.resumeSessionId,
    };
    mergedByKey.set(key, mergedItem);
  }

  return Array.from(mergedByKey.values());
}

function normalizeOpenResponsibilitySessionType(
  sessionType: string | undefined
): 'initial' | 'followup' | 'ongoing' {
  if (sessionType === 'initial') {
    return 'initial';
  }

  if (sessionType === 'ongoing') {
    return 'ongoing';
  }

  return 'followup';
}

function resolveOpenResponsibilityDate(
  session: InProgressSession
): Date | null {
  if (session.updatedAt) {
    const updatedAtDate = new Date(session.updatedAt);
    const updatedAtTime = updatedAtDate.getTime();
    if (Number.isFinite(updatedAtTime)) {
      return updatedAtDate;
    }
  }

  if (session.dateKey) {
    const dateKeyDate = new Date(`${session.dateKey}T12:00:00`);
    const dateKeyTime = dateKeyDate.getTime();
    if (Number.isFinite(dateKeyTime)) {
      return dateKeyDate;
    }
  }

  return null;
}

function formatOpenResponsibilityDate(
  session: InProgressSession
): string {
  const responsibilityDate = resolveOpenResponsibilityDate(session);
  if (!responsibilityDate) {
    return '';
  }

  return responsibilityDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

function getOpenResponsibilitySortTime(
  session: InProgressSession
): number {
  const responsibilityDate = resolveOpenResponsibilityDate(session);
  if (!responsibilityDate) {
    return 0;
  }

  return responsibilityDate.getTime();
}

export const CommandCenterPageSprint3: React.FC = () => {
  const { t, i18n } = useTranslation();
  const esPilot = i18n.language?.startsWith('es') ?? false;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patientSelectorRegisteredOnly, setPatientSelectorRegisteredOnly] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [showOngoingIntake, setShowOngoingIntake] = useState(false);
  const [openPatientSelectorForOngoing, setOpenPatientSelectorForOngoing] = useState(false);
  const [createPatientForOngoingFlow, setCreatePatientForOngoingFlow] = useState(false);
  const [isNewlyCreatedPatient, setIsNewlyCreatedPatient] = useState(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [startSessionModalStep, setStartSessionModalStep] = useState<1 | 2>(1);
  const [startSessionModalPatient, setStartSessionModalPatient] = useState<Patient | null>(null);
  const [createPatientFromStartSessionModal, setCreatePatientFromStartSessionModal] = useState(false);
  const [startModalPatientIsNewlyCreated, setStartModalPatientIsNewlyCreated] = useState(false);
  const [startSessionModalMode, setStartSessionModalMode] = useState<StartSessionModalMode>('start_now');
  const [dismissOpenResponsibilityItem, setDismissOpenResponsibilityItem] = useState<InProgressSession | null>(null);
  const [dismissingOpenResponsibilityId, setDismissingOpenResponsibilityId] = useState<string | null>(null);
  const [todayQuickList, setTodayQuickList] = useState<TodayQuickItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [commandCenterNow, setCommandCenterNow] = useState<Date>(() => new Date());
  const [clinicalDayRows, setClinicalDayRows] = useState<ClinicalDayRow[]>([]);
  const [, setClinicalDayLoading] = useState(false);
  const previousStatusByPatientIdRef = React.useRef(new Map<string, PatientWorkflowStatus>());
  const removedTodayQuickItemKeysRef = React.useRef(new Set<string>());
  const pendingTodayQuickItemsRef = React.useRef(new Map<string, TodayQuickItem>());
  const hasLocalTodayQuickChangesRef = React.useRef(false);
  const shouldPersistTodayQuickListRef = React.useRef(false);
  // hasLoadedRef: true once the first onSnapshot for the current dateKey has fired.
  // Prevents the save effect from writing an empty list to Firestore before the load completes.
  const hasLoadedRef = React.useRef(false);
  // currentDateKeyRef: tracks the dateKey that the loaded list belongs to.
  // Prevents the save effect from writing items from a previous date under a new dateKey.
  const currentDateKeyRef = React.useRef(toLocalDateKey(new Date()));
  const currentClinicalDayRef = React.useRef(toLocalDateKey(new Date()));
  const hasRunPendingMigrationForDateRef = React.useRef(false);
  const awaitingDocumentationRef = React.useRef<HTMLDivElement>(null);
  const inProgressRef = React.useRef<HTMLDivElement>(null);
  const toSeeRef = React.useRef<HTMLDivElement>(null);
  const seenTodayRef = React.useRef<HTMLDivElement>(null);
  const [highlightedSummaryTarget, setHighlightedSummaryTarget] = useState<DaySummaryTarget | null>(null);

  // WO-UX-01: No token display in Command Center (backend/tracking may still exist)

  // Hooks
  const { appointments, loading: appointmentsLoading, getAppointments } = useAppointmentSchedule();
  const inProgressSessions = useInProgressSessions();
  const { patients, refresh: refreshPatients } = usePatientsList();

  const markTodayQuickListForSave = useCallback(() => {
    shouldPersistTodayQuickListRef.current = true;
  }, []);

  const trackPendingTodayQuickItem = useCallback((dateKey: string, item: TodayQuickItem) => {
    if (dateKey !== currentDateKeyRef.current) return;
    hasLocalTodayQuickChangesRef.current = true;
    shouldPersistTodayQuickListRef.current = true;
    if (hasLoadedRef.current) return;
    pendingTodayQuickItemsRef.current.set(getTodayQuickItemKey(item), item);
  }, []);

  const removeTodayQuickItem = useCallback((item: TodayQuickItem) => {
    if (!user?.uid) {
      return;
    }
    const dateKey = toLocalDateKey(selectedDate);
    const scopedKey = getTodayQuickItemScopedKey(dateKey, item);
    const targetKey = getTodayQuickItemKey(item);
    removedTodayQuickItemKeysRef.current.add(scopedKey);
    markTodayQuickListForSave();
    setTodayQuickList((prev) => {
      const updatedList = prev.filter((currentItem) => {
        const currentKey = getTodayQuickItemKey(currentItem);
        return currentKey !== targetKey;
      });
      void saveTodayList(user.uid, dateKey, updatedList);
      return updatedList;
    });
  }, [markTodayQuickListForSave, selectedDate, user?.uid]);

  // WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1: when arriving from the history view with "New ongoing/assessment" → open Ongoing modal
  useEffect(() => {
    const state = location.state as { openOngoingForPatientId?: string } | null;
    const id = state?.openOngoingForPatientId;
    if (!id || !user?.uid) return;
    (async () => {
      const patient = await PatientService.getPatientById(id);
      if (patient) {
        setSelectedPatient(patient);
        setShowOngoingIntake(true);
        navigate('/command-center', { replace: true, state: {} });
      }
    })();
  }, [location.state, user?.uid, navigate]);

  // Refetch in-progress sessions when Command Center is shown so manual deletions in Firestore are reflected
  useEffect(() => {
    inProgressSessions.refetch?.();
  }, [inProgressSessions.refetch]);

  useEffect(() => {
    const revalidateCurrentClinicalDay = () => {
      const currentRealDate = new Date();
      const currentRealDateKey = toLocalDateKey(currentRealDate);
      const previousClinicalDayKey = currentClinicalDayRef.current;
      const selectedClinicalDayKey = toLocalDateKey(selectedDate);
      const hasRealClinicalDayChanged = currentRealDateKey !== previousClinicalDayKey;
      const wasViewingCurrentClinicalDay = selectedClinicalDayKey === previousClinicalDayKey;

      setCommandCenterNow(currentRealDate);

      if (!hasRealClinicalDayChanged) {
        return;
      }

      currentClinicalDayRef.current = currentRealDateKey;

      if (!wasViewingCurrentClinicalDay) {
        return;
      }

      setSelectedDate(currentRealDate);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      revalidateCurrentClinicalDay();
    };

    const clinicalDayIntervalId = window.setInterval(revalidateCurrentClinicalDay, 60000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', revalidateCurrentClinicalDay);

    return () => {
      window.clearInterval(clinicalDayIntervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', revalidateCurrentClinicalDay);
    };
  }, [selectedDate]);

  // Load today's appointments
  useEffect(() => {
    if (user?.uid) {
      getAppointments(selectedDate);
    }
  }, [user?.uid, getAppointments, selectedDate]);

  // Sync refs when selectedDate changes: reset loaded state and update current key.
  // Also resets the list to [] so items from the previous date are not carried forward.
  useEffect(() => {
    hasLoadedRef.current = false;
    currentDateKeyRef.current = toLocalDateKey(selectedDate);
    pendingTodayQuickItemsRef.current.clear();
    hasLocalTodayQuickChangesRef.current = false;
    shouldPersistTodayQuickListRef.current = false;
    hasRunPendingMigrationForDateRef.current = false;
    setTodayQuickList([]);
  }, [selectedDate]);

  // Subscribe to today's list in Firestore for the selected date (real-time, multi-device).
  useEffect(() => {
    if (!user?.uid) return;

    const dateKey = toLocalDateKey(selectedDate);

    sessionStorage.removeItem(LAST_STARTED_KEY);

    let cancelled = false;

    const unsubscribe = subscribeTodayList(user.uid, dateKey, (firestoreItems) => {
      const filteredItems = firestoreItems.filter((item) => {
        const scopedKey = getTodayQuickItemScopedKey(dateKey, item);
        return !removedTodayQuickItemKeysRef.current.has(scopedKey);
      });
      if (!hasLoadedRef.current) {
        const isSelectedDateToday = dateKey === toLocalDateKey(new Date());
        const shouldRunPendingMigrationForClinicalDay =
          isSelectedDateToday &&
          !hasRunPendingMigrationForDateRef.current;

        if (shouldRunPendingMigrationForClinicalDay) {
          hasRunPendingMigrationForDateRef.current = true;
          void (async () => {
            const pendingMigrationResult = await collectPendingTodayItemsForMigration({
              userId: user.uid,
              targetDate: selectedDate,
              loadTodayList,
              hasClosedClinicalEvidence: patientHasClosedClinicalEvidenceForDate,
            });
            const closedEvidenceFilterResult = await filterOpenTodayItemsByClosedClinicalEvidence(
              filteredItems,
              dateKey,
              patientHasClosedClinicalEvidenceForDate
            );
            if (cancelled || hasLoadedRef.current || currentDateKeyRef.current !== dateKey) {
              return;
            }
            const openFirestoreItems = closedEvidenceFilterResult.openItems;
            const pendingItems = Array.from(pendingTodayQuickItemsRef.current.values()).filter((item) => {
              const scopedKey = getTodayQuickItemScopedKey(dateKey, item);
              return !removedTodayQuickItemKeysRef.current.has(scopedKey);
            });
            const hasPendingLocalChanges = hasLocalTodayQuickChangesRef.current;
            const hasPendingTransientItems = pendingItems.length > 0;
            const hasRemovedClosedEvidence =
              closedEvidenceFilterResult.removedClosedEvidenceCount > 0;
            const hasPendingClinicalQueueChanges =
              hasPendingLocalChanges ||
              hasPendingTransientItems ||
              hasRemovedClosedEvidence;
            const existingClinicalQueueItems = hasPendingClinicalQueueChanges
              ? mergeTodayQuickItems(openFirestoreItems, pendingItems)
              : openFirestoreItems;
            const hasMigratedPendingPatients = pendingMigrationResult.migratedPendingItems.length > 0;
            const mergedClinicalQueueItems = hasMigratedPendingPatients
              ? mergeTodayItemsWithMigratedPendingItems(existingClinicalQueueItems, pendingMigrationResult.migratedPendingItems)
              : existingClinicalQueueItems;
            console.info('[COMMAND-CENTER] Migration of pending patients', {
              sourceDateKeysWithCandidates: pendingMigrationResult.sourceDateKeysWithCandidates,
              sourceDateKeysWithMigratedPatients: pendingMigrationResult.sourceDateKeysWithMigratedPatients,
              targetDateKey: dateKey,
              lookbackDays: pendingMigrationResult.lookbackDays,
              totalCandidates: pendingMigrationResult.totalCandidates,
              filteredOutWithClosedEvidence: pendingMigrationResult.filteredOutWithClosedEvidence,
              removedExistingItemsWithClosedEvidence: closedEvidenceFilterResult.removedClosedEvidenceCount,
              migratedCount: pendingMigrationResult.migratedPendingItems.length,
              orphanedPendingPatientCount: pendingMigrationResult.orphanedPendingPatientCount,
            });
            if (hasMigratedPendingPatients || hasPendingClinicalQueueChanges) {
              await saveTodayList(user.uid, dateKey, mergedClinicalQueueItems);
              if (cancelled || currentDateKeyRef.current !== dateKey) {
                return;
              }
            }
            setTodayQuickList(mergedClinicalQueueItems);
            pendingTodayQuickItemsRef.current.clear();
            hasLocalTodayQuickChangesRef.current = false;
            shouldPersistTodayQuickListRef.current = false;
            hasLoadedRef.current = true;
          })();
          return;
        }
        const pendingItems = Array.from(pendingTodayQuickItemsRef.current.values()).filter((item) => {
          const scopedKey = getTodayQuickItemScopedKey(dateKey, item);
          return !removedTodayQuickItemKeysRef.current.has(scopedKey);
        });
        const nextItems =
          hasLocalTodayQuickChangesRef.current || pendingItems.length > 0
            ? mergeTodayQuickItems(filteredItems, pendingItems)
            : filteredItems;
        if (pendingItems.length > 0) {
          shouldPersistTodayQuickListRef.current = true;
        }
        setTodayQuickList(nextItems);
        pendingTodayQuickItemsRef.current.clear();
        hasLocalTodayQuickChangesRef.current = false;
      } else {
        // Subsequent updates (remote changes) — merge to preserve transient UI state.
        setTodayQuickList((prev) => mergeTodayQuickItems(prev, filteredItems));
      }
      hasLoadedRef.current = true;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.uid, selectedDate]);

  // Merge in-progress sessions into the quick list whenever they change.
  useEffect(() => {
    if (!user?.uid) return;
    const dateKey = toLocalDateKey(selectedDate);
    const matchingSessions = inProgressSessions.data.filter(
      (session) => session.dateKey === dateKey
    );
    if (matchingSessions.length === 0) return;
    setTodayQuickList((prev) => {
      const merged = [...prev];
      let changed = false;
      for (const session of matchingSessions) {
        const sessionType =
          (session.sessionType as TodayQuickItem['sessionType']) || 'followup';
        const existingIndex = merged.findIndex(
          (i) => i.patientId === session.patientId && i.sessionType === sessionType
        );
        if (existingIndex === -1) {
          merged.unshift({
            patientId: session.patientId,
            patientName: session.patientName || 'Patient',
            sessionType,
            resumeSessionId: session.id,
          });
          changed = true;
        } else {
          const currentItem = merged[existingIndex];
          const nextItem = {
            ...currentItem,
            resumeSessionId: session.id,
          };
          if (getTodayQuickItemSignature(currentItem) !== getTodayQuickItemSignature(nextItem)) {
            changed = true;
          }
          merged[existingIndex] = nextItem;
        }
      }
      if (changed) {
        shouldPersistTodayQuickListRef.current = true;
      }
      return merged;
    });
  }, [user?.uid, selectedDate, inProgressSessions.data]);

  // Persist quick list to Firestore whenever it changes.
  // Guards: only save once the initial load has completed (hasLoadedRef) and
  // only for the dateKey that is currently loaded (currentDateKeyRef), preventing
  // stale items from a previous date being written to the new date's document.
  useEffect(() => {
    if (!user?.uid) return;
    if (!hasLoadedRef.current) return;
    if (!shouldPersistTodayQuickListRef.current) return;
    const dateKey = toLocalDateKey(selectedDate);
    if (dateKey !== currentDateKeyRef.current) return;
    shouldPersistTodayQuickListRef.current = false;
    saveTodayList(user.uid, dateKey, todayQuickList);
  }, [user?.uid, selectedDate, todayQuickList]);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    const loadClinicalDayRows = async () => {
      try {
        setClinicalDayLoading(true);
        const nextRows = await buildClinicalDayView(selectedDate, patients, {
          appointments,
          sessions: inProgressSessions.data,
          quickItems: todayQuickList,
        });
        if (!cancelled) {
          setClinicalDayRows(nextRows);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to build clinical day view', error);
          setClinicalDayRows([]);
        }
      } finally {
        if (!cancelled) {
          setClinicalDayLoading(false);
        }
      }
    };

    void loadClinicalDayRows();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, selectedDate, patients, appointments, inProgressSessions.data, todayQuickList]);

  useEffect(() => {
    if (!user?.uid) return;
    if (!hasLoadedRef.current) return;
    const dateKey = toLocalDateKey(selectedDate);
    if (dateKey !== currentDateKeyRef.current) return;
    const clinicalItems = clinicalDayRows
      .filter((row) => row.hasSession || row.hasConsultation || row.hasEncounter)
      .map((row): TodayQuickItem => ({
        patientId: row.patientId,
        patientName: row.patientName,
        sessionType: row.sessionType ?? 'followup',
        resumeSessionId: row.resumeSessionId,
      }))
      .filter((item) => {
        const scopedKey = getTodayQuickItemScopedKey(dateKey, item);
        return !removedTodayQuickItemKeysRef.current.has(scopedKey);
      });
    if (clinicalItems.length === 0) return;
    setTodayQuickList((prev) => {
      const merged = mergeTodayQuickItems(prev, clinicalItems);
      if (areTodayQuickListsEqual(prev, merged)) {
        return prev;
      }
      shouldPersistTodayQuickListRef.current = true;
      return merged;
    });
  }, [user?.uid, selectedDate, clinicalDayRows]);

  useEffect(() => {
    const nextStatusByPatientId = new Map<string, PatientWorkflowStatus>();

    for (const row of clinicalDayRows) {
      const previousStatus = previousStatusByPatientIdRef.current.get(row.patientId);
      const nextStatus = row.status;
      trackStatusTransition(previousStatus, nextStatus);
      nextStatusByPatientId.set(row.patientId, nextStatus);
    }

    previousStatusByPatientIdRef.current = nextStatusByPatientId;
  }, [clinicalDayRows]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Transform appointments to TodayAppointment format
  const todayAppointments: TodayAppointment[] = appointments.map(apt => ({
    id: apt.id,
    time: new Date(apt.dateTime).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    patientId: apt.patientId,
    patientName: apt.patientName,
    sessionType: apt.notes || undefined,
    chips: [
      // Add chips based on appointment data (simplified for now)
      // In real implementation, check for WSIB, consent status, pending notes
    ],
  }));

  const isSelectedDateToday = selectedDate.getDate() === new Date().getDate() &&
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear();

  const openClinicalResponsibilities = inProgressSessions.data
    .filter((session) => {
      const hasPatientId =
        typeof session.patientId === 'string' &&
        session.patientId.trim() !== '';
      const isOpenSession =
        session.status === 'recording_in_progress' ||
        session.status === 'interrupted';
      return hasPatientId && isOpenSession;
    })
    .sort((leftSession, rightSession) => {
      const leftTime = getOpenResponsibilitySortTime(leftSession);
      const rightTime = getOpenResponsibilitySortTime(rightSession);
      return rightTime - leftTime;
    });
  const openResponsibilityPatientIds = new Set(
    openClinicalResponsibilities.map((session) => session.patientId)
  );
  const statusesHiddenWhenOpenResponsibility = new Set<PatientWorkflowStatus>([
    PatientWorkflowStatus.SCHEDULED,
    PatientWorkflowStatus.IN_PROGRESS,
    PatientWorkflowStatus.ABANDONED,
  ]);
  const resolvedClinicalDayRows = clinicalDayRows.filter((row) => {
    if (!openResponsibilityPatientIds.has(row.patientId)) {
      return true;
    }

    return !statusesHiddenWhenOpenResponsibility.has(row.status);
  });

  // withPatientRequired implementation
  const withPatientRequired = async (
    action: (patient: Patient) => void | Promise<void>
  ): Promise<void> => {
    let patient = selectedPatient;

    if (!patient) {
      patient = await openPatientSelector();
      if (!patient) return; // User cancelled
      setSelectedPatient(patient);
    }

    if (patient) {
      await action(patient);
    }
  };

  // Open patient selector modal
  const openPatientSelector = (): Promise<Patient | null> => {
    return new Promise((resolve) => {
      setShowPatientSelector(true);
      // Store resolve function to call when patient is selected
      (window as any).__patientSelectorResolve = resolve;
    });
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    if (openPatientSelectorForOngoing) {
      setShowOngoingIntake(true);
      setOpenPatientSelectorForOngoing(false);
    }
    if ((window as any).__patientSelectorResolve) {
      (window as any).__patientSelectorResolve(patient);
      delete (window as any).__patientSelectorResolve;
    }
  };

  const handlePatientSelectorClose = () => {
    setShowPatientSelector(false);
    setOpenPatientSelectorForOngoing(false);
    if ((window as any).__patientSelectorResolve) {
      (window as any).__patientSelectorResolve(null);
      delete (window as any).__patientSelectorResolve;
    }
  };

  // Handle start session (WO-UX-01: no token display; backend may still use tokenBudget internally)
  const handleStartSession = async (sessionType: SessionType) => {
    await withPatientRequired(async (patient) => {
      navigate(workflowPath(sessionType, patient.id, toLocalDateKey(selectedDate)));
    });
  };

  // Handle view history
  const handleViewHistory = async () => {
    await withPatientRequired(async (patient) => {
      navigate(`/patients/${patient.id}/history`);
    });
  };

  // Handle view analytics
  const handleViewAnalytics = async () => {
    await withPatientRequired(async (patient) => {
      // TODO: Navigate to analytics page
      logger.info('Analytics not yet implemented');
    });
  };

  // Handle create patient success — when sessionType provided, go to workflow; or reopen 2-step modal at step 2 (CTO Propuesta A)
  const handleCreatePatientSuccess = async (patientId: string, sessionType?: 'initial' | 'followup') => {
    try {
      await refreshPatients();
      setShowCreatePatient(false);

      // CTO Propuesta A: came from "Start in-clinic session now" → reopen 2-step modal at step 2 so user chooses session type
      if (createPatientFromStartSessionModal) {
        setCreatePatientFromStartSessionModal(false);
        const newPatient = await PatientService.getPatientById(patientId);
        if (newPatient) {
          setStartSessionModalStep(2);
          setStartSessionModalPatient(newPatient);
          setShowStartSessionModal(true);
        }
        return;
      }

      const isViewingToday =
        selectedDate.getDate() === new Date().getDate() &&
        selectedDate.getMonth() === new Date().getMonth() &&
        selectedDate.getFullYear() === new Date().getFullYear();

      if (createPatientForOngoingFlow) {
        setCreatePatientForOngoingFlow(false);
        const newPatient = await PatientService.getPatientById(patientId);
        if (newPatient) {
          setSelectedPatient(newPatient);
          if (isViewingToday) {
            const dateKey = toLocalDateKey(selectedDate);
            const nextItem = {
              patientId: newPatient.id,
              patientName: newPatient.fullName || newPatient.firstName || 'Patient',
              sessionType: 'ongoing' as const,
            };
            trackPendingTodayQuickItem(dateKey, nextItem);
            setTodayQuickList((prev) =>
              addToListSafe(prev, nextItem),
            );
          }
          setShowOngoingIntake(true);
        }
        return;
      }

      if (sessionType) {
        const newPatient = await PatientService.getPatientById(patientId);
        const patientName = newPatient?.fullName || newPatient?.firstName || 'Patient';
        if (isViewingToday) {
          const dateKey = toLocalDateKey(selectedDate);
          const nextItem = {
            patientId,
            patientName,
            sessionType: sessionType === 'initial' ? 'initial' as const : 'followup' as const,
          };
          trackPendingTodayQuickItem(dateKey, nextItem);
          setTodayQuickList((prev) =>
            addToListSafe(prev, nextItem),
          );
        }
        navigate(workflowPath(sessionType, patientId, toLocalDateKey(selectedDate)));
        return;
      }

      const newPatient = await PatientService.getPatientById(patientId);
      if (newPatient) {
        setSelectedPatient(newPatient);
        setIsNewlyCreatedPatient(true);
        setTimeout(() => {
          document.getElementById('work-with-patients')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        setTimeout(() => setIsNewlyCreatedPatient(false), 5000);
      }
    } catch (error) {
      logger.error('Error fetching created patient:', error);
      await refreshPatients();
      setShowCreatePatient(false);
    }
  };

  const handleOngoingModalClose = useCallback(() => {
    setShowOngoingIntake(false);
    setSelectedPatient(null);
  }, []);

  const addToListSafe = useCallback((
    prev: TodayQuickItem[],
    newItem: TodayQuickItem
  ): TodayQuickItem[] => {
    const existingIndex = prev.findIndex(
      (i) =>
        i.patientId === newItem.patientId &&
        i.sessionType === newItem.sessionType
    );
    if (existingIndex === -1) {
      return [...prev, newItem];
    }

    const existingItem = prev[existingIndex];
    const existingStatus = existingItem.status;
    const isDocumentedStatus = existingStatus === 'documented';
    const isDoneStatus = existingStatus === 'done';
    const canRescheduleClosedItem =
      isDocumentedStatus ||
      isDoneStatus;

    if (!canRescheduleClosedItem) {
      return prev;
    }

    return prev.map((item, index) =>
      index === existingIndex
        ? {
          ...newItem,
          status: 'pending',
        }
        : item
    );
  }, []);

  /** Dismiss an incomplete (red) session so it no longer appears — marks session as cancelled in Firestore. */
  const handleDismissIncomplete = useCallback(
    async (patientId: string, sessionType: TodayQuickItem['sessionType']) => {
      const session = inProgressSessions.data.find(
        (s) => s.patientId === patientId && (s.sessionType as string) === sessionType
      );
      if (!session?.id) return;
      const sessionIdToCancel = session.id;
      const sessionToCancel = inProgressSessions.data?.find(
        (s) => s.id === sessionIdToCancel
      );
      const hasPersistedTranscript =
        Boolean(sessionToCancel?.transcript?.trim()) ||
        Boolean(sessionToCancel?.transcriptAutoSavedAt);

      if (hasPersistedTranscript) {
        const confirmed = window.confirm(
          esPilot
            ? 'Esta sesión tiene una transcripción guardada. Si la descartas, el contenido clínico se perderá. ¿Confirmar descarte?'
            : 'This session has a saved transcript. Discarding will lose the clinical content. Confirm discard?'
        );
        if (!confirmed) return;
      }
      try {
        await sessionService.updateSession(sessionIdToCancel, { status: 'discarded' });
        inProgressSessions.optimisticRemove(sessionIdToCancel);
        const matchingQuickItem = todayQuickList.find(
          (quickItem) => quickItem.patientId === patientId
        );
        if (matchingQuickItem) {
          removeTodayQuickItem(matchingQuickItem);
        }
        await inProgressSessions.refetch();
      } catch {
        logger.error('[CommandCenter] Failed to dismiss incomplete session');
      }
    },
    [inProgressSessions.data, inProgressSessions.refetch,
      inProgressSessions.optimisticRemove, todayQuickList, removeTodayQuickItem, esPilot]
  );

  const handleOpenClinicalDayRow = useCallback((row: ClinicalDayRow) => {
    if (row.consultationId) {
      navigate(`/notes/${row.consultationId}`);
      return;
    }

    navigate(`/patients/${row.patientId}/history`);
  }, [navigate]);

  const handleContinueOpenResponsibility = useCallback((session: InProgressSession) => {
    const normalizedSessionType = normalizeOpenResponsibilitySessionType(session.sessionType);
    const workflowType = normalizedSessionType === 'initial' ? 'initial' : 'followup';
    const sessionDateKey = session.dateKey ?? toLocalDateKey(new Date());
    navigate(workflowPath(workflowType, session.patientId, sessionDateKey, session.id));
  }, [navigate]);

  const handleDismissOpenResponsibility = useCallback(async () => {
    if (!dismissOpenResponsibilityItem || !user?.uid) {
      return;
    }
    const sessionId = dismissOpenResponsibilityItem.id;
    setDismissingOpenResponsibilityId(sessionId);
    try {
      await sessionService.dismissOpenResponsibility(sessionId, user.uid);
      // Optimistically remove from local state before refetch — prevents the
      // read-after-write race where getDocs() returns stale server data that
      // still includes the dismissed session before the Firestore write propagates.
      inProgressSessions.optimisticRemove(sessionId);
      const patientId = dismissOpenResponsibilityItem.patientId;
      const matchingQuickItem = todayQuickList.find((quickItem) => quickItem.patientId === patientId);
      if (matchingQuickItem) {
        removeTodayQuickItem(matchingQuickItem);
      }
      setDismissOpenResponsibilityItem(null);
      await inProgressSessions.refetch();
    } catch {
      logger.error('Failed to dismiss open responsibility');
    } finally {
      setDismissingOpenResponsibilityId(null);
    }
  }, [dismissOpenResponsibilityItem, inProgressSessions, removeTodayQuickItem, todayQuickList, user?.uid]);

  const handleOngoingModalSuccess = useCallback(
    (patientId: string, baselineSOAP?: { subjective: string; objective: string; assessment: string; plan: string }, patientName?: string) => {
      setShowOngoingIntake(false);
      setSelectedPatient(null);
      const dateKey = toLocalDateKey(selectedDate);
      const completedItem = {
        patientId,
        patientName: patientName || 'Patient',
        sessionType: 'ongoing' as const,
        status: 'documented' as const,
      };
      trackPendingTodayQuickItem(dateKey, completedItem);
      setTodayQuickList((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.patientId === patientId && item.sessionType === 'ongoing'
        );
        const updatedList =
          existingIndex >= 0
            ? prev.map((item, index) => index === existingIndex ? { ...item, ...completedItem } : item)
            : addToListSafe(prev, completedItem);
        if (user?.uid && hasLoadedRef.current && dateKey === currentDateKeyRef.current) {
          void saveTodayList(user.uid, dateKey, updatedList);
        }
        return updatedList;
      });
      navigate(`/workflow?type=followup&patientId=${patientId}`, {
        state: baselineSOAP ? { baselineFromOngoing: baselineSOAP } : undefined,
      });
    },
    [addToListSafe, navigate, selectedDate, trackPendingTodayQuickItem, user?.uid]
  );

  const summaryAwaitingDocumentationRows = resolvedClinicalDayRows.filter(
    (row) => row.status === PatientWorkflowStatus.DOCUMENTED_DRAFT
  );
  const summaryInProgressRows = resolvedClinicalDayRows.filter(
    (row) =>
      row.status === PatientWorkflowStatus.IN_PROGRESS ||
      row.status === PatientWorkflowStatus.ABANDONED
  );
  const summaryToSeeRows = resolvedClinicalDayRows.filter(
    (row) => row.status === PatientWorkflowStatus.SCHEDULED
  );
  const summarySeenTodayRows = resolvedClinicalDayRows.filter(
    (row) => row.status === PatientWorkflowStatus.DOCUMENTED_FINAL
  );
  const clinicalQueueGroupRefs = {
    awaitingDocumentation: awaitingDocumentationRef,
    inProgress: inProgressRef,
    toSee: toSeeRef,
  };
  const handleSummaryQuickLink = (target: DaySummaryTarget, count: number) => {
    if (count === 0) {
      return;
    }
    const targetRef =
      target === 'seenToday'
        ? seenTodayRef
        : clinicalQueueGroupRefs[target];

    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightedSummaryTarget(target);
    window.setTimeout(() => {
      setHighlightedSummaryTarget((current) => (current === target ? null : current));
    }, 1400);
  };
  const renderSummaryQuickCard = (
    label: string,
    count: number,
    target: DaySummaryTarget,
    className: string,
    labelClassName: string,
    valueClassName: string
  ) => {
    const isDisabled = count === 0;
    return (
      <button
        type="button"
        onClick={() => handleSummaryQuickLink(target, count)}
        disabled={isDisabled}
        className={`${className} w-full text-left transition-all ${
          isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/40'
        }`}
      >
        <div className={labelClassName}>{label}</div>
        <div className={valueClassName}>{count}</div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Global */}
      <CommandCenterHeader currentDate={commandCenterNow} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1: Patient search bar — search → select → history view */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-medium text-slate-700 mb-3 font-apple">{t('shell.commandCenter.searchPatient')}</h2>
            <PatientSearchBar />
          </div>

          {openClinicalResponsibilities.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 font-apple">
                    {t('shell.openClinicalResponsibilities.title')}
                  </h2>
                  <p className="text-sm text-gray-600 font-apple font-light">
                    {t('shell.openClinicalResponsibilities.subtitle')}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1 self-start sm:self-auto">
                  {openClinicalResponsibilities.length}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {openClinicalResponsibilities.map((session) => {
                  const normalizedSessionType = normalizeOpenResponsibilitySessionType(session.sessionType);
                  const pendingDate = formatOpenResponsibilityDate(session);
                  const hasPendingDate = pendingDate.trim() !== '';
                  const actionLabel =
                    session.status === 'interrupted'
                      ? t('shell.openClinicalResponsibilities.resume')
                      : t('shell.openClinicalResponsibilities.continue');
                  return (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium font-apple text-sm text-slate-900 truncate">
                          {session.patientName || t('shell.startSessionModal.patientFallbackName')}
                        </div>
                        <div className="text-xs font-apple font-light text-slate-600">
                          {t(`shell.sessionType.${normalizedSessionType}`)}
                          {hasPendingDate ? ` · ${t('shell.openClinicalResponsibilities.pendingSince', { date: pendingDate })}` : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setDismissOpenResponsibilityItem(session)}
                          disabled={dismissingOpenResponsibilityId === session.id}
                          className="px-2 py-1.5 rounded-lg border border-transparent hover:border-amber-200 hover:bg-white text-amber-700 font-apple text-xs font-medium transition-all disabled:opacity-60"
                        >
                          {t('shell.openClinicalResponsibilities.dismissPending')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContinueOpenResponsibility(session)}
                          className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-apple text-xs font-medium transition-all"
                        >
                          {actionLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              {/* Block 1: Today's Patients (WO-UX-01: empty state CTA scrolls to Work with patients) */}
              <TodayPatientsPanel
              appointments={todayAppointments}
              loading={appointmentsLoading}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
              todayQuickList={todayQuickList}
              clinicalDayRows={resolvedClinicalDayRows}
              clinicalQueueGroupRefs={clinicalQueueGroupRefs}
              highlightedClinicalGroup={
                highlightedSummaryTarget === 'seenToday' ? null : highlightedSummaryTarget
              }
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onClearList={() => {
                markTodayQuickListForSave();
                setTodayQuickList([]);
              }}
              onDismissIncomplete={handleDismissIncomplete}
              onOpenClinicalRow={handleOpenClinicalDayRow}
              onAddToToday={() => {
                setStartSessionModalMode('add_to_today');
                setStartSessionModalStep(1);
                setStartSessionModalPatient(null);
                setCreatePatientFromStartSessionModal(false);
                setShowStartSessionModal(true);
              }}
              onStartFromToday={async (patientId, sessionType, resumeSessionId, sourceDateKey) => {
                const selectedDateKey = toLocalDateKey(selectedDate);
                const clinicalDateKey = sourceDateKey ?? selectedDateKey;
                sessionStorage.setItem(LAST_STARTED_KEY, JSON.stringify({ patientId, sessionType, dateKey: clinicalDateKey }));
                const patient = await PatientService.getPatientById(patientId);
                if (!patient) return;
                setSelectedPatient(patient);
                if (sessionType === 'initial') {
                  if (resumeSessionId) {
                    navigate(workflowPath('initial', patientId, clinicalDateKey, resumeSessionId));
                  } else {
                    navigate(workflowPath('initial', patientId, clinicalDateKey));
                  }
                  return;
                }
                if (sessionType === 'followup') {
                  if (resumeSessionId) {
                    navigate(workflowPath('followup', patientId, clinicalDateKey, resumeSessionId));
                  } else {
                    navigate(workflowPath('followup', patientId, clinicalDateKey));
                  }
                  return;
                }
                if (sessionType === 'ongoing') {
                  setShowOngoingIntake(true);
                }
              }}
              onRemoveFromToday={removeTodayQuickItem}
              onCancelAppointmentFromToday={async (appointmentId) => {
                await appointmentService.updateAppointmentStatus(appointmentId, 'cancelled');
                await getAppointments(selectedDate);
              }}
              />

              {/* Hidden in pilot to avoid duplicate clinical queues. */}

              {/* Block 2: Work with Patients */}
              <WorkWithPatientsPanel
            selectedPatient={selectedPatient}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              setIsNewlyCreatedPatient(false); // Reset flag when manually selecting
            }}
            onStartSession={handleStartSession}
            onViewHistory={handleViewHistory}
            onViewAnalytics={handleViewAnalytics}
            onOpenPatientSelector={openPatientSelector}
            onCreatePatient={() => setShowCreatePatient(true)}
            onOngoingPatientFirstTime={() => setShowOngoingIntake(true)}
            onStartOngoingNoPatient={() => {
              setOpenPatientSelectorForOngoing(true);
              setShowPatientSelector(true);
            }}
            onCreatePatientForInitial={() => {
              setCreatePatientForOngoingFlow(false);
              setShowCreatePatient(true);
            }}
            onCreatePatientForOngoing={() => {
              setShowOngoingIntake(true);
            }}
            isNewlyCreated={isNewlyCreatedPatient}
              />
              {/* WorkQueuePanel intentionally hidden in pilot; clinical queues now live in the day summary and patient queue. */}
            </div>

            <aside className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm xl:sticky xl:top-6">
              <h2 className="text-base font-semibold text-slate-900 font-apple">
                {t('shell.daySummary.title')}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {renderSummaryQuickCard(
                  t('shell.todayPatients.groupAwaitingDocumentation'),
                  summaryAwaitingDocumentationRows.length,
                  'awaitingDocumentation',
                  'rounded-xl border border-purple-100 bg-purple-50 px-3 py-2',
                  'text-xs font-medium text-purple-700 font-apple',
                  'text-xl font-semibold text-purple-900 font-apple'
                )}
                {renderSummaryQuickCard(
                  t('shell.todayPatients.groupInProgress'),
                  summaryInProgressRows.length,
                  'inProgress',
                  'rounded-xl border border-blue-100 bg-blue-50 px-3 py-2',
                  'text-xs font-medium text-blue-700 font-apple',
                  'text-xl font-semibold text-blue-900 font-apple'
                )}
                {renderSummaryQuickCard(
                  t('shell.todayPatients.groupToSee'),
                  summaryToSeeRows.length,
                  'toSee',
                  'rounded-xl border border-slate-100 bg-slate-50 px-3 py-2',
                  'text-xs font-medium text-slate-600 font-apple',
                  'text-xl font-semibold text-slate-900 font-apple'
                )}
                {renderSummaryQuickCard(
                  t('shell.daySummary.seen'),
                  summarySeenTodayRows.length,
                  'seenToday',
                  'rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2',
                  'text-xs font-medium text-emerald-700 font-apple',
                  'text-xl font-semibold text-emerald-900 font-apple'
                )}
              </div>
              <div
                ref={seenTodayRef}
                className={`mt-4 border-t border-slate-100 pt-3 scroll-mt-24 rounded-xl transition-shadow duration-500 ${
                  highlightedSummaryTarget === 'seenToday' ? 'ring-2 ring-emerald-300 ring-offset-2' : ''
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 font-apple">
                  {t('shell.daySummary.seenToday')}
                </div>
                {summarySeenTodayRows.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {summarySeenTodayRows.map((row) => {
                      const sessionType = row.sessionType ?? 'followup';
                      return (
                        <div key={`${row.patientId}-${row.status}-${sessionType}`} className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                          <div className="font-apple text-sm font-medium text-emerald-950 truncate">
                            {row.patientName}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-apple text-emerald-700">
                              {t(`shell.sessionType.${sessionType}`)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenClinicalDayRow(row)}
                              className="text-xs font-medium text-emerald-800 hover:text-emerald-950 font-apple"
                            >
                              {t('shell.daySummary.openSoap')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 font-apple font-light">
                    {t('shell.daySummary.noSeenToday')}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* CTO Propuesta A: 2-step modal — "Start in-clinic session now" → Who is the patient? → What type of session? */}
      <StartSessionTwoStepModal
        isOpen={showStartSessionModal}
        onClose={() => {
          setShowStartSessionModal(false);
          setStartSessionModalStep(1);
          setStartSessionModalPatient(null);
          setStartModalPatientIsNewlyCreated(false);
        }}
        mode={startSessionModalMode}
        initialStep={startSessionModalStep}
        initialPatient={startSessionModalPatient}
        isNewlyCreatedPatient={startModalPatientIsNewlyCreated}
        onCreateNew={() => {
          setShowStartSessionModal(false);
          setCreatePatientFromStartSessionModal(true);
          setStartModalPatientIsNewlyCreated(true);
          setShowCreatePatient(true);
        }}
        onStartSession={(patient, type) => {
          setShowStartSessionModal(false);
          setSelectedPatient(patient);
          navigate(workflowPath(type, patient.id, toLocalDateKey(selectedDate)));
        }}
        onStartOngoing={(patient) => {
          setShowStartSessionModal(false);
          setSelectedPatient(patient);
          setShowOngoingIntake(true);
        }}
        onAddToToday={
          startSessionModalMode === 'add_to_today'
            ? (patient, type) => {
              const dateKey = toLocalDateKey(selectedDate);
              const nextItem = {
                patientId: patient.id,
                patientName: patient.fullName || patient.firstName || 'Patient',
                sessionType: type,
              };
              trackPendingTodayQuickItem(dateKey, nextItem);
              setTodayQuickList((prev) => {
                const updatedList = addToListSafe(prev, nextItem);
                if (user?.uid && hasLoadedRef.current && dateKey === currentDateKeyRef.current) {
                  void saveTodayList(user.uid, dateKey, updatedList);
                }
                return updatedList;
              });
              setShowStartSessionModal(false);
              setStartSessionModalStep(1);
              setStartSessionModalPatient(null);
            }
            : undefined
        }
      />

      <PatientSelectorModal
        isOpen={showPatientSelector}
        onClose={handlePatientSelectorClose}
        onSelect={handlePatientSelect}
        onCreateNew={() => {
          setShowPatientSelector(false);
          if (openPatientSelectorForOngoing) {
            setCreatePatientForOngoingFlow(true);
            setOpenPatientSelectorForOngoing(false);
          }
          setShowCreatePatient(true);
        }}
        allowCreateNew={!patientSelectorRegisteredOnly}
      />

      {showCreatePatient && (
        <CreatePatientModal
          isOpen={showCreatePatient}
          onClose={() => setShowCreatePatient(false)}
          onSuccess={handleCreatePatientSuccess}
          initialPatientType={createPatientForOngoingFlow ? 'existing_followup' : undefined}
        />
      )}

      {showOngoingIntake && (
        <OngoingPatientIntakeModal
          isOpen={showOngoingIntake}
          onClose={handleOngoingModalClose}
          patientId={selectedPatient?.id}
          patientName={selectedPatient?.fullName || selectedPatient?.firstName}
          onSuccess={handleOngoingModalSuccess}
        />
      )}

      {dismissOpenResponsibilityItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-apple mb-2">
              {t('shell.openClinicalResponsibilities.dismissPendingTitle')}
            </h3>
            <p className="text-sm text-gray-600 font-apple mb-4">
              {t('shell.openClinicalResponsibilities.dismissPendingMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDismissOpenResponsibilityItem(null)}
                disabled={dismissingOpenResponsibilityId === dismissOpenResponsibilityItem.id}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-apple text-sm disabled:opacity-60"
              >
                {t('shell.openClinicalResponsibilities.dismissPendingCancel')}
              </button>
              <button
                type="button"
                onClick={handleDismissOpenResponsibility}
                disabled={dismissingOpenResponsibilityId === dismissOpenResponsibilityItem.id}
                className="px-4 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800 font-apple text-sm disabled:opacity-60"
              >
                {t('shell.openClinicalResponsibilities.dismissPendingConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Assistant */}
      <FloatingAssistant />
    </div>
  );
};
