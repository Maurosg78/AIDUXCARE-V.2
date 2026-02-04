/**
 * Shared sessionStorage keys for Today's list and workflow completion.
 * Workflow sets SESSION_COMPLETED_KEY when Initial/Ongoing/Follow-up is closed;
 * Command Center reads it and marks the patient as "done" in the list.
 */

export const LAST_STARTED_KEY = 'commandCenter_lastStarted';
export const SESSION_COMPLETED_KEY = 'commandCenter_sessionCompleted';

export type SessionTypeForList = 'initial' | 'followup' | 'ongoing';

export interface SessionCompletedPayload {
  patientId: string;
  sessionType: SessionTypeForList;
}

export function setSessionCompleted(patientId: string, sessionType: SessionTypeForList): void {
  try {
    sessionStorage.setItem(SESSION_COMPLETED_KEY, JSON.stringify({ patientId, sessionType }));
  } catch {
    // ignore
  }
}

export function getAndClearSessionCompleted(): SessionCompletedPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_COMPLETED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionCompletedPayload;
    sessionStorage.removeItem(SESSION_COMPLETED_KEY);
    return data;
  } catch {
    return null;
  }
}
