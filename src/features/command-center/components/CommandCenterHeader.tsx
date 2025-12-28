/**
 * Command Center Header Component
 * 
 * Simple header matching Clinical Workflow style:
 * - AIDUXCARE (small uppercase) + 🍁
 * - Command Center — Canada
 * - Command Center button (if on workflow page) or Email verified status
 * - Token counter (optional, can be shown elsewhere)
 */

import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getAuth, signOut } from 'firebase/auth';
import type { TokenUsage } from '../../../services/tokenTrackingService';

export interface CommandCenterHeaderProps {
  tokenUsage?: TokenUsage | null;
  tokenUsageLoading?: boolean;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
  tokenUsage,
  tokenUsageLoading,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCommandCenter = location.pathname === '/command-center';

  // WO-AUTH-ONB-FLOW-FIX-04 E: Botón Logout para cortar loops rápido en QA
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: Brand + Page Title */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.02em] text-slate-400 font-apple font-light">
            AIDUXCARE <span className="ml-1">🍁</span>
          </p>
          <p className="text-[15px] font-medium text-slate-800 font-apple">
            Command Center — Canada
          </p>
        </div>

        {/* Right: Actions + Status */}
        <div className="flex items-center gap-4">
          {/* Command Center button (only show if NOT on command center page) */}
          {!isCommandCenter && (
            <Link
              to="/command-center"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors font-apple"
            >
              <Users className="w-4 h-4" />
              Command Center
            </Link>
          )}

          {/* Email verified status */}
          <div className="flex items-center gap-2 text-sm text-slate-500 font-apple">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Email verified · Access granted
          </div>

          {/* WO-AUTH-ONB-FLOW-FIX-04 E: Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors font-apple"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

