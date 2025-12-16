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

const sessionTypeItems: SessionTypeItem[] = [
  {
    type: 'initial',
    label: 'Initial Assessment',
    description: 'Comprehensive initial evaluation',
    tokenBudget: 10,
    icon: FileText,
  },
  {
    type: 'followup',
    label: 'Follow-up',
    description: 'Progress check and treatment continuation',
    tokenBudget: 4,
    icon: RefreshCw,
  },
  {
    type: 'wsib',
    label: 'WSIB',
    description: 'Workplace Safety and Insurance Board assessment',
    tokenBudget: 13,
    icon: Building2,
  },
  {
    type: 'mva',
    label: 'MVA',
    description: 'Motor Vehicle Accident assessment',
    tokenBudget: 15,
    icon: Car,
  },
  {
    type: 'certificate',
    label: 'Medical Certificate',
    description: 'Specific assessment for certification',
    tokenBudget: 6,
    icon: Scroll,
  },
];

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  activeSessionType,
  onSessionTypeChange,
  patientName,
  className = '',
}) => {
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
            Session Type
          </h2>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Token budget shown</span>
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

            return (
              <li key={item.type}>
                <button
                  onClick={() => onSessionTypeChange(item.type)}
                  className={`
                    w-full flex flex-col gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-150
                    text-left
                    ${
                      isActive
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
                          ${isActive ? 'text-primary-blue' : 'text-slate-500'}
                        `}
                      />
                      <span className={`text-sm font-semibold ${
                        isActive ? 'text-primary-blue' : 'text-slate-900'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-primary-blue flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-xs ${
                    isActive ? 'text-slate-600' : 'text-slate-500'
                  }`}>
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-medium text-slate-500">
                      Token Budget:
                    </span>
                    <span className={`text-xs font-semibold ${
                      isActive ? 'text-primary-blue' : 'text-slate-700'
                    }`}>
                      {item.tokenBudget} tokens
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

