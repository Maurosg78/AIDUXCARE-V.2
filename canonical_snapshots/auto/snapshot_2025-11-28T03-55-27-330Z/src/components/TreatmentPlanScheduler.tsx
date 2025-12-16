/**
 * Treatment Plan Scheduler Component
 * 
 * Helps physiotherapists schedule sessions based on SOAP note treatment plan.
 * Extracts frequency, duration, and follow-up information and allows
 * automatic scheduling of all sessions.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { parseTreatmentPlan, generateSessionDates, type ParsedTreatmentPlan } from '../services/treatmentPlanParser';
import { AppointmentService } from '../services/appointmentService';
import { useAuth } from '../hooks/useAuth';
import logger from '../shared/utils/logger';

export interface TreatmentPlanSchedulerProps {
  planText: string;
  patientId: string;
  onScheduled?: (sessionCount: number) => void;
  onCancel?: () => void;
}

export const TreatmentPlanScheduler: React.FC<TreatmentPlanSchedulerProps> = ({
  planText,
  patientId,
  onScheduled,
  onCancel,
}) => {
  const { user } = useAuth();
  const [parsedPlan, setParsedPlan] = useState<ParsedTreatmentPlan | null>(null);
  const [sessionDates, setSessionDates] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Parse treatment plan when planText changes
  useEffect(() => {
    if (planText) {
      const parsed = parseTreatmentPlan(planText);
      setParsedPlan(parsed);
      
      // Generate session dates
      if (parsed.frequencyPerWeek && parsed.durationWeeks) {
        const start = new Date(startDate);
        const dates = generateSessionDates(parsed, start);
        setSessionDates(dates);
      } else {
        setSessionDates([]);
      }
    }
  }, [planText, startDate]);

  const handleScheduleAll = async () => {
    if (!user?.uid || !parsedPlan || sessionDates.length === 0) {
      setError('Missing required information to schedule sessions');
      return;
    }

    setIsScheduling(true);
    setError(null);
    let successCount = 0;

    try {
      for (const date of sessionDates) {
        try {
          await AppointmentService.createAppointment({
            patientId: patientId,
            dateTime: date.toISOString(),
            duration: 45, // Default 45 minutes
            notes: `Session ${successCount + 1} of ${sessionDates.length} - Treatment plan`,
          });
          successCount++;
        } catch (err) {
          logger.error(`Failed to schedule session for ${date.toISOString()}:`, err);
          // Continue with other sessions even if one fails
        }
      }

      setScheduledCount(successCount);
      
      if (successCount > 0) {
        onScheduled?.(successCount);
      } else {
        setError('Failed to schedule any sessions. Please try again.');
      }
    } catch (err) {
      logger.error('Error scheduling sessions:', err);
      setError('An error occurred while scheduling sessions. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  if (!parsedPlan || (!parsedPlan.frequencyPerWeek && !parsedPlan.durationWeeks)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Treatment Plan Scheduling
            </h3>
            <p className="text-xs text-slate-600">
              Could not extract scheduling information from the treatment plan.
              Please schedule sessions manually.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasFollowUp = parsedPlan.followUpDays !== null;
  const canSchedule = sessionDates.length > 0 && !isScheduling && scheduledCount === 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            Schedule Treatment Sessions
          </h3>
          <p className="text-xs text-slate-500">
            Based on the treatment plan, we can schedule {sessionDates.length} sessions automatically.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Parsed Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Frequency</p>
          <p className="text-sm font-semibold text-slate-800">
            {parsedPlan.frequencyPerWeek ? `${parsedPlan.frequencyPerWeek}x/week` : 'N/A'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Duration</p>
          <p className="text-sm font-semibold text-slate-800">
            {parsedPlan.durationWeeks ? `${parsedPlan.durationWeeks} weeks` : 'N/A'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Total Sessions</p>
          <p className="text-sm font-semibold text-slate-800">
            {parsedPlan.totalSessions || sessionDates.length}
          </p>
        </div>
        {hasFollowUp && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-1">Follow-up</p>
            <p className="text-sm font-semibold text-blue-800">
              {parsedPlan.followUpDays ? `In ${parsedPlan.followUpDays} days` : 'N/A'}
            </p>
          </div>
        )}
      </div>

      {/* Start Date Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Start Date & Time
        </label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          disabled={isScheduling || scheduledCount > 0}
        />
        <p className="mt-1 text-xs text-slate-500">
          First session will be scheduled at this time. Subsequent sessions will be spaced automatically.
        </p>
      </div>

      {/* Session Preview */}
      {sessionDates.length > 0 && (
        <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700 mb-2">
            Sessions to be scheduled ({sessionDates.length}):
          </p>
          <div className="space-y-1">
            {sessionDates.slice(0, 10).map((date, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>
                  Session {index + 1}: {date.toLocaleDateString('en-CA', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} at {date.toLocaleTimeString('en-CA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
            {sessionDates.length > 10 && (
              <p className="text-xs text-slate-500 italic">
                ... and {sessionDates.length - 10} more sessions
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <p className="text-xs text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {scheduledCount > 0 && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-emerald-800">
                Successfully scheduled {scheduledCount} session{scheduledCount !== 1 ? 's' : ''}
              </p>
              {scheduledCount < sessionDates.length && (
                <p className="text-xs text-emerald-700 mt-1">
                  {sessionDates.length - scheduledCount} session{sessionDates.length - scheduledCount !== 1 ? 's' : ''} could not be scheduled.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isScheduling}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleScheduleAll}
          disabled={!canSchedule}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg hover:from-primary-blue-hover hover:to-primary-purple-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isScheduling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scheduling...
            </>
          ) : scheduledCount > 0 ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Scheduled
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              Schedule All Sessions
            </>
          )}
        </button>
      </div>
    </div>
  );
};

