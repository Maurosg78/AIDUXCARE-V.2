import { collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp, limit, type Timestamp } from 'firebase/firestore';
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

export type TreatmentDecisionItem = {
  id: string;
  label: string;
  completed: boolean;
  notes?: string;
};

export type TreatmentDecision = {
  source: 'physio_final_decision';
  updatedAt: string;
  inClinicItems: TreatmentDecisionItem[];
  homeProgramItems: TreatmentDecisionItem[];
};

type InProgressSessionSummary = {
  id: string;
  patientId: string;
  patientName: string;
  sessionType: string;
  transcript: string;
  status?: string;
  dateKey?: string;
  updatedAt?: string;
};

type InProgressSessionRecord = Omit<InProgressSessionSummary, 'updatedAt'> & {
  soapStatus?: string;
  writeState?: string;
  encounterId?: string;
  openResponsibilityDismissed?: boolean;
  updatedAt?: unknown;
  createdAt?: unknown;
  timestamp?: unknown;
};

type CompletedSessionRecord = {
  id: string;
  patientId?: string;
  sessionType?: string;
  soapStatus?: string;
  updatedAt?: unknown;
  createdAt?: unknown;
  timestamp?: unknown;
};

interface SessionData {
  userId: string;
  patientName: string;
  patientId: string;
  transcript: string;
  sessionDateKey?: string;
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
  treatmentDecision?: TreatmentDecision;
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

  private getSessionOwnerId(data: Record<string, unknown>): string | null {
    const userId = data.userId;
    if (typeof userId === 'string' && userId.trim() !== '') {
      return userId;
    }
    const authorUid = data.authorUid;
    if (typeof authorUid === 'string' && authorUid.trim() !== '') {
      return authorUid;
    }
    const ownerUid = data.ownerUid;
    if (typeof ownerUid === 'string' && ownerUid.trim() !== '') {
      return ownerUid;
    }
    return null;
  }

  private getSessionPatientId(data: Record<string, unknown>): string | null {
    const patientId = data.patientId;
    if (typeof patientId === 'string' && patientId.trim() !== '') {
      return patientId;
    }
    return null;
  }

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

