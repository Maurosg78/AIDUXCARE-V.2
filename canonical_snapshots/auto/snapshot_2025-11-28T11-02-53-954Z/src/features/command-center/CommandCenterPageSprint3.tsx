/**
 * Command Center Page - Sprint 3 Unified
 * 
 * Unifica Command Centre en una sola página con flujo claro:
 * Login → Command Centre → Pacientes del día → Elegir paciente → Elegir acción → Flujo clínico
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import tokenTrackingService, { type TokenUsage } from '../../services/tokenTrackingService';
import { SessionTypeService, type SessionType } from '../../services/sessionTypeService';
import { useAppointmentSchedule, type Appointment } from './hooks/useAppointmentSchedule';
import { usePendingNotesCount } from './hooks/usePendingNotesCount';
import { usePatientsList } from './hooks/usePatientsList';
import { Patient } from '@/services/patientService';
import PatientService from '@/services/patientService';

// Components
import { CommandCenterHeader } from './components/CommandCenterHeader';
import { TodayPatientsPanel, type TodayAppointment } from './components/TodayPatientsPanel';
import { WorkWithPatientsPanel } from './components/WorkWithPatientsPanel';
import { WorkQueuePanel, type WorkQueueSummary } from './components/WorkQueuePanel';
import { PatientSelectorModal } from './components/PatientSelectorModal';
import { CreatePatientModal } from './components/CreatePatientModal';
import { DocumentsFormsModal } from './components/DocumentsFormsModal';
import { FloatingAssistant } from '../../components/FloatingAssistant';

import logger from '@/shared/utils/logger';

export const CommandCenterPageSprint3: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  // State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [showDocumentsForms, setShowDocumentsForms] = useState(false);
  const [isNewlyCreatedPatient, setIsNewlyCreatedPatient] = useState(false);

  // Token usage
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [tokenUsageLoading, setTokenUsageLoading] = useState(true);

  // Hooks
  const { appointments, loading: appointmentsLoading, getAppointments } = useAppointmentSchedule();
  const pendingNotes = usePendingNotesCount();
  const { patients, refresh: refreshPatients } = usePatientsList();

  // Load token usage
  useEffect(() => {
    if (!user?.uid) return;

    const loadTokenUsage = async () => {
      try {
        setTokenUsageLoading(true);
        const usage = await tokenTrackingService.getCurrentTokenUsage(user.uid);
        setTokenUsage(usage);
      } catch (error) {
        logger.error('Error loading token usage:', error);
        // Set default/empty token usage on error
        setTokenUsage({
          baseTokensRemaining: 0,
          purchasedTokensBalance: 0,
          totalAvailable: 0,
          monthlyUsage: 0,
          projectedMonthlyUsage: 0,
          billingCycle: new Date().toISOString().slice(0, 7),
          billingCycleStart: new Date(),
          billingCycleEnd: new Date()
        });
      } finally {
        setTokenUsageLoading(false);
      }
    };

    loadTokenUsage();
  }, [user?.uid]);

  // Load today's appointments
  useEffect(() => {
    if (user?.uid) {
      getAppointments(new Date());
    }
  }, [user?.uid, getAppointments]);

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

  // Work queue summary
  const workQueue: WorkQueueSummary = {
    pendingNotes: pendingNotes.data || 0,
    missingConsents: 0, // TODO: Implement consent checking
    draftDocuments: 0, // TODO: Implement draft documents
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
    if ((window as any).__patientSelectorResolve) {
      (window as any).__patientSelectorResolve(patient);
      delete (window as any).__patientSelectorResolve;
    }
  };

  const handlePatientSelectorClose = () => {
    setShowPatientSelector(false);
    if ((window as any).__patientSelectorResolve) {
      (window as any).__patientSelectorResolve(null);
      delete (window as any).__patientSelectorResolve;
    }
  };

  // Handle start session
  const handleStartSession = async (sessionType: SessionType) => {
    await withPatientRequired(async (patient) => {
      const tokenBudget = SessionTypeService.getTokenBudget(sessionType);
      
      // Navigate to workflow with patient and session type
      navigate(`/workflow?type=${sessionType}&patientId=${patient.id}&tokenBudget=${tokenBudget}`);
    });
  };

  // Handle certificates
  const handleCertificates = async () => {
    await withPatientRequired(async (patient) => {
      // Navigate to certificates workflow
      navigate(`/workflow/certificates?patientId=${patient.id}`);
    });
  };

  // Handle view history
  const handleViewHistory = async () => {
    await withPatientRequired(async (patient) => {
      navigate(`/patients/${patient.id}/history`);
    });
  };

  // Handle view documents - Open Documents & Forms modal
  const handleViewDocuments = async () => {
    await withPatientRequired(async (patient) => {
      setShowDocumentsForms(true);
    });
  };

  // Handle view analytics
  const handleViewAnalytics = async () => {
    await withPatientRequired(async (patient) => {
      // TODO: Navigate to analytics page
      logger.info('Analytics not yet implemented');
    });
  };

  // Handle create patient success
  const handleCreatePatientSuccess = async (patientId: string) => {
    try {
      // Refresh patients list to update count
      await refreshPatients();
      
      // Fetch the created patient
      const newPatient = await PatientService.getPatientById(patientId);
      
      if (newPatient) {
        setSelectedPatient(newPatient);
        setIsNewlyCreatedPatient(true); // Mark as newly created
        setShowCreatePatient(false);
        
        // Scroll to Work with Patients panel after a short delay
        setTimeout(() => {
          const workWithPatientsPanel = document.getElementById('work-with-patients');
          if (workWithPatientsPanel) {
            workWithPatientsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
        
        // Reset the flag after 5 seconds (enough time for user to see the highlight)
        setTimeout(() => {
          setIsNewlyCreatedPatient(false);
        }, 5000);
      }
    } catch (error) {
      logger.error('Error fetching created patient:', error);
      // Still close modal and refresh list even if fetch fails
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
          {/* Block 1: Today's Patients */}
          <TodayPatientsPanel
            appointments={todayAppointments}
            loading={appointmentsLoading}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
          />

          {/* Block 2: Work with Patients */}
          <WorkWithPatientsPanel
            selectedPatient={selectedPatient}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              setIsNewlyCreatedPatient(false); // Reset flag when manually selecting
            }}
            onStartSession={handleStartSession}
            onViewCertificates={handleCertificates}
            onViewHistory={handleViewHistory}
            onViewDocuments={handleViewDocuments}
            onViewAnalytics={handleViewAnalytics}
            onOpenPatientSelector={openPatientSelector}
            onCreatePatient={() => setShowCreatePatient(true)}
            isNewlyCreated={isNewlyCreatedPatient}
          />

          {/* Block 3: Work Queue */}
          <WorkQueuePanel
            workQueue={workQueue}
            loading={pendingNotes.loading}
          />
        </div>
      </main>

      {/* Modals */}
      <PatientSelectorModal
        isOpen={showPatientSelector}
        onClose={handlePatientSelectorClose}
        onSelect={handlePatientSelect}
        onCreateNew={() => {
          setShowPatientSelector(false);
          setShowCreatePatient(true);
        }}
      />

      {showCreatePatient && (
        <CreatePatientModal
          isOpen={showCreatePatient}
          onClose={() => setShowCreatePatient(false)}
          onSuccess={handleCreatePatientSuccess}
        />
      )}

      {showDocumentsForms && selectedPatient && (
        <DocumentsFormsModal
          isOpen={showDocumentsForms}
          onClose={() => setShowDocumentsForms(false)}
          patient={selectedPatient}
        />
      )}

      {/* Floating Assistant */}
      <FloatingAssistant />
    </div>
  );
};

