/**
 * Session State Persistence Utilities
 * 
 * Handles saving and restoring session state across route changes
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import type { SessionState, SessionStateUpdate } from '../types/sessionState';

const STORAGE_KEY_PREFIX = 'aiduxcare_session_';
const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save session state to localStorage
 */
export const saveSessionState = async (state: SessionState): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${state.sessionId}`;
    const data = {
      ...state,
      startTime: state.startTime.toISOString(),
      lastUpdated: state.lastUpdated.toISOString(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[SessionPersistence] Error saving session state:', error);
    throw error;
  }
};

/**
 * Load session state from localStorage
 */
export const loadSessionState = async (sessionId: string): Promise<SessionState | null> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);
    
    // Check if expired
    const savedAt = new Date(data.savedAt);
    const now = new Date();
    if (now.getTime() - savedAt.getTime() > STORAGE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    // Restore Date objects
    return {
      ...data,
      startTime: new Date(data.startTime),
      lastUpdated: new Date(data.lastUpdated),
    };
  } catch (error) {
    console.error('[SessionPersistence] Error loading session state:', error);
    return null;
  }
};

/**
 * Update session state
 */
export const updateSessionState = async (
  sessionId: string,
  update: SessionStateUpdate
): Promise<void> => {
  try {
    const existing = await loadSessionState(sessionId);
    if (!existing) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updated: SessionState = {
      ...existing,
      ...update,
      lastUpdated: new Date(),
    };

    await saveSessionState(updated);
  } catch (error) {
    console.error('[SessionPersistence] Error updating session state:', error);
    throw error;
  }
};

/**
 * Delete session state
 */
export const deleteSessionState = async (sessionId: string): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[SessionPersistence] Error deleting session state:', error);
    throw error;
  }
};

/**
 * List all session states
 */
export const listSessionStates = async (): Promise<SessionState[]> => {
  try {
    const sessions: SessionState[] = [];
    // Use localStorage.length and key() instead of Object.keys for better compatibility
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const sessionId = key.replace(STORAGE_KEY_PREFIX, '');
        const state = await loadSessionState(sessionId);
        if (state) {
          sessions.push(state);
        }
      }
    }

    return sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  } catch (error) {
    console.error('[SessionPersistence] Error listing session states:', error);
    return [];
  }
};

/**
 * Clear expired session states
 */
export const clearExpiredSessions = async (): Promise<void> => {
  try {
    // Get all keys from localStorage
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    
    const now = new Date();
    
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            // Check if savedAt exists and is expired
            if (data.savedAt) {
              const savedAt = new Date(data.savedAt);
              if (now.getTime() - savedAt.getTime() > STORAGE_EXPIRY_MS) {
                localStorage.removeItem(key);
              }
            } else {
              // No savedAt means it's old format, remove it
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SessionPersistence] Error clearing expired sessions:', error);
  }
};

/**
 * Get current active session ID from URL or storage
 */
export const getCurrentSessionId = (): string | null => {
  // Try to get from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  if (sessionId) {
    return sessionId;
  }

  // Try to get from path params (e.g., /workflow/:sessionId)
  const pathParts = window.location.pathname.split('/');
  const workflowIndex = pathParts.indexOf('workflow');
  if (workflowIndex !== -1 && pathParts[workflowIndex + 1]) {
    return pathParts[workflowIndex + 1];
  }

  return null;
};

