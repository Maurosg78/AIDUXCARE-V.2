import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import logger from '@/shared/utils/logger';

export interface Episode {
  id: string;
  patientId: string;
  ownerUid: string;
  status: 'active' | 'completed' | 'cancelled';
  reason: string;
  diagnosis?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  expectedDuration?: number; // semanas
  currentWeek?: number;
  totalWeeks?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Objetivos y plan
  goals?: {
    shortTerm: string[];
    longTerm: string[];
    milestones: {
      description: string;
      targetDate: Timestamp;
      completed: boolean;
      completedAt?: Timestamp;
    }[];
  };
  
  // Progreso
  progress?: {
    painLevel?: number; // 0-10
    functionalScore?: number; // ODI, LEFS, etc.
    lastAssessment?: Timestamp;
  };
}

export interface EpisodeCreateData {
  patientId: string;
  ownerUid: string;
  reason: string;
  diagnosis?: string;
  startDate: Date;
  expectedDuration?: number;
  goals?: Episode['goals'];
}

class EpisodesRepository {
  private db = getFirestore();
  private collectionName = 'episodes';

  async getEpisodeById(id: string): Promise<Episode | null> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Episode;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo episodio:', error);
      throw error;
    }
  }

  async getActiveEpisodeByPatient(patientId: string): Promise<Episode | null> {
    try {
      const episodesRef = collection(this.db, this.collectionName);
      const q = query(
        episodesRef,
        where('patientId', '==', patientId),
        where('status', '==', 'active'),
        orderBy('startDate', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Episode;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo episodio activo:', error);
      throw error;
    }
  }

  async getEpisodesByPatient(patientId: string): Promise<Episode[]> {
    try {
      const episodesRef = collection(this.db, this.collectionName);
      const q = query(
        episodesRef,
        where('patientId', '==', patientId),
        orderBy('startDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Episode[];
    } catch (error) {
      console.error('Error obteniendo episodios:', error);
      throw error;
    }
  }

  async createEpisode(data: EpisodeCreateData): Promise<string> {
    try {
      const episodeData = {
        ...data,
        status: 'active' as const,
        startDate: Timestamp.fromDate(data.startDate),
        currentWeek: 1,
        totalWeeks: data.expectedDuration || 8,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(this.db, this.collectionName), episodeData);
      return docRef.id;
    } catch (error) {
      console.error('Error creando episodio:', error);
      throw error;
    }
  }

  async updateEpisode(id: string, updates: Partial<Episode>): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando episodio:', error);
      throw error;
    }
  }

  async completeEpisode(id: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        status: 'completed',
        endDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error completando episodio:', error);
      throw error;
    }
  }
}

export const episodesRepo = new EpisodesRepository();
