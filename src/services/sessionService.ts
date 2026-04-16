import { collection, doc, addDoc, getDoc, getDocs, setDoc, query, where, orderBy, serverTimestamp, limit, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PhysicalExamResult, SOAPNote } from '../types/vertex-ai';

/** WO-BUG2-SESSION-IDEMPOTENCY: same calendar day + same kind (initial vs follow-up), scoped to patient + practitioner */
export type SessionKind = 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate';

export type CreateSessionWithIdOptions = {
  /** When true, merge into existing `sessions/{sessionId}` (e.g. after findReusableSessionForDayAndType hit). */
  merge?: boolean;
};
import type { ClinicalAttachment } from './clinicalAttachmentService';
import type { EvaluationTestEntry } from '../core/soap/PhysicalExamResultBuilder';

interface SessionData {
  userId: string;
  patientName: string;
  patientId: string;
  transcript: string;
  soapNote?: SOAPNote | Record<string, unknown> | null;
  physicalTests?: Array<EvaluationTestEntry | PhysicalExamResult>;
  timestamp?: any;
  status: 'draft' | 'completed' | 'recording_in_progress' | 'interrupted' | 'cancelled';
  // ✅ Sprint 2A: Session Type Integration
  sessionType?: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate';
  tokenBudget?: number;
  tokensUsed?: number;
  billingMonth?: string; // 'YYYY-MM' for aggregation
  isBillable?: boolean;
  transcriptionMeta?: {
    lang: string | null;
    languagePreference: string;
    mode: 'live' | 'dictation';
    averageLogProb?: number | null;
    durationSeconds?: number;
    recordedAt: string;
  };
  attachments?: ClinicalAttachment[];
  /** Sprint A (follow-up): HEP compliance for this session doc only — source of truth on `sessions/{id}`. */
  hepCompliance?: Array<{ itemId: string; done: boolean; date: string }>;
  writeState?: 'draft' | 'soap_generated' | 'soap_saved' | 'encounter_saved' | 'fully_committed' | 'commit_failed';
  lastCommitStep?: string;
  lastCommitError?: string | null;
  finalizationOperationId?: string | null;
  commitAttemptCount?: number;
  soapNoteId?: string;
  encounterId?: string;
  encounterPersisted?: boolean;
  clientBuildId?: string;
  clientAppVersion?: string;
}

class SessionService {
  private COLLECTION_NAME = 'sessions';

  private localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private normalizeSessionKind(raw: unknown): SessionKind | null {
    if (raw === 'initial') return 'initial';
    if (raw === 'follow-up' || raw === 'followup') return 'followup';
    if (raw === 'wsib') return 'wsib';
    if (raw === 'mva') return 'mva';
    if (raw === 'certificate') return 'certificate';
    return null;
  }

