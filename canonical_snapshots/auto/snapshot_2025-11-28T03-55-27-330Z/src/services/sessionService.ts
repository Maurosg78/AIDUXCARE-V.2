import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ClinicalAttachment } from './clinicalAttachmentService';
import type { EvaluationTestEntry } from '../core/soap/PhysicalExamResultBuilder';

interface SessionData {
  userId: string;
  patientName: string;
  patientId: string;
  transcript: string;
  soapNote: any;
  physicalTests?: EvaluationTestEntry[]; // Fixed: Changed from any[] to EvaluationTestEntry[]
  timestamp?: any;
  status: 'draft' | 'completed';
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
}

class SessionService {
  private COLLECTION_NAME = 'sessions';

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
