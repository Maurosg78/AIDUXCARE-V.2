export class SessionStorage {
  private static readonly KEY_PREFIX_LEGACY = 'aidux_';
  private static readonly KEY_PREFIX_V2 = 'aidux_v2_';
  
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
      const legacyData = localStorage.getItem(legacyKey);
      
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
      localStorage.setItem(v2Key, JSON.stringify(migratedData));
      
      // Remove legacy key only if migration successful
      localStorage.removeItem(legacyKey);
      console.log('[SessionStorage] Migrated legacy session to v2:', { patientId, visitType, sessionId });
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
      
      const sessionData = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '2.0',
        userId: finalUserId,
        patientId,
        visitType: finalVisitType,
        sessionId: finalSessionId
      };
      
      localStorage.setItem(v2Key, JSON.stringify(sessionData));
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
        const v2Data = localStorage.getItem(v2Key);
        if (v2Data) {
          return JSON.parse(v2Data);
        }
      }
      
      // Fallback to legacy key (for backward compatibility)
      const legacyKey = this.buildKeyLegacy(patientId);
      const legacyData = localStorage.getItem(legacyKey);
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
        localStorage.removeItem(v2Key);
      }
      
      // Also clear legacy key for backward compatibility
      const legacyKey = this.buildKeyLegacy(patientId);
      localStorage.removeItem(legacyKey);
    } catch (e) {
      console.error('[SessionStorage] Error limpiando sesión:', e);
    }
  }
}
