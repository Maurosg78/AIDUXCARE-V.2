/**
 * Session Type Selector Component
 * 
 * Allows users to select the type of clinical session,
 * displaying token budget information for each type.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React from 'react';
import { SessionType, SessionTypeService } from '../services/sessionTypeService';
import { Info } from 'lucide-react';

export interface SessionTypeSelectorProps {
  value: SessionType;
  onChange: (type: SessionType) => void;
  showTokenBudget?: boolean;
  className?: string;
  disabled?: boolean;
}

export const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  value,
  onChange,
  showTokenBudget = true,
  className = '',
  disabled = false
}) => {
  const sessionTypes = SessionTypeService.getAllSessionTypes();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-slate-800 font-apple">
          Session Type
        </label>
        {showTokenBudget && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Token budget shown</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessionTypes.map((sessionType) => {
          const isSelected = value === sessionType.value;
          const config = SessionTypeService.getSessionTypeConfig(sessionType.value);
          
          return (
            <button
              key={sessionType.value}
              type="button"
              onClick={() => !disabled && onChange(sessionType.value)}
              disabled={disabled}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                text-left
                ${isSelected
                  ? 'border-primary-blue bg-primary-blue/5 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {config.icon && (
                    <span className="text-xl">{config.icon}</span>
                  )}
                  <span className={`text-sm font-semibold font-apple ${
                    isSelected ? 'text-primary-blue' : 'text-slate-800'
                  }`}>
                    {config.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary-blue flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 mb-2 font-apple">
                {config.description}
              </p>

              {showTokenBudget && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500 font-apple">
                    Token Budget:
                  </span>
                  <span className={`text-xs font-semibold font-apple ${
                    isSelected ? 'text-primary-blue' : 'text-slate-700'
                  }`}>
                    {config.tokenBudget} tokens
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

