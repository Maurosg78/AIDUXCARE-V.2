/**
 * Protected Route Component
 * 
 * Route guard for authenticated routes with session persistence
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loadSessionState, getCurrentSessionId } from '../../utils/sessionPersistence';
import type { SessionState } from '../../types/sessionState';
import type { NavigationContext } from '../../types/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSession?: boolean;
  requirePatient?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSession = false,
  requirePatient = false,
  redirectTo = '/command-center',
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (requireSession) {
        const sessionId = getCurrentSessionId();
        if (sessionId) {
          const state = await loadSessionState(sessionId);
          setSessionState(state);
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, [requireSession, location.pathname]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check session requirement
  if (requireSession && !sessionState) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check patient requirement
  if (requirePatient && (!sessionState || !sessionState.patientId)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

