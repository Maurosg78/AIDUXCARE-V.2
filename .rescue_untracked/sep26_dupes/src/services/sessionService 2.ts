import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';

import { db } from '../lib/firebase';

interface SessionData {
  userId: string;
  patientName: string;
  patientId: string;
  transcript: string;
  soapNote: any;
  physicalTests?: any[];
  timestamp?: any;
  status: 'draft' | 'completed';
}

class SessionService {
  private COLLECTION_NAME = 'sessions';

  async createSession(sessionData: SessionData): Promise<string> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      const newSession = {
        ...sessionData,
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
}

export default new SessionService();
