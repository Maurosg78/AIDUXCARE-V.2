/**
 * Token Budget Display Component
 * 
 * Shows simulated token budget for pilot phase.
 * - Displays initial budget (hardcoded: 20 tokens)
 * - Decrements when session starts (UI only, no persistence)
 * - Shows warning when budget reaches 0 (does not block)
 * 
 * WO-PHASE-1-UI-CORRECTIONS: Issue 2
 */

import React, { useState, useEffect } from 'react';
import { SessionTypeService } from '@/services/sessionTypeService';

interface TokenBudgetDisplayProps {
  onSessionStart?: (sessionType: 'initial' | 'followup' | 'wsib' | 'mva') => void;
}

const PILOT_TOKEN_BUDGET = 20; // Hardcoded pilot budget

export const TokenBudgetDisplay: React.FC<TokenBudgetDisplayProps> = ({
  onSessionStart,
}) => {
  const [remainingTokens, setRemainingTokens] = useState(PILOT_TOKEN_BUDGET);

  // Listen for session start events (via custom event)
  useEffect(() => {
    const handleSessionStart = (event: CustomEvent<{ sessionType: 'initial' | 'followup' | 'wsib' | 'mva' }>) => {
      const { sessionType } = event.detail;
      const tokenCost = SessionTypeService.getTokenBudget(sessionType);
      
      setRemainingTokens((prev) => {
        const newValue = Math.max(0, prev - tokenCost);
        return newValue;
      });

      // Call optional callback
      if (onSessionStart) {
        onSessionStart(sessionType);
      }
    };

    window.addEventListener('pilot:session-start' as any, handleSessionStart as EventListener);

    return () => {
      window.removeEventListener('pilot:session-start' as any, handleSessionStart as EventListener);
    };
  }, [onSessionStart]);

  const isBudgetExhausted = remainingTokens === 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-md font-apple">
      <span className="text-sm font-medium text-slate-700">
        Pilot Token Budget:
      </span>
      <span className={`text-sm font-semibold ${
        isBudgetExhausted 
          ? 'text-amber-600' 
          : remainingTokens <= 5 
          ? 'text-orange-600' 
          : 'text-slate-900'
      }`}>
        {remainingTokens} tokens
      </span>
      {isBudgetExhausted && (
        <span className="text-xs text-amber-600 font-medium">
          (simulation limit reached)
        </span>
      )}
    </div>
  );
};

/**
 * Helper function to dispatch session start event
 * Call this when a session starts to decrement the token budget
 */
export const dispatchSessionStart = (sessionType: 'initial' | 'followup' | 'wsib' | 'mva') => {
  const event = new CustomEvent('pilot:session-start', {
    detail: { sessionType }
  });
  window.dispatchEvent(event);
};