  private timestampToIsoString(value: unknown): string | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      const toDate = (value as Timestamp).toDate;
      if (typeof toDate === 'function') return toDate.call(value).toISOString();
    }
    if (value instanceof Date) return value.toISOString();
    return undefined;
  }

  private timestampToMillis(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === 'object' && value !== null && 'toMillis' in value) {
      const toMillis = (value as { toMillis?: () => number }).toMillis;
      if (typeof toMillis === 'function') return toMillis.call(value);
    }
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') {
      const parsedTime = Date.parse(value);
      return Number.isFinite(parsedTime) ? parsedTime : 0;
    }
    return 0;
  }

  private resolveSessionDateKey(data: Record<string, unknown>): string | null {
    const explicitSessionDateKey = data.sessionDateKey;
    if (typeof explicitSessionDateKey === 'string' && explicitSessionDateKey.trim() !== '') {
      return explicitSessionDateKey;
    }
    const timestampDateKey = this.timestampToLocalDateKey(data.timestamp);
    if (timestampDateKey != null) {
      return timestampDateKey;
    }
    const createdAtDateKey = this.timestampToLocalDateKey(data.createdAt);
    if (createdAtDateKey != null) {
      return createdAtDateKey;
    }
    return null;
  }

  private isTreatmentDecisionItem(value: unknown): value is TreatmentDecisionItem {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const item = value as Record<string, unknown>;
    const hasId = typeof item.id === 'string' && item.id.trim() !== '';
    const hasLabel = typeof item.label === 'string' && item.label.trim() !== '';
    return hasId && hasLabel;
  }

  private isTreatmentDecision(value: unknown): value is TreatmentDecision {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const decision = value as Record<string, unknown>;
    const source = decision.source;
    const inClinicItems = decision.inClinicItems;
    const homeProgramItems = decision.homeProgramItems;
    const hasExpectedSource = source === 'physio_final_decision';
    const hasInClinicItems = Array.isArray(inClinicItems);
    const hasHomeProgramItems = Array.isArray(homeProgramItems);
    if (!hasExpectedSource || !hasInClinicItems || !hasHomeProgramItems) {
      return false;
    }
    const inClinicItemsValid = inClinicItems.every((item) => this.isTreatmentDecisionItem(item));
    const homeProgramItemsValid = homeProgramItems.every((item) => this.isTreatmentDecisionItem(item));
    return inClinicItemsValid && homeProgramItemsValid;
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
        const docKey = this.resolveSessionDateKey(data);
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
      const sessionDateKey = cleanedSessionData.sessionDateKey;
      
      const newSession = {
        ...cleanedSessionData,
        ...(typeof sessionDateKey === 'string' && sessionDateKey.trim() !== '' ? {} : { sessionDateKey: this.localDateKey(new Date()) }),
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      const requestedSessionDateKey = cleanedSessionData.sessionDateKey;
      const mergeRequested = options?.merge === true;
      const existingDocSnapshot = await getDoc(docRef);
      const targetDocExists = existingDocSnapshot.exists();
      if (targetDocExists) {
        const existingDocData = existingDocSnapshot.data();
        const existingOwnerId = this.getSessionOwnerId(existingDocData);
        const existingPatientId = this.getSessionPatientId(existingDocData);
        const requestedOwnerId = cleanedSessionData.userId;
        const requestedPatientId = cleanedSessionData.patientId;
        const ownerMismatch =
          typeof requestedOwnerId === 'string' &&
          requestedOwnerId.trim() !== '' &&
          existingOwnerId !== null &&
          existingOwnerId !== requestedOwnerId;
        const patientMismatch =
          typeof requestedPatientId === 'string' &&
          requestedPatientId.trim() !== '' &&
          existingPatientId !== null &&
          existingPatientId !== requestedPatientId;

        if (ownerMismatch || patientMismatch) {
          const sessionsRef = collection(db, this.COLLECTION_NAME);
          const collisionSafeSession = {
            ...cleanedSessionData,
            ...(typeof requestedSessionDateKey === 'string' && requestedSessionDateKey.trim() !== '' ? {} : { sessionDateKey: this.localDateKey(new Date()) }),
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          const collisionSafeDocRef = await addDoc(sessionsRef, collisionSafeSession);
          const collisionSafeDocId = collisionSafeDocRef.id;
          return collisionSafeDocId;
        }
      }
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
        ...(typeof requestedSessionDateKey === 'string' && requestedSessionDateKey.trim() !== '' ? {} : { sessionDateKey: this.localDateKey(new Date()) }),
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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

  async dismissOpenResponsibility(sessionId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }
      const data = snapshot.data();
      const ownerId = this.getSessionOwnerId(data);
      if (ownerId !== userId) {
        throw new Error('Session does not belong to current user');
      }
      await updateDoc(docRef, {
        openResponsibilityDismissed: true,
        openResponsibilityDismissedAt: serverTimestamp(),
        openResponsibilityDismissedBy: userId,
        openResponsibilityDismissedReason: 'manual_dismissal_from_command_center',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[SessionService] dismissOpenResponsibility failed.');
      throw error;
    }
  }

  async getLatestFinalizedTreatmentDecision(
    patientId: string,
    userId: string
  ): Promise<TreatmentDecision | null> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        sessionsRef,
        where('patientId', '==', patientId),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      for (const sessionDoc of snapshot.docs) {
        const data = sessionDoc.data();
        const soapFinalized = data.soapStatus === 'finalized';
        const sessionKind = this.normalizeSessionKind(data.sessionType);
        const isFollowUp = sessionKind === 'followup';
        if (!soapFinalized || !isFollowUp) {
          continue;
        }
        const treatmentDecision = data.treatmentDecision;
        if (this.isTreatmentDecision(treatmentDecision)) {
          return treatmentDecision;
        }
      }
      return null;
    } catch (error) {
      console.warn('[SessionService] getLatestFinalizedTreatmentDecision failed; continuing with fallback plan hydration.', error);
      return null;
    }
  }

  async getInProgressSessions(userId: string): Promise<InProgressSessionSummary[]> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      // Include both in-progress and interrupted so Command Center shows "Resume" for interrupted
      const statuses = ['recording_in_progress', 'interrupted'] as const;
      const results: InProgressSessionRecord[] = [];
      for (const status of statuses) {
        const q = query(
          sessionsRef,
          where('userId', '==', userId),
          where('status', '==', status),
          limit(50)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(d => {
          const data = d.data();
          const sessionDateKey = this.resolveSessionDateKey(data);
          results.push({
            id: d.id,
            patientId: data.patientId || '',
            patientName: data.patientName || 'Unknown patient',
            sessionType: data.sessionType || 'followup',
            transcript: data.transcript || '',
            status,
            soapStatus: data.soapStatus || undefined,
            writeState: data.writeState || undefined,
            encounterId: data.encounterId || undefined,
            openResponsibilityDismissed: data.openResponsibilityDismissed === true,
            updatedAt: data.updatedAt,
            createdAt: data.createdAt,
            timestamp: data.timestamp,
            dateKey: sessionDateKey ?? undefined,
          });
        });
      }
      const completedSessionsQuery = query(
        sessionsRef,
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        limit(50)
      );
      const completedSnapshot = await getDocs(completedSessionsQuery);
      const completedSessionDocs = completedSnapshot.docs;
      const completedSessions: CompletedSessionRecord[] =
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
        const updatedAtMs = Math.max(
          this.timestampToMillis(session.updatedAt),
          this.timestampToMillis(session.createdAt),
          this.timestampToMillis(session.timestamp)
        );
        const current = latestFinalizedByPatientSessionType.get(key) ?? 0;
        if (updatedAtMs > current) {
          latestFinalizedByPatientSessionType.set(key, updatedAtMs);
        }
      }
      const consultationOwnershipFields = ['authorUid', 'ownerUid', 'userId'] as const;
      const consultationDocsById = new Map<string, Record<string, unknown>>();
      const consultationsRef = collection(db, 'consultations');
      for (const ownershipField of consultationOwnershipFields) {
        try {
          const consultationsQuery = query(
            consultationsRef,
            where(ownershipField, '==', userId),
            limit(200)
          );
          const consultationsSnapshot = await getDocs(consultationsQuery);
          for (const consultationDoc of consultationsSnapshot.docs) {
            const data = consultationDoc.data();
            consultationDocsById.set(consultationDoc.id, data);
          }
        } catch (_error) {
          console.warn('[SessionService] consultation closure query failed; continuing with available closure evidence.', {
            ownershipField,
          });
        }
      }
      const latestConsultationByPatientSessionType = new Map<string, number>();
      const latestConsultationByPatient = new Map<string, number>();
      for (const data of consultationDocsById.values()) {
        const patientId = data.patientId;
        if (typeof patientId !== 'string' || patientId.trim() === '') continue;
        const noteStatus = data.status;
        const hasSoapData = typeof data.soapData === 'object' && data.soapData !== null;
        const isFinalizedConsultation = noteStatus === 'finalized' || (noteStatus == null && hasSoapData);
        if (!isFinalizedConsultation) continue;
        const createdAtMs = this.timestampToMillis(data.createdAt);
        const currentPatientConsultation = latestConsultationByPatient.get(patientId) ?? 0;
        if (createdAtMs > currentPatientConsultation) {
          latestConsultationByPatient.set(patientId, createdAtMs);
        }
        const normalizedSessionType = this.normalizeSessionKind(data.visitType);
        if (normalizedSessionType == null) continue;
        const key = `${patientId}::${normalizedSessionType}`;
        const currentSessionTypeConsultation = latestConsultationByPatientSessionType.get(key) ?? 0;
        if (createdAtMs > currentSessionTypeConsultation) {
          latestConsultationByPatientSessionType.set(key, createdAtMs);
        }
      }
      const filteredResults = results.filter((session) => {
        if (session.openResponsibilityDismissed === true) return false;
        if (session.soapStatus === 'finalized') return false;
        if (session.writeState === 'fully_committed') return false;
        if (typeof session.encounterId === 'string' && session.encounterId.trim() !== '') return false;
        const normalizedSessionType = this.normalizeSessionKind(session.sessionType);
        const sessionTypeKey = normalizedSessionType ?? session.sessionType;
        const sessionKey = `${session.patientId}::${sessionTypeKey}`;
        const latestFinalizedAt = latestFinalizedByPatientSessionType.get(sessionKey) ?? 0;
        const latestConsultationAt = latestConsultationByPatientSessionType.get(sessionKey) ?? 0;
        const latestPatientConsultationAt = latestConsultationByPatient.get(session.patientId) ?? 0;
        const latestCompletedAt = Math.max(
          latestFinalizedAt,
          latestConsultationAt,
          latestPatientConsultationAt
        );
        const sessionUpdatedAt = Math.max(
          this.timestampToMillis(session.updatedAt),
          this.timestampToMillis(session.createdAt),
          this.timestampToMillis(session.timestamp)
        );
        const hasLaterCompletedRecord = latestCompletedAt > 0;
        const sessionIsOlderThanCompletion = sessionUpdatedAt <= latestCompletedAt;
        if (hasLaterCompletedRecord && sessionIsOlderThanCompletion) {
          return false;
        }
        return true;
      });
      const latestByPatientSessionType = new Map<string, InProgressSessionRecord>();
      for (const session of filteredResults) {
        const normalizedSessionType = this.normalizeSessionKind(session.sessionType);
        const sessionTypeKey = normalizedSessionType ?? session.sessionType;
        const dedupeKey = `${session.patientId}::${sessionTypeKey}`;
        const current = latestByPatientSessionType.get(dedupeKey);
        if (!current) {
          latestByPatientSessionType.set(dedupeKey, session);
          continue;
        }
        const sessionTime = Math.max(
          this.timestampToMillis(session.updatedAt),
          this.timestampToMillis(session.createdAt),
          this.timestampToMillis(session.timestamp)
        );
        const currentTime = Math.max(
          this.timestampToMillis(current.updatedAt),
          this.timestampToMillis(current.createdAt),
          this.timestampToMillis(current.timestamp)
        );
        if (sessionTime > currentTime) {
          latestByPatientSessionType.set(dedupeKey, session);
        }
      }
      const sorted = [...latestByPatientSessionType.values()].sort((a, b) => {
        const aT = Math.max(
          this.timestampToMillis(a.updatedAt),
          this.timestampToMillis(a.createdAt),
          this.timestampToMillis(a.timestamp)
        );
        const bT = Math.max(
          this.timestampToMillis(b.updatedAt),
          this.timestampToMillis(b.createdAt),
          this.timestampToMillis(b.timestamp)
        );
        return bT - aT;
      });
      return sorted.slice(0, 10).map((session) => {
        const updatedAtIso =
          this.timestampToIsoString(session.updatedAt) ??
          this.timestampToIsoString(session.createdAt) ??
          this.timestampToIsoString(session.timestamp);
        const sessionItem = {
          id: session.id,
          patientId: session.patientId,
          patientName: session.patientName,
          sessionType: session.sessionType,
          transcript: session.transcript,
          status: session.status,
          dateKey: session.dateKey,
          updatedAt: updatedAtIso,
        };
        return sessionItem;
      });
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
