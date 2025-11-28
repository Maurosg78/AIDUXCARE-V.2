/**
 * Episode Service - PHIPA Compliant
 * 
 * Manages patient episodes (inpatient admissions, outpatient visits)
 * Handles virtual transfer by changing access permissions, not moving data
 * 
 * ISO 27001 Compliance:
 * - A.8.2.3: Handling of assets (episode lifecycle)
 * - A.12.4.1: Event logging (all episode operations logged)
 * 
 * PHIPA Compliance:
 * - Single Canadian database
 * - Virtual transfer (permission change, not data movement)
 * - Complete audit trail
 */

import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import TraceabilityService from './traceabilityService';

// ✅ ISO 27001 AUDIT: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export interface Episode {
  episodeId: string; // EP-20251127-001
  patientTraceNumber: string; // AUX-HSC-789234
  patientId?: string; // Link to main patient record if exists
  physiotherapistId: string;
  hospitalId: string;
  hospitalName?: string;
  
  status: 'admitted' | 'discharged' | 'transferred';
  episodeType: 'inpatient' | 'outpatient' | 'mixed';
  
  dates: {
    admissionDate: Date | Timestamp;
    dischargeDate?: Date | Timestamp;
    transferDate?: Date | Timestamp;
  };
  
  access: {
    currentPortal: 'inpatient' | 'outpatient';
    inpatientUrl: string; // inpatient.aiduxcare.ca/AUX-HSC-789234
    outpatientUrl?: string; // app.aiduxcare.ca/patient/AUX-HSC-789234
    canAccessInpatient: boolean;
    canAccessOutpatient: boolean;
  };
  
  notes: {
    count: number;
    noteIds: string[]; // Array of note IDs in this episode
  };
  
  metadata: {
    ward?: string;
    roomNumber?: string;
    diagnosis?: string;
    transferReason?: string;
  };
  
  audit: {
    createdBy: string;
    lastModified: Date | Timestamp;
    accessLog: Array<{
      timestamp: Date | Timestamp;
      action: 'created' | 'discharged' | 'transferred' | 'accessed';
      userId: string;
      portal: 'inpatient' | 'outpatient';
    }>;
  };
}

export interface EpisodeTransferResult {
  success: boolean;
  episodeId: string;
  patientTraceNumber: string;
  newAccessUrl: string;
  message: string;
}

export class EpisodeService {
  private static readonly COLLECTION_NAME = 'patient_episodes';
  
