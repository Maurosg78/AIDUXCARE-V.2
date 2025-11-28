/**
 * useCommandCenter Hook
 * 
 * Custom hook for Command Center state management and contextual actions
 * Sprint 2B Expanded - Day 3-4: Command Center Redesign
 * Apple-style design: clean, minimal, professional
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, AlertCircle, FileText, UserPlus, Calendar, AlertTriangle } from 'lucide-react';
import type { DashboardState, DashboardContext, AppointmentInfo, SessionInfo } from '@/types/navigation';
import { useTodayAppointmentsCount } from './useTodayAppointmentsCount';
import { usePendingNotesCount } from './usePendingNotesCount';
import { useActivePatientsCount } from './useActivePatientsCount';

export interface CommandCenterState {
  dashboardState: DashboardState;
  dashboardContext: DashboardContext;
  contextualActions: ContextualAction[];
  isLoading: boolean;
}

export interface ContextualAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  priority: number;
  category: 'primary' | 'secondary' | 'tertiary';
  visible: boolean;
}

export function useCommandCenter(): CommandCenterState {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextAppointment, setNextAppointment] = useState<AppointmentInfo | undefined>();
  const [activeSession, setActiveSession] = useState<SessionInfo | undefined>();

  const todayAppointments = useTodayAppointmentsCount();
  const pendingNotes = usePendingNotesCount();
  const activePatients = useActivePatientsCount();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Determine dashboard state based on context
  const dashboardState = useMemo<DashboardState>(() => {
    if (activeSession) {
      return 'active';
    }
    if (nextAppointment) {
      const timeUntilAppointment = nextAppointment.startTime.getTime() - currentTime.getTime();
      const minutesUntil = timeUntilAppointment / (1000 * 60);
      
      if (minutesUntil <= 0) {
        return 'current'; // Appointment is now or overdue
      }
      if (minutesUntil <= 15) {
        return 'prep'; // Appointment in 15 minutes or less
      }
    }
    if (pendingNotes.data && pendingNotes.data > 0) {
      return 'next'; // Has pending work
    }
    return 'free'; // No immediate actions needed
  }, [activeSession, nextAppointment, currentTime, pendingNotes.data]);

  // Build dashboard context
  const dashboardContext = useMemo<DashboardContext>(() => ({
    state: dashboardState,
    nextAppointment,
    activeSession,
    currentTime,
  }), [dashboardState, nextAppointment, activeSession, currentTime]);

  // Generate contextual actions based on state
  const contextualActions = useMemo<ContextualAction[]>(() => {
    const actions: ContextualAction[] = [];

    // Primary actions based on dashboard state
    switch (dashboardState) {
      case 'active':
        actions.push({
          id: 'continue-session',
          label: 'Continue Session',
          description: 'Return to active session',
          icon: <Play className="w-5 h-5" />,
          action: () => {
            if (activeSession) {
              navigate(`/workflow/${activeSession.id}`);
            }
          },
          priority: 1,
          category: 'primary',
          visible: !!activeSession,
        });
        break;

      case 'current':
        actions.push({
          id: 'start-appointment',
          label: 'Start Appointment',
          description: `Begin session with ${nextAppointment?.patientName || 'patient'}`,
          icon: <Clock className="w-5 h-5" />,
          action: () => {
            if (nextAppointment) {
              navigate(`/workflow?patientId=${nextAppointment.patientId}&type=initial`);
            }
          },
          priority: 1,
          category: 'primary',
          visible: !!nextAppointment,
        });
        break;

      case 'prep':
        actions.push({
          id: 'prepare-appointment',
          label: 'Prepare for Appointment',
          description: `Appointment starting soon: ${nextAppointment?.patientName || 'patient'}`,
          icon: <AlertCircle className="w-5 h-5" />,
          action: () => {
            if (nextAppointment) {
              navigate(`/patients/search?id=${nextAppointment.patientId}`);
            }
          },
          priority: 1,
          category: 'primary',
          visible: !!nextAppointment,
        });
        break;

      case 'next':
        if (pendingNotes.data && pendingNotes.data > 0) {
          actions.push({
            id: 'review-pending-notes',
            label: 'Review Pending Notes',
            description: `${pendingNotes.data} note${pendingNotes.data > 1 ? 's' : ''} awaiting review`,
            icon: <FileText className="w-5 h-5" />,
            action: () => navigate('/documents?filter=pending'),
            priority: 1,
            category: 'primary',
            visible: true,
          });
        }
        break;
    }

    // Secondary actions (always available)
    actions.push(
      {
        id: 'new-patient',
        label: 'New Patient',
        description: 'Register a new patient',
        icon: <UserPlus className="w-5 h-5" />,
        action: () => navigate('/patients/create'),
        priority: 2,
        category: 'secondary',
        visible: true,
      },
      {
        id: 'new-appointment',
        label: 'New Appointment',
        description: 'Schedule a new appointment',
        icon: <Calendar className="w-5 h-5" />,
        action: () => navigate('/scheduling/new'),
        priority: 2,
        category: 'secondary',
        visible: true,
      },
      {
        id: 'emergency-intake',
        label: 'Emergency Intake',
        description: 'Quick intake for emergency cases',
        icon: <AlertTriangle className="w-5 h-5" />,
        action: () => navigate('/emergency-intake'),
        priority: 3,
        category: 'secondary',
        visible: true,
      }
    );

    // Sort by priority
    return actions.sort((a, b) => a.priority - b.priority);
  }, [dashboardState, activeSession, nextAppointment, pendingNotes.data, navigate]);

  return {
    dashboardState,
    dashboardContext,
    contextualActions,
    isLoading: todayAppointments.loading || pendingNotes.loading || activePatients.loading,
  };
}



