/** Stable sessionId for "latest in-progress initial" session (resume after interrupt). */
export const SESSION_ID_LATEST_INITIAL = '__latest_initial__';

export class SessionStorage {
  private static readonly KEY_PREFIX_LEGACY = 'aidux_';
  private static readonly KEY_PREFIX_V2 = 'aidux_v2_';

  private static getPreferredStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }

    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }

    return null;
  }

  private static getLegacyStorage(): Storage | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }

    return null;
  }

  private static readValue(key: string): string | null {
    const preferredStorage = this.getPreferredStorage();
    const legacyStorage = this.getLegacyStorage();

    const preferredValue = preferredStorage?.getItem(key) ?? null;
    if (preferredValue) {
      return preferredValue;
    }

    if (legacyStorage && legacyStorage !== preferredStorage) {
      const legacyValue = legacyStorage.getItem(key);
      if (legacyValue) {
        return legacyValue;
      }
    }

    return null;
  }

  private static writeValue(key: string, value: string): void {
    const preferredStorage = this.getPreferredStorage();
    const legacyStorage = this.getLegacyStorage();

    preferredStorage?.setItem(key, value);

    if (legacyStorage && legacyStorage !== preferredStorage) {
      legacyStorage.removeItem(key);
    }
  }

  private static removeValue(key: string): void {
    const preferredStorage = this.getPreferredStorage();
    const legacyStorage = this.getLegacyStorage();

    preferredStorage?.removeItem(key);
    legacyStorage?.removeItem(key);
  }

  /**
   * Build v2 key: aidux_v2_${userId}_${patientId}_${visitType}_${sessionId}
   */
  private static buildKeyV2(userId: string, patientId: string, visitType: string, sessionId: string): string {
    // Normalize visitType: 'follow-up' -> 'follow_up', 'initial' -> 'initial', etc.
    const normalizedVisitType = visitType.replace(/-/g, '_').toLowerCase();
    return `${this.KEY_PREFIX_V2}${userId}_${patientId}_${normalizedVisitType}_${sessionId}`;
  }
  
  /**
   * Build legacy key: aidux_${patientId}
   */
  private static buildKeyLegacy(patientId: string): string {
    return `${this.KEY_PREFIX_LEGACY}${patientId}`;
  }
  
  /**
   * Migrate legacy session to v2 key
   */
  private static migrateLegacySession(patientId: string, userId: string, visitType: string, sessionId: string): void {
    try {
      const legacyKey = this.buildKeyLegacy(patientId);
      const legacyStorage = this.getLegacyStorage();
      const preferredStorage = this.getPreferredStorage();
      const legacyData = legacyStorage?.getItem(legacyKey) ?? null;
      
      if (!legacyData) return; // No legacy data to migrate
      
      const parsed = JSON.parse(legacyData);
      
      // Only migrate if data is not empty and looks valid
      if (!parsed || Object.keys(parsed).length === 0) return;
      if (parsed.transcript && parsed.transcript.trim().length === 0 && !parsed.niagaraResults && !parsed.localSoapNote) {
        // Empty transcript and no other data, skip migration
        return;
      }
      
      // Save to v2 key
      const v2Key = this.buildKeyV2(userId, patientId, visitType, sessionId);
      const migratedData = {
        ...parsed,
        timestamp: new Date().toISOString(),
        version: '2.0',
        migratedFrom: 'legacy'
      };
      preferredStorage?.setItem(v2Key, JSON.stringify(migratedData));
      
      // Remove legacy key only if migration successful
      legacyStorage?.removeItem(legacyKey);
      console.log('[SessionStorage] Migrated legacy session to v2');
    } catch (e) {
      console.warn('[SessionStorage] Error migrating legacy session:', e);
      // Don't throw - migration failure shouldn't block normal operation
    }
  }
  
  /**
   * Save session with v2 key structure
   * 
   * @param patientId Patient ID
   * @param data Session data
   * @param userId User ID (optional, will use 'unknown' if not provided)
   * @param visitType Visit type: 'initial' | 'follow-up' | 'follow_up' | 'wsib' | 'mva' | 'certificate' | 'discharge' (optional, will use 'initial' if not provided)
   * @param sessionId Session ID (optional, will generate if not provided)
   */
  static saveSession(
    patientId: string, 
    data: any,
    userId?: string,
    visitType?: string,
    sessionId?: string
  ): void {
    try {
      // Generate or use provided IDs
      const finalUserId = userId || 'unknown';
      const finalVisitType = visitType || 'initial';
      const finalSessionId = sessionId || `${finalUserId}-${Date.now()}`;
      
      // Try legacy migration once (if userId is available)
      if (userId) {
        this.migrateLegacySession(patientId, finalUserId, finalVisitType, finalSessionId);
      }
      
      // Build v2 key
      const v2Key = this.buildKeyV2(finalUserId, patientId, finalVisitType, finalSessionId);
      
      // Preserve data.sessionId when present (e.g. Firestore session id for "latest initial" resume); key still uses finalSessionId
      const sessionData = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '2.0',
        userId: finalUserId,
        patientId,
        visitType: finalVisitType,
        sessionId: data?.sessionId != null && String(data.sessionId).trim() !== '' ? data.sessionId : finalSessionId
      };
      
      const serializedData = JSON.stringify(sessionData);
      this.writeValue(v2Key, serializedData);
    } catch (e) {
      console.error('[SessionStorage] Error guardando sesión:', e);
    }
  }

  /**
   * Get session with v2 key structure, with legacy fallback
   * 
   * @param patientId Patient ID
   * @param userId User ID (optional, for v2 key lookup)
   * @param visitType Visit type (optional, for v2 key lookup)
   * @param sessionId Session ID (optional, for v2 key lookup)
   * @returns Session data or null
   */
  static getSession(
    patientId: string,
    userId?: string,
    visitType?: string,
    sessionId?: string
  ): any {
    try {
      // If v2 params provided, try v2 key first
      if (userId && visitType && sessionId) {
        const v2Key = this.buildKeyV2(userId, patientId, visitType, sessionId);
        const v2Data = this.readValue(v2Key);
        if (v2Data) {
          return JSON.parse(v2Data);
        }
      }
      
      // Fallback to legacy key (for backward compatibility)
      const legacyKey = this.buildKeyLegacy(patientId);
      const legacyData = this.readValue(legacyKey);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        // If we have v2 params, attempt migration
        if (userId && visitType && sessionId) {
          this.migrateLegacySession(patientId, userId, visitType, sessionId);
        }
        return parsed;
      }
      
      return null;
    } catch (e) {
      console.error('[SessionStorage] Error recuperando sesión:', e);
      return null;
    }
  }

  /**
   * Clear session (v2 key if params provided, otherwise legacy key)
   * 
   * @param patientId Patient ID
   * @param userId User ID (optional, for v2 key deletion)
   * @param visitType Visit type (optional, for v2 key deletion)
   * @param sessionId Session ID (optional, for v2 key deletion)
   */
  static clearSession(
    patientId: string,
    userId?: string,
    visitType?: string,
    sessionId?: string
  ): void {
    try {
      // If v2 params provided, clear v2 key
      if (userId && visitType && sessionId) {
        const v2Key = this.buildKeyV2(userId, patientId, visitType, sessionId);
        this.removeValue(v2Key);
      }

      // Also clear "latest initial" slot when clearing initial session so resume doesn't restore stale data
      if (userId && visitType && String(visitType).replace(/-/g, '_').toLowerCase() === 'initial') {
        const latestKey = this.buildKeyV2(userId, patientId, visitType, SESSION_ID_LATEST_INITIAL);
        this.removeValue(latestKey);
      }
      
      // Also clear legacy key for backward compatibility
      const legacyKey = this.buildKeyLegacy(patientId);
      this.removeValue(legacyKey);
    } catch (e) {
      console.error('[SessionStorage] Error limpiando sesión:', e);
    }
  }

  /**
   * Get latest in-progress initial session for a patient (for resume after interrupt).
   * Uses stable key so save on unmount and restore on mount use the same slot.
   */
  static getLatestInitialSession(patientId: string, userId: string): any {
    return this.getSession(patientId, userId, 'initial', SESSION_ID_LATEST_INITIAL);
  }

  /**
   * Save current state as "latest initial" for this patient (for resume after interrupt).
   */
  static saveLatestInitialSession(patientId: string, userId: string, data: any): void {
    this.saveSession(patientId, data, userId, 'initial', SESSION_ID_LATEST_INITIAL);
  }
}
