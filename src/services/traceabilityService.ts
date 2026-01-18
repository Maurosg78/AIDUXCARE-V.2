/**
 * Traceability Service - PHIPA Compliant
 * 
 * Generates unique traceability numbers for patients, episodes, and notes
 * Ensures complete audit trail and compliance with Canadian healthcare regulations
 * 
 * Security audit logging:
 * - A.8.2.3: Handling of assets (unique identifiers)
 * - A.12.4.1: Event logging (all number generations logged)
 * 
 * PHIPA Compliance:
 * - Unique identifiers for complete patient traceability
 * - Canadian-only data processing
 * - Complete audit trail
 */

import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

// ✅ Security audit: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export interface TraceabilityNumber {
  patientTraceNumber: string; // AUX-{hospitalCode}-{uniqueNumber}
  episodeId: string; // EP-{date}-{sequence}
  noteId: string; // NT-{timestamp}-{uuid}
}

export interface PatientTraceRecord {
  patientTraceNumber: string; // AUX-HSC-789234
  hospitalCode: string; // HSC, TGH, etc.
  uniqueNumber: string; // 789234
  patientId?: string; // Link to main patient record if exists
  createdAt: Date | Timestamp;
  createdBy: string; // Physiotherapist ID
  hospitalId?: string;
  metadata: {
    admissionDate?: Date | Timestamp;
    dischargeDate?: Date | Timestamp;
    episodeType: 'inpatient' | 'outpatient' | 'mixed';
  };
  audit: {
    createdBy: string;
    lastModified: Date | Timestamp;
    accessLog: Array<{
      timestamp: Date | Timestamp;
      action: 'created' | 'accessed' | 'transferred' | 'discharged';
      userId: string;
      portal: 'inpatient' | 'outpatient';
    }>;
  };
}

export class TraceabilityService {
  private static readonly COLLECTION_NAME = 'patient_trace_numbers';
  
  /**
   * Generate unique hospital code from hospital name/ID
   */
  static generateHospitalCode(hospitalId: string, hospitalName?: string): string {
    // Use hospital ID if short, otherwise generate code from name
    if (hospitalId.length <= 6 && /^[A-Z0-9]+$/.test(hospitalId)) {
      return hospitalId.toUpperCase();
    }
    
    if (hospitalName) {
      // Generate code from name: "Hospital for Sick Children" -> "HSC"
      const words = hospitalName
        .split(' ')
        .filter(w => w.length > 2)
        .map(w => w[0].toUpperCase())
        .join('')
        .substring(0, 6);
      return words || 'HOSP';
    }
    
    // Fallback: use first 6 chars of hospitalId
    return hospitalId.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'HOSP';
  }

