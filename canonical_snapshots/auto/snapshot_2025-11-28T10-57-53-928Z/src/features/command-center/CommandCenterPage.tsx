import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Archive, RefreshCw, Building2, Car, Scroll, Info } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { FloatingAssistant } from '../../components/FloatingAssistant';

import { logAction } from '../../analytics/events';
import NewAppointmentModal from '../appointments/NewAppointmentModal';
import PendingNotesModal from '../notes/PendingNotesModal';
import { AuditWidget } from '../../components/AuditWidget';

import { Greeting } from './components/Greeting';
import { CommandCenterHeader } from './components/CommandCenterHeader';
import { usePendingNotesCount } from './hooks/usePendingNotesCount';
import { CreatePatientModal } from './components/CreatePatientModal';
import { PatientsListDropdown } from './components/PatientsListDropdown';
import { SessionTypeSelection } from './components/SessionTypeSelection';
import { PrimaryActionCard } from './components/PrimaryActionCard';
import { FeedbackWidget } from '../../components/feedback/FeedbackWidget';
import { useCommandCenter } from './hooks/useCommandCenter';
import { DashboardStateDisplay } from './components/DashboardState';
import { ContextualActions } from './components/ContextualActions';
import { usePatientsList } from './hooks/usePatientsList';
import tokenTrackingService, { type TokenUsage } from '../../services/tokenTrackingService';

import logger from '@/shared/utils/logger';

