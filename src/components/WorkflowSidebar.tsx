/**
 * Workflow Sidebar Navigation
 * 
 * Apple-style sidebar navigation for Professional Workflow Page.
 * Displays session types with token budgets - clean, minimal, medical-grade UI.
 * No emojis or decorative elements.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  RefreshCw,
  Building2,
  Car,
  Scroll,
  ChevronRight,
  Info
} from 'lucide-react';
import { SessionType, SessionTypeService } from '../services/sessionTypeService';
import { useToast } from '../hooks/useToast';

export interface WorkflowSidebarProps {
  activeSessionType: SessionType;
  onSessionTypeChange: (type: SessionType) => void;
  patientName?: string;
  className?: string;
}

interface SessionTypeItem {
  type: SessionType;
  label: string;
  description: string;
  tokenBudget: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  activeSessionType,
  onSessionTypeChange,
  patientName,
  className = '',
}) => {
  const { t } = useTranslation();
  const { notify } = useToast();

  // P1: Centralizar budgets - obtener desde SessionTypeService (source of truth)
  const sessionTypeItems: SessionTypeItem[] = [
    {
      type: 'initial',
      label: t('workflow.sidebar.initialAssessment'),
      description: t('workflow.sidebar.initialAssessmentDesc'),
      tokenBudget: SessionTypeService.getTokenBudget('initial'),
      icon: FileText,
    },
    {
      type: 'followup',
      label: t('workflow.sidebar.followup'),
      description: t('workflow.sidebar.followupDesc'),
      tokenBudget: SessionTypeService.getTokenBudget('followup'),
      icon: RefreshCw,
    },
    {
      type: 'wsib',
      label: t('workflow.sidebar.wsib'),
      description: t('workflow.sidebar.wsibDesc'),
      tokenBudget: SessionTypeService.getTokenBudget('wsib'),
      icon: Building2,
    },
    {
      type: 'mva',
      label: t('workflow.sidebar.mva'),
      description: t('workflow.sidebar.mvaDesc'),
      tokenBudget: SessionTypeService.getTokenBudget('mva'),
      icon: Car,
    },
    {
      type: 'certificate',
      label: t('workflow.sidebar.certificate'),
      description: t('workflow.sidebar.certificateDesc'),
      tokenBudget: SessionTypeService.getTokenBudget('certificate'),
      icon: Scroll,
    },
  ];

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200
        flex flex-col z-40
        hidden lg:flex
        ${className}
      `}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            {t('workflow.sidebar.sessionTypeTitle')}
          </h2>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>{t('workflow.sidebar.tokenBudgetShown')}</span>
          </div>
        </div>
        {patientName && (
          <p className="mt-1 text-xs text-slate-500 truncate">
            {patientName}
          </p>
        )}
      </div>

      {/* Session Types */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {sessionTypeItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSessionType === item.type;
            const isPilotAvailable = SessionTypeService.isPilotAvailable(item.type);

            const handleClick = () => {
              if (!isPilotAvailable) {
                notify('Feature not available during pilot. We\'ll email you when it becomes available.');
                return;
              }
              onSessionTypeChange(item.type);
            };

            return (
              <li key={item.type}>
                <button
                  onClick={handleClick}
                  disabled={!isPilotAvailable}
                  aria-disabled={!isPilotAvailable}
                  className={`
                    w-full flex flex-col gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-150
                    text-left
                    ${!isPilotAvailable
                      ? 'opacity-50 cursor-not-allowed border-slate-200/50 bg-slate-50/30'
                      : isActive
                        ? 'border-primary-blue bg-primary-blue/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`
                          w-5 h-5 flex-shrink-0
                          ${!isPilotAvailable ? 'text-slate-400' : isActive ? 'text-primary-blue' : 'text-slate-500'}
                        `}
                      />
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${!isPilotAvailable ? 'text-slate-500' : isActive ? 'text-primary-blue' : 'text-slate-900'
                          }`}>
                          {item.label}
                        </span>
                        {!isPilotAvailable && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-apple">
                            {t('workflow.sidebar.comingSoon')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-primary-blue flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <p className={`text-xs ${!isPilotAvailable ? 'text-slate-400' : isActive ? 'text-slate-600' : 'text-slate-500'
                    }`}>
                    {item.description}
                  </p>

                  {/* WO-UX-01: Token budget removed from UI */}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