  /**
   * Generate unique number (6 digits)
   */
  private static async generateUniqueNumber(hospitalCode: string): Promise<string> {
    // Check existing numbers for this hospital
    const traceRef = collection(db, this.COLLECTION_NAME);
    const q = query(traceRef, where('hospitalCode', '==', hospitalCode));
    const snapshot = await getDocs(q);
    
    const existingNumbers = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data() as PatientTraceRecord;
      if (data.uniqueNumber) {
        existingNumbers.add(data.uniqueNumber);
      }
    });
    
    // Generate random 6-digit number until unique
    let attempts = 0;
    while (attempts < 100) {
      const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
      if (!existingNumbers.has(randomNum)) {
        return randomNum;
      }
      attempts++;
    }
    
    // Fallback: use timestamp-based number
    const timestampNum = Date.now().toString().slice(-6);
    return timestampNum;
  }

  /**
   * Generate patient trace number: AUX-{hospitalCode}-{uniqueNumber}
   */
  static async generatePatientTraceNumber(
    hospitalId: string,
    hospitalName?: string,
    physiotherapistId: string = 'system'
  ): Promise<string> {
    try {
      const hospitalCode = this.generateHospitalCode(hospitalId, hospitalName);
      const uniqueNumber = await this.generateUniqueNumber(hospitalCode);
      const patientTraceNumber = `AUX-${hospitalCode}-${uniqueNumber}`;

      // Save trace number record
      const traceRecord: Omit<PatientTraceRecord, 'createdAt' | 'audit'> & {
        createdAt: any;
        audit: {
          createdBy: string;
          lastModified: any;
          accessLog: any[];
        };
      } = {
        patientTraceNumber,
        hospitalCode,
        uniqueNumber,
        createdAt: serverTimestamp(),
        createdBy: physiotherapistId,
        hospitalId,
        metadata: {
          episodeType: 'inpatient',
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

      const traceRef = doc(db, this.COLLECTION_NAME, patientTraceNumber);
      await setDoc(traceRef, traceRecord);

      // ✅ Security audit: Log trace number generation
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'trace_number_generated',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          patientTraceNumber,
          hospitalCode,
          uniqueNumber,
          hospitalId,
          securityLevel: 'medium',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`[Traceability] Generated trace number: ${patientTraceNumber}`);
      return patientTraceNumber;
    } catch (error) {
      console.error('[Traceability] Error generating trace number:', error);
      throw new Error('Failed to generate trace number');
    }
  }

  /**
   * Generate episode ID: EP-{date}-{sequence}
   */
  static generateEpisodeId(date: Date = new Date(), sequence: number = 1): string {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const seqStr = sequence.toString().padStart(3, '0');
    return `EP-${dateStr}-${seqStr}`;
  }

  /**
   * Generate note ID: NT-{timestamp}-{uuid}
   */
  static generateNoteId(): string {
    const iso = new Date().toISOString();
    const timestamp = iso.slice(0, 19).replaceAll("-", "").replaceAll(":", "").replace("T", "");
    const uuid = Math.random().toString(36).substring(2, 8);
    return `NT-${timestamp}-${uuid}`;
  }

  /**
   * Get trace number record
   */
  static async getTraceRecord(patientTraceNumber: string): Promise<PatientTraceRecord | null> {
    try {
      const traceRef = doc(db, this.COLLECTION_NAME, patientTraceNumber);
      const snapshot = await getDoc(traceRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data() as PatientTraceRecord;
      return data;
    } catch (error) {
      console.error('[Traceability] Error getting trace record:', error);
      return null;
    }
  }

  /**
   * Link trace number to main patient record
   */
  static async linkToPatientRecord(
    patientTraceNumber: string,
    patientId: string,
    physiotherapistId: string
  ): Promise<boolean> {
    try {
      const traceRef = doc(db, this.COLLECTION_NAME, patientTraceNumber);
      await setDoc(traceRef, {
        patientId,
        'audit.lastModified': serverTimestamp(),
        'audit.accessLog': [
          {
            timestamp: serverTimestamp(),
            action: 'transferred',
            userId: physiotherapistId,
            portal: 'outpatient',
          },
        ],
      }, { merge: true });

      // ✅ Security audit: Log linking
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'trace_number_linked',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          patientTraceNumber,
          patientId,
          securityLevel: 'high',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error('[Traceability] Error linking trace number:', error);
      return false;
    }
  }

  /**
   * Log access to trace number
   */
  static async logAccess(
    patientTraceNumber: string,
    userId: string,
    portal: 'inpatient' | 'outpatient',
    action: 'accessed' | 'discharged' | 'transferred' = 'accessed'
  ): Promise<void> {
    try {
      const traceRef = doc(db, this.COLLECTION_NAME, patientTraceNumber);
      const traceSnap = await getDoc(traceRef);

      if (!traceSnap.exists()) {
        return;
      }

      const data = traceSnap.data() as PatientTraceRecord;
      await setDoc(traceRef, {
        'audit.lastModified': serverTimestamp(),
        'audit.accessLog': [
          ...(data.audit.accessLog || []),
          {
            timestamp: serverTimestamp(),
            action,
            userId,
            portal,
          },
        ],
      }, { merge: true });
    } catch (error) {
      console.error('[Traceability] Error logging access:', error);
    }
  }
}

export default TraceabilityService;

