/**
 * Navigation Context Types
 * 
 * Defines navigation context for route returns and breadcrumbs
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

export interface NavigationContext {
  previousRoute: string;
  returnTo?: string;
  patientId?: string;
  sessionId?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  label: string;
  path: string;
  isActive?: boolean;
}

export interface RouteGuard {
  canAccess: (context: NavigationContext) => boolean;
  redirectTo?: string;
  message?: string;
}

export type DashboardState = 'next' | 'current' | 'active' | 'prep' | 'free';

export interface DashboardContext {
  state: DashboardState;
  nextAppointment?: AppointmentInfo;
  activeSession?: SessionInfo;
  currentTime: Date;
}

export interface AppointmentInfo {
  id: string;
  patientId: string;
  patientName: string;
  startTime: Date;
  endTime: Date;
  sessionType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface SessionInfo {
  id: string;
  patientId: string;
  patientName: string;
  sessionType: string;
  startTime: Date;
  isRecording: boolean;
}

