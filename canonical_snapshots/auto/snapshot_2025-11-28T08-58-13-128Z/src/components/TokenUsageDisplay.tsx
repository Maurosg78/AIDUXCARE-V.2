/**
 * Token Usage Display Component
 * 
 * Displays token usage information in compact (header) or full (dashboard) format.
 * Shows base tokens, purchased tokens, and projections.
 * 
 * Sprint 2A - Day 2: Token Tracking Foundation
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React from 'react';
import { AlertCircle, TrendingUp, Package } from 'lucide-react';
import type { TokenUsage } from '../services/tokenTrackingService';

export interface TokenUsageDisplayProps {
  usage: TokenUsage | null;
  showProjection?: boolean;
  size?: 'compact' | 'full';
  className?: string;
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({
  usage,
  showProjection = false,
  size = 'compact',
  className = ''
}) => {
  if (!usage) {
    return (
      <div className={`text-sm text-slate-500 ${className}`}>
        Loading tokens...
      </div>
    );
  }

  const { baseTokensRemaining, purchasedTokensBalance, totalAvailable, projectedMonthlyUsage } = usage;
  const baseTokensTotal = 1200; // From CANONICAL_PRICING
  const baseTokensUsed = baseTokensTotal - baseTokensRemaining;
  const baseTokensPercent = (baseTokensUsed / baseTokensTotal) * 100;

  // Color coding based on usage
  const getColorClass = (percent: number) => {
    if (percent < 80) return 'text-emerald-600';
    if (percent < 95) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBgColorClass = (percent: number) => {
    if (percent < 80) return 'bg-emerald-50 border-emerald-200';
    if (percent < 95) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  if (size === 'compact') {
    // Compact version for header
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700">
            {totalAvailable.toLocaleString()}
          </span>
          <span className="text-slate-500">tokens</span>
        </div>
        {baseTokensPercent >= 80 && (
          <AlertCircle className={`w-4 h-4 ${getColorClass(baseTokensPercent)}`} />
        )}
      </div>
    );
  }

  // Full version for dashboard/workflow
  return (
    <div className={`rounded-xl border-2 p-4 ${getBgColorClass(baseTokensPercent)} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 font-apple">
          Token Usage
        </h3>
        {baseTokensPercent >= 80 && (
          <AlertCircle className={`w-5 h-5 ${getColorClass(baseTokensPercent)}`} />
        )}
      </div>

      {/* Base Tokens */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-700 font-apple">
            Base Tokens (Monthly)
          </span>
          <span className={`text-xs font-semibold ${getColorClass(baseTokensPercent)}`}>
            {baseTokensRemaining.toLocaleString()} / {baseTokensTotal.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              baseTokensPercent < 80 ? 'bg-emerald-500' :
              baseTokensPercent < 95 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, baseTokensPercent)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1 font-apple">
          {baseTokensUsed.toLocaleString()} used this month
        </p>
      </div>

      {/* Purchased Tokens */}
      {purchasedTokensBalance > 0 && (
        <div className="mb-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 font-apple">
              Purchased Tokens
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {purchasedTokensBalance.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-apple">
            Rollover tokens (expire after 12 months)
          </p>
        </div>
      )}

      {/* Total Available */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 font-apple">
            Total Available
          </span>
          <span className="text-lg font-bold text-slate-900 font-apple">
            {totalAvailable.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Projection */}
      {showProjection && projectedMonthlyUsage > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs font-medium text-slate-700 font-apple">
                Projected Monthly Usage
              </p>
              <p className="text-sm font-semibold text-slate-900 font-apple">
                {projectedMonthlyUsage.toLocaleString()} tokens
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning if low on tokens */}
      {baseTokensPercent >= 80 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-800 font-apple">
                {baseTokensPercent >= 95 ? 'Low on tokens' : 'Running low on tokens'}
              </p>
              <p className="text-xs text-red-700 mt-1 font-apple">
                Consider purchasing a token package to continue using the service.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

