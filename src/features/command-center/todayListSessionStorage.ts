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
  dateKey: string;
}

export function setSessionCompleted(
  patientId: string,
  sessionType: SessionTypeForList,
  dateKey: string
): void {
  try {
    const payload = {
      patientId,
      sessionType,
      dateKey,
    };
    const serializedPayload = JSON.stringify(payload);
    sessionStorage.setItem(SESSION_COMPLETED_KEY, serializedPayload);
  } catch {
    // ignore
  }
}

export function getAndClearSessionCompleted(
  expectedDateKey: string
): SessionCompletedPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_COMPLETED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionCompletedPayload;
    const payloadDateKey = data.dateKey;
    const isMatchingDateKey = payloadDateKey === expectedDateKey;
    if (!isMatchingDateKey) {
      return null;
    }
    sessionStorage.removeItem(SESSION_COMPLETED_KEY);
    return data;
  } catch {
    return null;
  }
}
