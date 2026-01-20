import { 
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
import { db as sharedDb, auth } from "@/lib/firebase";

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
  private db = sharedDb;
  private collectionName = 'episodes';

  // WO-FS-QUERY-01: Get current user UID for ownership filtering
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  async getEpisodeById(id: string): Promise<Episode | null> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Episode;
        // WO-FS-QUERY-01: Verify ownership before returning
        const currentUserId = this.getCurrentUserId();
        if (data.ownerUid !== currentUserId) {
          return null; // Document doesn't belong to current user
        }
        return { id: docSnap.id, ...data };
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo episodio:', error);
      throw error;
    }
  }

  async getActiveEpisodeByPatient(patientId: string): Promise<Episode | null> {
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUserId = this.getCurrentUserId();
      const episodesRef = collection(this.db, this.collectionName);
      const q = query(
        episodesRef,
        where('patientId', '==', patientId),
        where('status', '==', 'active'),
        where('ownerUid', '==', currentUserId),
        orderBy('startDate', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Episode;
      }
      
      return null;
    } catch (error: any) {
      // Si el índice está en construcción, retornar null en lugar de lanzar error
      // Esto permite que el componente se renderice mientras el índice se construye
      if (error?.code === 'failed-precondition' && error?.message?.includes('index is currently building')) {
        console.warn('Índice de episodes en construcción, retornando null temporalmente');
        return null;
      }
      console.error('Error obteniendo episodio activo:', error);
      throw error;
    }
  }

  async getEpisodesByPatient(patientId: string): Promise<Episode[]> {
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUserId = this.getCurrentUserId();
      const episodesRef = collection(this.db, this.collectionName);
      const q = query(
        episodesRef,
        where('patientId', '==', patientId),
        where('ownerUid', '==', currentUserId),
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
      // WO-FS-DATA-03: Enforce ownership on all Firestore writes
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Missing authenticated user for ownership');
      }
      
      // Ensure ownerUid is set from authenticated user (fail fast if missing)
      const episodeData = {
        ...data,
        ownerUid: data.ownerUid || currentUserId, // Use provided or fallback to current user
        status: 'active' as const,
        startDate: Timestamp.fromDate(data.startDate),
        currentWeek: 1,
        totalWeeks: data.expectedDuration || 8,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // WO-FS-DATA-03: Final validation - ownerUid must be present
      if (!episodeData.ownerUid) {
        throw new Error('Missing ownerUid: cannot create episode without ownership');
      }
      
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
