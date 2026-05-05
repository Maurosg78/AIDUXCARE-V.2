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
import { usePendingNotesCount } from './hooks/usePendingNotesCount';
import { useInProgressSessions, type InProgressSession } from './hooks/useInProgressSessions';
import { usePatientsList } from './hooks/usePatientsList';
import { Patient } from '../../services/patientService';
import PatientService from '../../services/patientService';
import sessionService from '../../services/sessionService';

// Components
import { CommandCenterHeader } from './components/CommandCenterHeader';
import { TodayPatientsPanel, type TodayAppointment, type TodayQuickItem } from './components/TodayPatientsPanel';
import type { StartSessionModalMode } from './components/StartSessionTwoStepModal';
import { WorkWithPatientsPanel } from './components/WorkWithPatientsPanel';
import { PatientSearchBar } from './components/PatientSearchBar';
import { WorkQueuePanel, type WorkQueueSummary } from './components/WorkQueuePanel';
import { PatientSelectorModal } from './components/PatientSelectorModal';
import { StartSessionTwoStepModal } from './components/StartSessionTwoStepModal';
import { CreatePatientModal } from './components/CreatePatientModal';
import { OngoingPatientIntakeModal } from './components/OngoingPatientIntakeModal';
import { FloatingAssistant } from '../../components/FloatingAssistant';
import { PatientWorkflowStatus } from '../../domain/patientStatus';

