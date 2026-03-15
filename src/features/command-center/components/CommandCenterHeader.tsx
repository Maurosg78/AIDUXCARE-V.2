/**
 * Command Center Header Component
 * 
 * Page-specific header (branding oficial en LayoutWrapper):
 * - Command Center — Canada
 * - Command Center button (if on workflow page) or Email verified status
 * - Token counter (optional, can be shown elsewhere)
 */

import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { isSpainPilot } from '@/core/pilotDetection';
import { useProfessionalProfile as useProfessionalProfileContext } from '../../../context/ProfessionalProfileContext';
import { deriveClinicianDisplayName } from '../../../utils/clinicProfile';
import type { TokenUsage } from '../../../services/tokenTrackingService';

export interface CommandCenterHeaderProps {
  tokenUsage?: TokenUsage | null;
  tokenUsageLoading?: boolean;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
  tokenUsage,
  tokenUsageLoading,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { profile: professionalProfile } = useProfessionalProfileContext();
  const isCommandCenter = location.pathname === '/command-center';

  // P3: Command Center greeting - usar nombre del fisio logueado
  const clinicianDisplayName = useMemo(
    () => deriveClinicianDisplayName(professionalProfile, user),
    [professionalProfile, user]
  );

  // WO-PILOT-FIX-03: Logout moved to LayoutWrapper (global nav) — no duplicate here

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: Page Title + Greeting (branding oficial en LayoutWrapper) */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-medium text-slate-800 font-apple">
              {t('shell.commandCenter.title')} — {isSpainPilot() ? 'España' : 'Canada'}
            </p>
            {clinicianDisplayName && (
              <p className="text-[13px] text-slate-600 font-apple font-light">
                · {t('shell.commandCenter.welcomeGreeting')}, {clinicianDisplayName}
              </p>
            )}
          </div>
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
              {t('shell.commandCenter.title')}
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/feedback-review"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors font-apple"
              title="Revisar feedback pendiente"
            >
              <MessageSquare className="w-4 h-4" />
              Feedback pendiente
            </Link>
          )}

          {/* Email verified status */}
          <div className="flex items-center gap-2 text-sm text-slate-500 font-apple">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {t('shell.commandCenter.emailVerifiedStatus')}
          </div>
        </div>
      </div>
    </header>
  );
};

