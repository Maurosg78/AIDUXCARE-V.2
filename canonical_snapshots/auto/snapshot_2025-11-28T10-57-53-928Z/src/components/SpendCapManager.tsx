/**
 * Spend Cap Manager Component
 * 
 * Allows users to set and manage monthly spend caps.
 * 
 * Sprint 2A - Day 2: Token Tracking Foundation
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { SpendCapService, type SpendCapInfo } from '../services/spendCapService';
import { useAuth } from '../hooks/useAuth';

export interface SpendCapManagerProps {
  currentCap?: number;
  currentSpend: number;
  projectedSpend: number;
  onCapChange: (newCap: number | null) => void;
  className?: string;
}

export const SpendCapManager: React.FC<SpendCapManagerProps> = ({
  currentCap,
  currentSpend,
  projectedSpend,
  onCapChange,
  className = ''
}) => {
  const { user } = useAuth();
  const [localCap, setLocalCap] = useState<number | null>(currentCap || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalCap(currentCap || null);
  }, [currentCap]);

  const handleSave = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      if (localCap !== null && localCap > 0) {
        await SpendCapService.setMonthlySpendCap(user.uid, localCap);
      }
      onCapChange(localCap);
      setIsEditing(false);
    } catch (error) {
      console.error('[SpendCapManager] Error saving spend cap:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      // Setting to null removes the cap
      setLocalCap(null);
      onCapChange(null);
      setIsEditing(false);
    } catch (error) {
      console.error('[SpendCapManager] Error removing spend cap:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const remainingCap = localCap ? Math.max(0, localCap - currentSpend) : null;
  const wouldExceedCap = localCap ? projectedSpend > localCap : false;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800 font-apple">
            Monthly Spend Cap
          </h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-primary-blue hover:text-primary-blue-hover font-apple"
          >
            {localCap ? 'Edit' : 'Set Cap'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 font-apple">
              Monthly Spend Limit (CAD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={localCap || ''}
              onChange={(e) => setLocalCap(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="No limit"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            <p className="text-xs text-slate-500 mt-1 font-apple">
              Set a maximum monthly spend limit. Leave empty for no limit.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-3 py-2 bg-primary-blue text-white rounded-lg text-sm font-medium hover:bg-primary-blue-hover disabled:opacity-50 font-apple"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setLocalCap(currentCap || null);
              }}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 font-apple"
            >
              Cancel
            </button>
            {localCap && (
              <button
                onClick={handleRemove}
                disabled={isSaving}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 font-apple"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {localCap ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-apple">Current Cap:</span>
                <span className="text-sm font-semibold text-slate-900 font-apple">
                  ${localCap.toFixed(2)} CAD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-apple">Current Spend:</span>
                <span className="text-sm font-semibold text-slate-900 font-apple">
                  ${currentSpend.toFixed(2)} CAD
                </span>
              </div>
              {remainingCap !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-apple">Remaining:</span>
                  <span className={`text-sm font-semibold font-apple ${
                    remainingCap > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    ${remainingCap.toFixed(2)} CAD
                  </span>
                </div>
              )}
              {wouldExceedCap && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-800 font-apple">
                    Projected spend (${projectedSpend.toFixed(2)}) would exceed cap
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500 font-apple">
              <CheckCircle className="w-4 h-4" />
              <span>No spend cap set</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