  private timestampToLocalDateKey(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      const toDate = (value as Timestamp).toDate;
      if (typeof toDate === 'function') return this.localDateKey(toDate.call(value));
    }
    if (value instanceof Date) return this.localDateKey(value);
    return null;
  }

  /**
   * Reuse an open session for the same patient, practitioner, local calendar day, and session kind
   * (initial vs follow-up). Skips sessions that already have finalized SOAP so a second real visit
   * the same day can use a new document.
   */
  async findReusableSessionForDayAndType(
    patientId: string,
    userId: string,
    sessionKind: SessionKind,
    referenceDate: Date = new Date()
  ): Promise<string | null> {
    try {
      const targetKey = this.localDateKey(referenceDate);
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        sessionsRef,
        where('patientId', '==', patientId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(40)
      );
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        const data = d.data();
        const kind = this.normalizeSessionKind(data.sessionType);
        if (kind == null || kind !== sessionKind) continue;
        const docKey = this.timestampToLocalDateKey(data.timestamp ?? data.createdAt);
        if (docKey !== targetKey) continue;
        if (data.soapStatus === 'finalized') continue;
        return d.id;
      }
      return null;
    } catch (e) {
      console.warn('[SessionService] findReusableSessionForDayAndType failed (non-blocking):', e);
      return null;
    }
  }

  /**
   * Helper function to remove undefined values from objects (Firestore doesn't accept undefined)
   */
  private cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(this.cleanUndefined.bind(this)).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.cleanUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }

  async createSession(sessionData: SessionData): Promise<string> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      
      // ✅ FIX: Clean undefined values before saving to Firestore
      const cleanedSessionData = this.cleanUndefined(sessionData);
      
      const newSession = {
        ...cleanedSessionData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(sessionsRef, newSession);
      return docRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * WO-IA-RESUME-01: Create session with a specific id so resume can find it.
   * WO-BUG2-RACE: Callers must run findReusableSessionForDayAndType before the first write, then pass
   * merge: true when reusing an existing open session.
   */
  async createSessionWithId(
    sessionId: string,
    sessionData: SessionData,
    options?: CreateSessionWithIdOptions
  ): Promise<string> {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('aidux_simulate_firestore_fail') === 'true') {
      throw new Error('[Simulación] Firestore no disponible. No se pudo guardar la sesión. Comprueba tu conexión e inténtalo de nuevo.');
    }
    try {
      const targetDocId = sessionId;
      const docRef = doc(db, this.COLLECTION_NAME, targetDocId);
      const cleanedSessionData = this.cleanUndefined(sessionData);
      const mergeRequested = options?.merge === true;
      if (mergeRequested) {
        const mergePayload = {
          ...cleanedSessionData,
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, mergePayload, { merge: true });
        return targetDocId;
      }
      const newSession = {
        ...cleanedSessionData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      await setDoc(docRef, newSession);
      return targetDocId;
    } catch (error) {
      console.error('Error creating session with id:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * WO-IA-RESUME-01: Load existing session by id for resume flow.
   * @returns Session data or null if not found
   */
  async getSessionById(sessionId: string): Promise<{ id: string; [key: string]: any } | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('Error fetching session by id:', error);
      return null;
    }
  }

  /**
   * WO-IA-RESUME-01: Update existing session (merge). Use when resuming — do not create new session.
   */
  async updateSession(sessionId: string, data: Partial<SessionData> & { [key: string]: any }): Promise<void> {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('aidux_simulate_firestore_fail') === 'true') {
      throw new Error('[Simulación] Firestore no disponible. No se pudo actualizar la sesión. Comprueba tu conexión e inténtalo de nuevo.');
    }
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const cleaned = this.cleanUndefined(data);
      await setDoc(docRef, { ...cleaned, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
  }

  async getInProgressSessions(userId: string): Promise<{ id: string; patientId: string; patientName: string; sessionType: string; transcript: string; status?: string }[]> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      // Include both in-progress and interrupted so Command Center shows "Resume" for interrupted
      const statuses = ['recording_in_progress', 'interrupted'] as const;
      const results: { id: string; patientId: string; patientName: string; sessionType: string; transcript: string; status?: string; soapStatus?: string; updatedAt?: unknown }[] = [];
      for (const status of statuses) {
        const q = query(
          sessionsRef,
          where('userId', '==', userId),
          where('status', '==', status),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(d => {
          const data = d.data();
          results.push({
            id: d.id,
            patientId: data.patientId || '',
            patientName: data.patientName || 'Unknown patient',
            sessionType: data.sessionType || 'followup',
            transcript: data.transcript || '',
            status,
            soapStatus: data.soapStatus || undefined,
            updatedAt: data.updatedAt,
          });
        });
      }
      const toMillis = (value: unknown): number => {
        return value && typeof (value as { toMillis?: () => number }).toMillis === 'function'
          ? (value as { toMillis(): number }).toMillis()
          : 0;
      };
      const completedSessionsQuery = query(
        sessionsRef,
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const completedSnapshot = await getDocs(completedSessionsQuery);
      const completedSessionDocs = completedSnapshot.docs;
      const completedSessions: { id: string; patientId?: string; sessionType?: string; soapStatus?: string; updatedAt?: unknown }[] =
        completedSessionDocs.map((d) => {
          const docId = d.id;
          const docData = d.data();
          return { id: docId, ...docData };
        });
      const latestFinalizedByPatientSessionType = new Map<string, number>();
      for (const session of completedSessions) {
        if (session.soapStatus !== 'finalized') continue;
        const normalizedSessionType = this.normalizeSessionKind(session.sessionType);
        if (normalizedSessionType == null) continue;
        const key = `${session.patientId}::${normalizedSessionType}`;
        const updatedAtMs = toMillis(session.updatedAt);
        const current = latestFinalizedByPatientSessionType.get(key) ?? 0;
        if (updatedAtMs > current) {
          latestFinalizedByPatientSessionType.set(key, updatedAtMs);
        }
      }
      const consultationsRef = collection(db, 'consultations');
      const consultationsQuery = query(
        consultationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const consultationsSnapshot = await getDocs(consultationsQuery);
      const latestConsultationByPatientSessionType = new Map<string, number>();
      for (const consultationDoc of consultationsSnapshot.docs) {
        const data = consultationDoc.data();
        const patientId = data.patientId;
        const normalizedSessionType = this.normalizeSessionKind(data.visitType || 'initial');
        if (!patientId) continue;
        if (normalizedSessionType == null) continue;
        const key = `${patientId}::${normalizedSessionType}`;
        const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
        const current = latestConsultationByPatientSessionType.get(key) ?? 0;
        if (createdAtMs > current) {
          latestConsultationByPatientSessionType.set(key, createdAtMs);
        }
      }
      const filteredResults = results.filter((session) => {
        if (session.soapStatus === 'finalized') return false;
        if (session.status === 'interrupted') {
          const key = `${session.patientId}::${session.sessionType}`;
          const latestFinalizedAt = latestFinalizedByPatientSessionType.get(key) ?? 0;
          const latestConsultationAt = latestConsultationByPatientSessionType.get(key) ?? 0;
          const latestCompletedAt = Math.max(latestFinalizedAt, latestConsultationAt);
          const sessionUpdatedAt = toMillis(session.updatedAt);
          if (latestCompletedAt > 0 && sessionUpdatedAt <= latestCompletedAt) {
            return false;
          }
        }
        return true;
      });
      // Sort merged by updatedAt desc and dedupe by id
      const byId = new Map(filteredResults.map(r => [r.id, r]));
      const sorted = [...byId.values()].sort((a, b) => {
        const aT = toMillis(a.updatedAt);
        const bT = toMillis(b.updatedAt);
        return bT - aT;
      });
      return sorted.slice(0, 10).map(({ id, patientId, patientName, sessionType, transcript, status }) => ({
        id,
        patientId,
        patientName,
        sessionType,
        transcript,
        status,
      }));
    } catch (error) {
      console.error('Error fetching in-progress sessions:', error);
      return [];
    }
  }

  async getTodaySessions(userId: string): Promise<any[]> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Check if this is the first session for a patient
   * 
   * @param patientId - Patient ID to check
   * @param userId - User ID (optional, for filtering by practitioner)
   * @returns true if this is the first session, false otherwise
   */
  async isFirstSession(patientId: string, userId?: string): Promise<boolean> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      
      // Create separate queries based on whether userId is provided
      // This ensures we use the correct index
      let q;
      if (userId) {
        // Use index: patientId (Asc) + userId (Asc) + timestamp (Desc)
        q = query(
          sessionsRef,
          where('patientId', '==', patientId),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
      } else {
        // Use index: patientId (Asc) + timestamp (Desc)
        q = query(
          sessionsRef,
          where('patientId', '==', patientId),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.empty; // If no sessions found, this is the first one
    } catch (error) {
      console.error('Error checking first session:', error);
      // Fail-safe: assume it's not first session if we can't check
      return false;
    }
  }
}

export default new SessionService();
