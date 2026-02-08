/**
 * Command Center Page - Sprint 3 Unified
 * 
 * Unifica Command Centre en una sola página con flujo claro:
 * Login → Command Centre → Pacientes del día → Elegir paciente → Elegir acción → Flujo clínico
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SessionTypeService, type SessionType } from '../../services/sessionTypeService';
import { useAppointmentSchedule, type Appointment } from './hooks/useAppointmentSchedule';
import { usePendingNotesCount } from './hooks/usePendingNotesCount';
import { usePatientsList } from './hooks/usePatientsList';
import { Patient } from '../../services/patientService';
import PatientService from '../../services/patientService';

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

import logger from '../../shared/utils/logger';
import {
  LAST_STARTED_KEY,
  getAndClearSessionCompleted,
} from './todayListSessionStorage';

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TODAY_LIST_STORAGE_KEY = (userId: string, date: Date) =>
  `commandCenter_todayList_${userId}_${toLocalDateKey(date)}`;

export const CommandCenterPageSprint3: React.FC = () => {
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

  // WO-UX-01: No token display in Command Center (backend/tracking may still exist)

  // Hooks
  const { appointments, loading: appointmentsLoading, getAppointments } = useAppointmentSchedule();
  const pendingNotes = usePendingNotesCount();
  const { patients, refresh: refreshPatients } = usePatientsList();

  // WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1: when arriving from Patient History with "New ongoing/assessment" → open Ongoing modal
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

  // Load today's appointments
  useEffect(() => {
    if (user?.uid) {
      getAppointments(new Date());
    }
  }, [user?.uid, getAppointments]);

  const skipNextSaveRef = React.useRef(false);

  // Load quick list from localStorage for selected date; mark as done the item we just started (from sessionStorage)
  useEffect(() => {
    if (!user?.uid) return;
    skipNextSaveRef.current = true;
    try {
      const key = TODAY_LIST_STORAGE_KEY(user.uid, selectedDate);
      const raw = localStorage.getItem(key);
      let list: TodayQuickItem[] = raw ? JSON.parse(raw) : [];
      list = list.map((item) => ({ ...item, status: item.status ?? 'pending' }));

      // Mark done when workflow explicitly completed (Initial/Ongoing/Follow-up closed)
      const completed = getAndClearSessionCompleted();
      if (completed) {
        const idx = list.findIndex(
          (i) =>
            i.patientId === completed.patientId &&
            (i.sessionType === completed.sessionType ||
              (completed.sessionType === 'followup' && i.sessionType === 'ongoing'))
        );
        if (idx !== -1) list[idx] = { ...list[idx], status: 'done' };
      }
      // Fallback: mark done when returning from Start (legacy — workflow may not set completed)
      const lastStartedRaw = sessionStorage.getItem(LAST_STARTED_KEY);
      if (lastStartedRaw && !completed) {
        const last: { patientId: string; sessionType: TodayQuickItem['sessionType'] } = JSON.parse(lastStartedRaw);
        const idx = list.findIndex((i) => i.patientId === last.patientId && i.sessionType === last.sessionType);
        if (idx !== -1) list[idx] = { ...list[idx], status: 'done' };
        sessionStorage.removeItem(LAST_STARTED_KEY);
      }
      setTodayQuickList(list);
    } catch {
      setTodayQuickList([]);
    }
  }, [user?.uid, selectedDate]);

  // Persist quick list to localStorage whenever it changes (key = selectedDate)
  useEffect(() => {
    if (!user?.uid) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    try {
      const key = TODAY_LIST_STORAGE_KEY(user.uid, selectedDate);
      localStorage.setItem(key, JSON.stringify(todayQuickList));
    } catch {
      // ignore
    }
  }, [user?.uid, selectedDate, todayQuickList]);

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

  // Work queue summary — pending patients = in today's list, not yet seen (status !== 'done')
  const pendingPatientsCount = isSelectedDateToday
    ? todayQuickList.filter((i) => i.status !== 'done').length
    : 0;

  const workQueue: WorkQueueSummary = {
    pendingNotes: pendingNotes.data || 0,
    missingConsents: 0, // TODO: Implement consent checking
    draftDocuments: 0, // TODO: Implement draft documents
    pendingPatients: pendingPatientsCount,
  };

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
            setTodayQuickList((prev) => [
              ...prev,
              {
                patientId: newPatient.id,
                patientName: newPatient.fullName || newPatient.firstName || 'Patient',
                sessionType: 'ongoing' as const,
                status: 'pending' as const,
              },
            ]);
          }
          setShowOngoingIntake(true);
        }
        return;
      }

      if (sessionType) {
        const newPatient = await PatientService.getPatientById(patientId);
        const patientName = newPatient?.fullName || newPatient?.firstName || 'Patient';
        if (isViewingToday) {
          setTodayQuickList((prev) => [
            ...prev,
            {
              patientId,
              patientName,
              sessionType: sessionType === 'initial' ? 'initial' : 'followup',
              status: 'pending' as const,
            },
          ]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Global */}
      <CommandCenterHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1: Patient search bar — search → select → Patient History */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-medium text-slate-700 mb-3 font-apple">Search patient</h2>
            <PatientSearchBar />
          </div>

          {/* Block 1: Today's Patients (WO-UX-01: empty state CTA scrolls to Work with patients) */}
          <TodayPatientsPanel
            appointments={todayAppointments}
            loading={appointmentsLoading}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            todayQuickList={todayQuickList}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onClearList={() => setTodayQuickList([])}
            onAddToToday={() => {
              setStartSessionModalMode('add_to_today');
              setStartSessionModalStep(1);
              setStartSessionModalPatient(null);
              setCreatePatientFromStartSessionModal(false);
              setShowStartSessionModal(true);
            }}
            onStartFromToday={async (patientId, sessionType) => {
              sessionStorage.setItem(LAST_STARTED_KEY, JSON.stringify({ patientId, sessionType }));
              const patient = await PatientService.getPatientById(patientId);
              if (!patient) return;
              setSelectedPatient(patient);
              if (sessionType === 'initial') {
                navigate(`/workflow?type=initial&patientId=${patientId}`);
                return;
              }
              if (sessionType === 'followup') {
                navigate(`/workflow?type=followup&patientId=${patientId}`);
                return;
              }
              if (sessionType === 'ongoing') {
                setShowOngoingIntake(true);
              }
            }}
            onRemoveFromToday={(index) => {
              setTodayQuickList((prev) => prev.filter((_, i) => i !== index));
            }}
            onMarkPendingAgain={(index) => {
              setTodayQuickList((prev) =>
                prev.map((item, i) => (i === index ? { ...item, status: 'pending' as const } : item))
              );
            }}
          />

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
            onOpenStartSessionModal={() => {
              setStartSessionModalMode('start_now');
              setStartSessionModalStep(1);
              setStartSessionModalPatient(null);
              setCreatePatientFromStartSessionModal(false);
              setShowStartSessionModal(true);
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
              setTodayQuickList((prev) => [
                ...prev,
                {
                  patientId: patient.id,
                  patientName: patient.fullName || patient.firstName || 'Patient',
                  sessionType: type,
                  status: 'pending' as const,
                },
              ]);
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
          onClose={() => {
            setShowOngoingIntake(false);
            setSelectedPatient(null);
          }}
          patientId={selectedPatient?.id}
          patientName={selectedPatient?.fullName || selectedPatient?.firstName}
          onSuccess={(patientId, baselineSOAP, patientName) => {
            setShowOngoingIntake(false);
            setSelectedPatient(null);
            const isViewingToday =
              selectedDate.getDate() === new Date().getDate() &&
              selectedDate.getMonth() === new Date().getMonth() &&
              selectedDate.getFullYear() === new Date().getFullYear();
            if (isViewingToday) {
              setTodayQuickList((prev) => [
                ...prev,
                { patientId, patientName: patientName || 'Patient', sessionType: 'ongoing' as const, status: 'pending' as const },
              ]);
            }
            navigate(`/workflow?type=followup&patientId=${patientId}`, {
              state: baselineSOAP ? { baselineFromOngoing: baselineSOAP } : undefined,
            });
          }}
        />
      )}

      {/* Floating Assistant */}
      <FloatingAssistant />
    </div>
  );
};