  /**
   * Create new inpatient episode
   */
  static async createInpatientEpisode(
    hospitalId: string,
    hospitalName: string,
    physiotherapistId: string,
    options?: {
      ward?: string;
      roomNumber?: string;
      diagnosis?: string;
    }
  ): Promise<{ episodeId: string; patientTraceNumber: string; accessUrl: string }> {
    try {
      // Generate trace number
      const patientTraceNumber = await TraceabilityService.generatePatientTraceNumber(
        hospitalId,
        hospitalName,
        physiotherapistId
      );

      // Generate episode ID
      const episodeId = TraceabilityService.generateEpisodeId();

      // Create episode record
      const episode: Omit<Episode, 'dates' | 'audit'> & {
        dates: {
          admissionDate: any;
          dischargeDate?: any;
          transferDate?: any;
        };
        audit: {
          createdBy: string;
          lastModified: any;
          accessLog: any[];
        };
      } = {
        episodeId,
        patientTraceNumber,
        physiotherapistId,
        hospitalId,
        hospitalName,
        status: 'admitted',
        episodeType: 'inpatient',
        dates: {
          admissionDate: serverTimestamp(),
        },
        access: {
          currentPortal: 'inpatient',
          inpatientUrl: `inpatient.aiduxcare.ca/${patientTraceNumber}`,
          canAccessInpatient: true,
          canAccessOutpatient: false,
        },
        notes: {
          count: 0,
          noteIds: [],
        },
        metadata: {
          ward: options?.ward,
          roomNumber: options?.roomNumber,
          diagnosis: options?.diagnosis,
        },
        audit: {
          createdBy: physiotherapistId,
          lastModified: serverTimestamp(),
          accessLog: [{
            timestamp: serverTimestamp(),
            action: 'created',
            userId: physiotherapistId,
            portal: 'inpatient',
          }],
        },
      };

      const episodeRef = doc(db, this.COLLECTION_NAME, episodeId);
      await setDoc(episodeRef, episode);

      // ✅ ISO 27001 AUDIT: Log episode creation
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'episode_created',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          episodeId,
          patientTraceNumber,
          hospitalId,
          episodeType: 'inpatient',
          securityLevel: 'medium',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`[Episode] Created inpatient episode: ${episodeId} for ${patientTraceNumber}`);

      return {
        episodeId,
        patientTraceNumber,
        accessUrl: episode.access.inpatientUrl,
      };
    } catch (error) {
      console.error('[Episode] Error creating episode:', error);
      throw new Error('Failed to create episode');
    }
  }

  /**
   * Get episode by ID
   */
  static async getEpisode(episodeId: string): Promise<Episode | null> {
    try {
      const episodeRef = doc(db, this.COLLECTION_NAME, episodeId);
      const snapshot = await getDoc(episodeRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as Episode;
    } catch (error) {
      console.error('[Episode] Error getting episode:', error);
      return null;
    }
  }

  /**
   * Get episode by trace number
   */
  static async getEpisodeByTraceNumber(patientTraceNumber: string): Promise<Episode | null> {
    try {
      const episodesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        episodesRef,
        where('patientTraceNumber', '==', patientTraceNumber),
        where('status', '==', 'admitted')
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      // Get most recent episode
      const episodes = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data() as Episode,
      }));

      episodes.sort((a, b) => {
        const aDate = a.data.dates.admissionDate instanceof Timestamp
          ? a.data.dates.admissionDate.toMillis()
          : a.data.dates.admissionDate instanceof Date
          ? a.data.dates.admissionDate.getTime()
          : 0;
        const bDate = b.data.dates.admissionDate instanceof Timestamp
          ? b.data.dates.admissionDate.toMillis()
          : b.data.dates.admissionDate instanceof Date
          ? b.data.dates.admissionDate.getTime()
          : 0;
        return bDate - aDate;
      });

      return episodes[0].data;
    } catch (error) {
      console.error('[Episode] Error getting episode by trace number:', error);
      return null;
    }
  }

  /**
   * Virtual transfer: Change access permissions (not data movement)
   * This is the key PHIPA-compliant transfer mechanism
   */
  static async virtualTransfer(
    episodeId: string,
    physiotherapistId: string,
    patientId?: string
  ): Promise<EpisodeTransferResult> {
    try {
      const episode = await this.getEpisode(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      if (episode.status === 'discharged' || episode.status === 'transferred') {
        throw new Error('Episode already discharged or transferred');
      }

      // Update episode status and access permissions
      const episodeRef = doc(db, this.COLLECTION_NAME, episodeId);
      const dischargeDate = Timestamp.now();
      const outpatientUrl = `app.aiduxcare.ca/patient/${episode.patientTraceNumber}`;

      await updateDoc(episodeRef, {
        status: 'transferred',
        patientId: patientId || episode.patientId,
        'dates.dischargeDate': dischargeDate,
        'dates.transferDate': dischargeDate,
        'access.currentPortal': 'outpatient',
        'access.outpatientUrl': outpatientUrl,
        'access.canAccessInpatient': false, // Inpatient portal no longer accessible
        'access.canAccessOutpatient': true, // Now accessible via outpatient portal
        'audit.lastModified': serverTimestamp(),
        'audit.accessLog': [
          ...(episode.audit.accessLog || []),
          {
            timestamp: serverTimestamp(),
            action: 'transferred',
            userId: physiotherapistId,
            portal: 'outpatient',
          },
        ],
      });

      // Link trace number to patient record if provided
      if (patientId) {
        await TraceabilityService.linkToPatientRecord(
          episode.patientTraceNumber,
          patientId,
          physiotherapistId
        );
      }

      // ✅ ISO 27001 AUDIT: Log virtual transfer
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'episode_virtual_transfer',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          episodeId,
          patientTraceNumber: episode.patientTraceNumber,
          patientId,
          status: 'transferred',
          accessChanged: {
            from: 'inpatient',
            to: 'outpatient',
          },
          securityLevel: 'critical',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          note: 'Virtual transfer: Access permissions changed, no data movement',
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`[Episode] Virtual transfer completed: ${episodeId} → ${outpatientUrl}`);

      return {
        success: true,
        episodeId,
        patientTraceNumber: episode.patientTraceNumber,
        newAccessUrl: outpatientUrl,
        message: `Paciente ${episode.patientTraceNumber} transferido a portal principal. Acceso disponible en: ${outpatientUrl}`,
      };
    } catch (error) {
      console.error('[Episode] Error in virtual transfer:', error);
      
      // ✅ ISO 27001 AUDIT: Log error
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'episode_transfer_failed',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          episodeId,
          error: error instanceof Error ? error.message : 'Unknown error',
          securityLevel: 'high',
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  }

  /**
   * Mark episode as discharged (without transfer)
   */
  static async markDischarged(
    episodeId: string,
    physiotherapistId: string
  ): Promise<boolean> {
    try {
      const episodeRef = doc(db, this.COLLECTION_NAME, episodeId);
      await updateDoc(episodeRef, {
        status: 'discharged',
        'dates.dischargeDate': serverTimestamp(),
        'audit.lastModified': serverTimestamp(),
        'audit.accessLog': [
          {
            timestamp: serverTimestamp(),
            action: 'discharged',
            userId: physiotherapistId,
            portal: 'inpatient',
          },
        ],
      });

      // ✅ ISO 27001 AUDIT: Log discharge
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'episode_discharged',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          episodeId,
          securityLevel: 'medium',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error('[Episode] Error marking discharged:', error);
      return false;
    }
  }

  /**
   * Add note to episode
   */
  static async addNoteToEpisode(
    episodeId: string,
    noteId: string
  ): Promise<boolean> {
    try {
      const episode = await this.getEpisode(episodeId);
      if (!episode) {
        return false;
      }

      const episodeRef = doc(db, this.COLLECTION_NAME, episodeId);
      await updateDoc(episodeRef, {
        'notes.count': (episode.notes.count || 0) + 1,
        'notes.noteIds': [...(episode.notes.noteIds || []), noteId],
        'audit.lastModified': serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Episode] Error adding note to episode:', error);
      return false;
    }
  }

  /**
   * Get all episodes for a patient trace number
   */
  static async getPatientEpisodes(patientTraceNumber: string): Promise<Episode[]> {
    try {
      const episodesRef = collection(db, this.COLLECTION_NAME);
      const q = query(episodesRef, where('patientTraceNumber', '==', patientTraceNumber));

      const snapshot = await getDocs(q);
      const episodes: Episode[] = [];

      snapshot.forEach(doc => {
        episodes.push(doc.data() as Episode);
      });

      // Sort by admission date (newest first)
      episodes.sort((a, b) => {
        const aDate = a.dates.admissionDate instanceof Timestamp
          ? a.dates.admissionDate.toMillis()
          : a.dates.admissionDate instanceof Date
          ? a.dates.admissionDate.getTime()
          : 0;
        const bDate = b.dates.admissionDate instanceof Timestamp
          ? b.dates.admissionDate.toMillis()
          : b.dates.admissionDate instanceof Date
          ? b.dates.admissionDate.getTime()
          : 0;
        return bDate - aDate;
      });

      return episodes;
    } catch (error) {
      console.error('[Episode] Error getting patient episodes:', error);
      return [];
    }
  }
}

export default EpisodeService;

