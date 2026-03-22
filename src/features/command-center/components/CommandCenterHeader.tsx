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
import { CalendarDays, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { isSpainPilot } from '@/core/pilotDetection';
import { useProfessionalProfile as useProfessionalProfileContext } from '../../../context/ProfessionalProfileContext';
import { deriveClinicianDisplayName, resolveSalutationPrefixForGreeting } from '../../../utils/clinicProfile';
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

  const greetingByHour = useMemo(() => {
    const hour = new Date().getHours();
    if (isSpainPilot()) {
      if (hour >= 6 && hour <= 13) return 'Buenos días';
      if (hour >= 14 && hour <= 20) return 'Buenas tardes';
      return 'Buenas noches';
    }
    if (hour >= 6 && hour <= 13) return 'Good morning';
    if (hour >= 14 && hour <= 20) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const greetingLine = useMemo(() => {
    if (!clinicianDisplayName) return '';
    const prefix = resolveSalutationPrefixForGreeting(professionalProfile);
    const titledName = prefix ? `${prefix} ${clinicianDisplayName}` : clinicianDisplayName;
    return `${greetingByHour}, ${titledName}`;
  }, [clinicianDisplayName, greetingByHour, professionalProfile]);

  const todayLongDate = useMemo(() => {
    const locale = isSpainPilot() ? 'es-ES' : 'en-CA';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

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
            {greetingLine && <p className="text-[14px] text-slate-600 font-apple font-light">· {greetingLine}</p>}
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

          {/* Current date (jurisdiction-aware long format) */}
          <div className="flex items-center gap-2 text-base text-slate-500 font-apple">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            {todayLongDate}
          </div>
        </div>
      </div>
    </header>
  );
};