import logger from '../../shared/utils/logger';
import { LAST_STARTED_KEY } from './todayListSessionStorage';
import { getTodayList, saveTodayList } from '../../services/todayListService';
import { buildClinicalDayView, type ClinicalDayRow } from './utils/clinicalDayView';

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
      ...incomingItem,
      ...localItem,
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
  const { t } = useTranslation();
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
  const [todayQuickList, setTodayQuickList] = useState<TodayQuickItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [clinicalDayRows, setClinicalDayRows] = useState<ClinicalDayRow[]>([]);
  const [, setClinicalDayLoading] = useState(false);
  const previousStatusByPatientIdRef = React.useRef(new Map<string, PatientWorkflowStatus>());
  const todayListLoadRequestRef = React.useRef(0);

  // WO-UX-01: No token display in Command Center (backend/tracking may still exist)

  // Hooks
  const { appointments, loading: appointmentsLoading, getAppointments } = useAppointmentSchedule();
  const pendingNotes = usePendingNotesCount();
  const inProgressSessions = useInProgressSessions();
  const { patients, refresh: refreshPatients } = usePatientsList();

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

  // Load today's appointments
  useEffect(() => {
    if (user?.uid) {
      getAppointments(selectedDate);
    }
  }, [user?.uid, getAppointments, selectedDate]);

  const skipNextSaveRef = React.useRef(false);

  // Load quick list from Firestore for selected date; status is derived later from clinical truth.
  useEffect(() => {
    if (!user?.uid) return;

    const dateKey = toLocalDateKey(selectedDate);
    const requestId = todayListLoadRequestRef.current + 1;
    todayListLoadRequestRef.current = requestId;
    let cancelled = false;

    getTodayList(user.uid, dateKey).then((list) => {
      if (cancelled) {
        return;
      }
      if (requestId !== todayListLoadRequestRef.current) {
        return;
      }

      const mergedList = [...list];
      for (const session of inProgressSessions.data) {
        const sessionDateKey = session.dateKey;
        const isMatchingSelectedDate = sessionDateKey === dateKey;
        if (!isMatchingSelectedDate) {
          continue;
        }
        const sessionType =
          (session.sessionType as TodayQuickItem['sessionType']) || 'followup';
        const existingIndex = mergedList.findIndex(
          (i) => i.patientId === session.patientId && i.sessionType === sessionType
        );
        if (existingIndex === -1) {
          mergedList.unshift({
            patientId: session.patientId,
            patientName: session.patientName || 'Patient',
            sessionType,
            resumeSessionId: session.id,
          });
        } else {
          const currentItem = mergedList[existingIndex];
          const nextItem = {
            ...currentItem,
            resumeSessionId: session.id,
          };
          mergedList[existingIndex] = nextItem;
        }
      }

      const lastStartedRaw = sessionStorage.getItem(LAST_STARTED_KEY);
      if (lastStartedRaw) {
        sessionStorage.removeItem(LAST_STARTED_KEY);
      }

      setTodayQuickList((prev) => {
        const hasLocalItems = prev.length > 0;
        skipNextSaveRef.current = !hasLocalItems;
        return mergeTodayQuickItems(prev, mergedList);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, selectedDate, inProgressSessions.data]);

  // Persist quick list to Firestore whenever it changes (key = selectedDate)
  useEffect(() => {
    if (!user?.uid) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveTodayList(user.uid, toLocalDateKey(selectedDate), todayQuickList);
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

  const workQueue: WorkQueueSummary = {
    pendingNotes: pendingNotes.data || 0,
    missingConsents: 0, // TODO: Implement consent checking
    draftDocuments: 0, // TODO: Implement draft documents
  };

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
      navigate(`/workflow?type=${sessionType}&patientId=${patient.id}`);
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
            setTodayQuickList((prev) =>
              addToListSafe(prev, {
                patientId: newPatient.id,
                patientName: newPatient.fullName || newPatient.firstName || 'Patient',
                sessionType: 'ongoing' as const,
              }),
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
          setTodayQuickList((prev) =>
            addToListSafe(prev, {
              patientId,
              patientName,
              sessionType: sessionType === 'initial' ? 'initial' : 'followup',
            }),
          );
        }
        navigate(`/workflow?type=${sessionType}&patientId=${patientId}`);
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
    const alreadyExists = prev.some(
      (i) =>
        i.patientId === newItem.patientId &&
        i.sessionType === newItem.sessionType
    );
    if (alreadyExists) return prev;
    return [...prev, newItem];
  }, []);

  /** Dismiss an incomplete (red) session so it no longer appears — marks session as cancelled in Firestore. */
  const handleDismissIncomplete = useCallback(
    async (patientId: string, sessionType: TodayQuickItem['sessionType']) => {
      const session = inProgressSessions.data.find(
        (s) => s.patientId === patientId && (s.sessionType as string) === sessionType
      );
      if (!session?.id) return;
      try {
        await sessionService.updateSession(session.id, { status: 'cancelled' });
        await inProgressSessions.refetch();
      } catch {
        // ignore
      }
    },
    [inProgressSessions.data, inProgressSessions.refetch]
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
    navigate(`/workflow?type=${workflowType}&patientId=${session.patientId}&sessionId=${session.id}&resume=true`);
  }, [navigate]);

  const handleOngoingModalSuccess = useCallback(
    (patientId: string, baselineSOAP?: { subjective: string; objective: string; assessment: string; plan: string }, patientName?: string) => {
      setShowOngoingIntake(false);
      setSelectedPatient(null);
      const isViewingToday =
        selectedDate.getDate() === new Date().getDate() &&
        selectedDate.getMonth() === new Date().getMonth() &&
        selectedDate.getFullYear() === new Date().getFullYear();
      if (isViewingToday) {
        setTodayQuickList((prev) =>
          addToListSafe(prev, {
            patientId,
            patientName: patientName || 'Patient',
            sessionType: 'ongoing' as const,
          }),
        );
      }
      navigate(`/workflow?type=followup&patientId=${patientId}`, {
        state: baselineSOAP ? { baselineFromOngoing: baselineSOAP } : undefined,
      });
    },
    [selectedDate, navigate]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Global */}
      <CommandCenterHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1: Patient search bar — search → select → history view */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-medium text-slate-700 mb-3 font-apple">{t('shell.commandCenter.searchPatient')}</h2>
            <PatientSearchBar />
          </div>

          {openClinicalResponsibilities.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
                  {t('shell.openClinicalResponsibilities.title')}
                </h2>
                <p className="text-base text-gray-600 font-apple font-light">
                  {t('shell.openClinicalResponsibilities.subtitle')}
                </p>
              </div>
              <div className="mt-4 space-y-2">
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
                      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium font-apple text-sm text-slate-900">
                            {session.patientName || t('shell.startSessionModal.patientFallbackName')}
                          </div>
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                            {t('shell.openClinicalResponsibilities.badge')}
                          </span>
                        </div>
                        <div className="text-xs font-apple font-light mt-0.5 text-slate-600">
                          {t(`shell.sessionType.${normalizedSessionType}`)}
                          {hasPendingDate ? ` · ${t('shell.openClinicalResponsibilities.pendingSince', { date: pendingDate })}` : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleContinueOpenResponsibility(session)}
                        className="p-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-apple text-xs font-medium transition-all"
                      >
                        {actionLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Block 1: Today's Patients (WO-UX-01: empty state CTA scrolls to Work with patients) */}
          <TodayPatientsPanel
            appointments={todayAppointments}
            loading={appointmentsLoading}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            todayQuickList={todayQuickList}
            clinicalDayRows={clinicalDayRows}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onClearList={() => setTodayQuickList([])}
            onDismissIncomplete={handleDismissIncomplete}
            onOpenClinicalRow={handleOpenClinicalDayRow}
            onAddToToday={() => {
              setStartSessionModalMode('add_to_today');
              setStartSessionModalStep(1);
              setStartSessionModalPatient(null);
              setCreatePatientFromStartSessionModal(false);
              setShowStartSessionModal(true);
            }}
            onStartFromToday={async (patientId, sessionType, resumeSessionId) => {
              sessionStorage.setItem(LAST_STARTED_KEY, JSON.stringify({ patientId, sessionType }));
              const patient = await PatientService.getPatientById(patientId);
              if (!patient) return;
              setSelectedPatient(patient);
              if (sessionType === 'initial') {
                if (resumeSessionId) {
                  navigate(`/workflow?type=initial&patientId=${patientId}&sessionId=${resumeSessionId}&resume=true`);
                } else {
                  navigate(`/workflow?type=initial&patientId=${patientId}`);
                }
                return;
              }
              if (sessionType === 'followup') {
                if (resumeSessionId) {
                  navigate(`/workflow?type=followup&patientId=${patientId}&sessionId=${resumeSessionId}&resume=true`);
                } else {
                  navigate(`/workflow?type=followup&patientId=${patientId}`);
                }
                return;
              }
              if (sessionType === 'ongoing') {
                setShowOngoingIntake(true);
              }
            }}
            onRemoveFromToday={(index) => {
              setTodayQuickList((prev) => prev.filter((_, i) => i !== index));
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

          {/* Block 3: Work Queue */}
          <WorkQueuePanel
            workQueue={workQueue}
            loading={pendingNotes.loading}
          />
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
          navigate(`/workflow?type=${type}&patientId=${patient.id}`);
        }}
        onStartOngoing={(patient) => {
          setShowStartSessionModal(false);
          setSelectedPatient(patient);
          setShowOngoingIntake(true);
        }}
        onAddToToday={
          startSessionModalMode === 'add_to_today'
            ? (patient, type) => {
	              setTodayQuickList((prev) =>
	                addToListSafe(prev, {
	                  patientId: patient.id,
	                  patientName: patient.fullName || patient.firstName || 'Patient',
	                  sessionType: type,
	                }),
	              );
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

      {/* Floating Assistant */}
      <FloatingAssistant />
    </div>
  );
};