export const CommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  // Estados para modales
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showPendingNotes, setShowPendingNotes] = useState(false);
  const [showAuditWidget, setShowAuditWidget] = useState(false);

  // Token usage
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [tokenUsageLoading, setTokenUsageLoading] = useState(true);

  // Two-step flow state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<'patient-selection' | 'session-type-selection'>('patient-selection');

  // Hooks de datos reales
  const pendingNotesCount = usePendingNotesCount();
  const { dashboardState, dashboardContext, contextualActions, isLoading } = useCommandCenter();
  const { patients } = usePatientsList();
  
  // Get selected patient data
  const selectedPatient = selectedPatientId 
    ? patients.find(p => p.id === selectedPatientId)
    : undefined;

  // Smart Context Detection - Determine primary action type based on dashboard context
  const determinePrimaryActionType = (): 'start-session' | 'select-patient' | 'next-appointment' | 'emergency' => {
    // If patient is already selected, show start session
    if (selectedPatient) {
      return 'start-session';
    }

    // If there's an active session, show continue recording
    if (dashboardContext.activeSession) {
      return 'start-session';
    }

    // If there's a next appointment within 30 minutes, show next appointment ready
    if (dashboardContext.nextAppointment && 
        (dashboardContext.state === 'next' || dashboardContext.state === 'prep' || dashboardContext.state === 'current')) {
      return 'next-appointment';
    }

    // Default: show select patient
    return 'select-patient';
  };

  // Get appointment info for PrimaryActionCard
  const nextAppointmentInfo = dashboardContext.nextAppointment ? {
    time: dashboardContext.nextAppointment.startTime.toLocaleTimeString('en-CA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    reason: dashboardContext.nextAppointment.sessionType || 'Appointment'
  } : undefined;

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Verificar si es admin (placeholder - implementar lógica real)
  const isAdmin = user?.email?.includes('admin') || user?.uid === 'admin-uid';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Global */}
      <CommandCenterHeader />

      {/* Command Center - Coherente con Design System, sin replicar login literalmente */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Dashboard State Display */}
        <div className="mb-6">
          <DashboardStateDisplay context={dashboardContext} />
        </div>

        {/* Two-Step Flow: Patient Selection → Session Type Selection */}
        {flowStep === 'patient-selection' ? (
          <>
            {/* Primary Action Card - DOMINANT (60% viewport) - Smart Context Detection */}
            <div className="mb-8 min-h-[60vh]">
              <PrimaryActionCard
                type={determinePrimaryActionType()}
                patient={selectedPatient}
                appointmentTime={nextAppointmentInfo?.time}
                appointmentReason={nextAppointmentInfo?.reason}
                onAction={() => {
                  const actionType = determinePrimaryActionType();
                  
                  if (actionType === 'start-session') {
                    if (selectedPatient) {
                      // Patient selected → go to session type selection
                      setFlowStep('session-type-selection');
                    } else if (dashboardContext.activeSession) {
                      // Active session → navigate to workflow to continue
                      navigate(`/workflow?type=${dashboardContext.activeSession.sessionType}&patientId=${dashboardContext.activeSession.patientId}`);
                    } else {
                      // No patient selected → focus dropdown
                      document.querySelector('[aria-haspopup="listbox"]')?.click();
                    }
                  } else if (actionType === 'next-appointment' && dashboardContext.nextAppointment) {
                    // Next appointment → select patient and go to session type
                    setSelectedPatientId(dashboardContext.nextAppointment.patientId);
                    setFlowStep('session-type-selection');
                  } else {
                    // Select patient → focus dropdown
                    document.querySelector('[aria-haspopup="listbox"]')?.click();
                  }
                }}
              />
            </div>

            {/* Patient Selection - Integrated into PrimaryActionCard flow */}
            <div className="mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                <h2 className="text-xl font-medium text-gray-900 mb-2 font-apple">
                  Patient List
                </h2>
                <p className="text-sm text-gray-600 mb-4 font-apple font-light">
                  Select a patient to start a session or view their information
                </p>
                <PatientsListDropdown 
                  onPatientSelect={(patientId) => {
                    setSelectedPatientId(patientId);
                    setFlowStep('session-type-selection');
                  }}
                />
              </div>
            </div>

            {/* Quick Actions - DE-PRIORIZED (only Step 1, opacity-75, max 3) */}
            {contextualActions.length > 0 && (
              <div className="mb-8 opacity-75">
                <h2 className="text-lg font-medium text-gray-700 mb-3 font-apple">
                  Quick Actions
                </h2>
                <ContextualActions actions={contextualActions} maxVisible={3} />
              </div>
            )}

            {/* Secondary Actions - DE-PRIORIZED (only Step 1, opacity-75) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 opacity-75">
          <button
            onClick={() => { 
              navigate('/appointments?scope=today');
              logAction('view_today_appointments', '/command-center');
            }}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-primary-blue/30 hover:bg-primary-blue/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-lg flex items-center justify-center group-hover:from-primary-blue/20 group-hover:to-primary-purple/20 transition-all">
              <Calendar className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 font-apple">Today's Schedule</h3>
              <p className="text-xs text-gray-600 mt-0.5 font-apple font-light">View appointments</p>
            </div>
          </button>

          <button
            onClick={() => { 
              setShowPendingNotes(true); 
              logAction('open_pending_notes', '/command-center'); 
            }}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-primary-blue/30 hover:bg-primary-blue/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-lg flex items-center justify-center group-hover:from-primary-blue/20 group-hover:to-primary-purple/20 transition-all">
              <FileText className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900 font-apple">Pending Notes</h3>
                {pendingNotesCount.data > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-gradient-to-r from-primary-blue to-primary-purple text-white text-xs flex items-center justify-center px-1.5 font-apple font-medium">
                    {pendingNotesCount.data}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5 font-apple font-light">Review drafts</p>
            </div>
          </button>

          <button
            onClick={() => { 
              navigate('/documents');
              logAction('view_clinical_vault', '/command-center');
            }}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-primary-blue/30 hover:bg-primary-blue/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-lg flex items-center justify-center group-hover:from-primary-blue/20 group-hover:to-primary-purple/20 transition-all">
              <Archive className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 font-apple">Clinical Vault</h3>
              <p className="text-xs text-gray-600 mt-0.5 font-apple font-light">SOAP notes</p>
            </div>
          </button>
        </div>
          </>
        ) : (
          /* Step 2: Session Type Selection - DOMINANT (80% viewport) */
          <div className="mb-8 min-h-[80vh]">
            <div className="bg-white border-2 border-primary-blue/20 rounded-2xl p-8 shadow-xl">
              <SessionTypeSelection
                patientId={selectedPatientId!}
                patientName={selectedPatient?.fullName || selectedPatient?.firstName}
                onBack={() => {
                  setFlowStep('patient-selection');
                  setSelectedPatientId(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Compliance Footer - Coherente con login */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-[12px] text-gray-500 font-apple font-light flex items-center justify-center gap-1">
            <span>🍁</span>
            <span>PHIPA Compliant • SSL Secured • 100% Canadian Data</span>
          </p>
        </div>
      </div>

      {/* Modales */}
      {showCreatePatient && (
        <CreatePatientModal 
          isOpen={showCreatePatient}
          onClose={() => setShowCreatePatient(false)}
        />
      )}

      <NewAppointmentModal
        open={showNewAppt}
        onClose={()=>setShowNewAppt(false)}
      />
      <PendingNotesModal open={showPendingNotes} onClose={()=>setShowPendingNotes(false)} />

      {/* Widget de Auditoría */}
      <AuditWidget 
        isVisible={showAuditWidget}
        onClose={() => setShowAuditWidget(false)}
      />

      {/* Asistente Flotante */}
      <FloatingAssistant />
    </div>
  );
};
