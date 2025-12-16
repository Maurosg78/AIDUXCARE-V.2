/**
 * Data Erasure Service
 * 
 * Automated system for "Right to be Forgotten" requests (PIPEDA)
 * Handles complete deletion of patient data across all Firestore collections
 * while maintaining legal retention requirements and audit trails.
 * 
 * @compliance PIPEDA Principle 4.1.8 (Right to be Forgotten), PHIPA Section 52
 * @audit ISO 27001 A.8.2.3 (Handling of assets), A.12.4.1 (Management of technical vulnerabilities)
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  writeBatch,
  getDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreAuditLogger } from '../core/audit/FirestoreAuditLogger';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface ErasureRequest {
  patientId: string;
  requestedBy: string; // HIC (Health Information Custodian) user ID
  reason?: string;
  authorizationProof?: string; // Proof of patient authorization
}

export interface ErasureResult {
  success: boolean;
  patientId: string;
  deletedCollections: string[];
  deletedCounts: Record<string, number>;
  certificateId?: string;
  error?: string;
  timestamp: Date;
}

export interface DeletionCertificate {
  id: string;
  patientId: string;
  deletedAt: Date;
  deletedBy: string;
  deletedCollections: string[];
  deletedCounts: Record<string, number>;
  verificationHash: string;
  retainedData: {
    auditLogs: boolean; // Audit logs retained for legal compliance
    certificates: boolean; // Certificates retained for 10 years
  };
}

// Firestore collections that contain patient data
const PATIENT_DATA_COLLECTIONS = {
  notes: 'secureNotes', // Hospital portal notes
  episodes: 'episodes',
  consents: 'patientConsents',
  treatmentPlans: 'treatmentPlans',
  // Add more collections as needed
} as const;

// Collections that should NOT be deleted (legal retention)
const RETENTION_COLLECTIONS = {
  auditLogs: 'audit_logs', // Retained for 10 years
  deletionCertificates: 'deletion_certificates', // Retained for 10 years
} as const;

/**
 * Validates that the requester has authorization to delete patient data
 * 
 * @param patientId Patient ID
 * @param requestedBy User ID of requester
 * @returns true if authorized, false otherwise
 */
export async function verifyHICAuthorization(
  patientId: string,
  requestedBy: string
): Promise<boolean> {
  try {
    // TODO: Implement actual authorization check
    // This should verify that:
    // 1. The requester is the HIC (Health Information Custodian) for this patient
    // 2. The requester has proper authorization from the patient
    // 3. The authorization is valid and not expired
    
    // For now, return true (to be implemented with actual authorization logic)
    // In production, this should check:
    // - User role (must be HIC)
    // - Patient-HIC relationship
    // - Patient authorization document
    
    return true;
  } catch (error) {
    console.error('[DataErasure] Authorization check failed:', error);
    return false;
  }
}

/**
 * Checks if there are active legal holds on patient data
 * 
 * @param patientId Patient ID
 * @returns true if legal hold exists, false otherwise
 */
export async function checkLegalHold(patientId: string): Promise<boolean> {
  try {
    // TODO: Implement legal hold check
    // This should check if there are active legal holds that prevent deletion
    // Legal holds pause the retention clock and prevent deletion
    
    // For now, return false (no legal holds)
    // In production, this should check:
    // - Legal hold collection
    // - Active hold status
    // - Expiration dates
    
    return false;
  } catch (error) {
    console.error('[DataErasure] Legal hold check failed:', error);
    return false;
  }
}

/**
 * Checks if data retention requirements prevent deletion
 * 
 * @param patientId Patient ID
 * @returns true if retention requirements prevent deletion, false otherwise
 */
export async function checkRetentionRequirements(patientId: string): Promise<boolean> {
  try {
    // TODO: Implement retention requirement check
    // PIPEDA/PHIPA require retention of certain data for specific periods
    // Clinical notes: 7 years minimum
    // Audit logs: 10 years minimum
    
    // For now, return false (no retention requirements blocking deletion)
    // In production, this should check:
    // - Creation dates of records
    // - Retention policies
    // - Legal requirements
    
    return false;
  } catch (error) {
    console.error('[DataErasure] Retention check failed:', error);
    return false;
  }
}

/**
 * Validates an erasure request before processing
 * 
 * @param request Erasure request
 * @returns Validation result
 */
export async function validateErasureRequest(
  request: ErasureRequest
): Promise<{ valid: boolean; error?: string }> {
  // Check authorization
  const authorized = await verifyHICAuthorization(request.patientId, request.requestedBy);
  if (!authorized) {
    return {
      valid: false,
      error: 'Unauthorized: Requester does not have authorization to delete this patient\'s data'
    };
  }

  // Check legal holds
  const hasLegalHold = await checkLegalHold(request.patientId);
  if (hasLegalHold) {
    return {
      valid: false,
      error: 'Legal hold active: Cannot delete data while legal hold is in effect'
    };
  }

  // Check retention requirements
  const retentionBlocked = await checkRetentionRequirements(request.patientId);
  if (retentionBlocked) {
    return {
      valid: false,
      error: 'Retention requirements: Data cannot be deleted due to legal retention requirements'
    };
  }

  return { valid: true };
}

/**
 * Deletes all documents from a collection that match a patient ID
 * 
 * @param collectionName Collection name
 * @param patientId Patient ID
 * @returns Number of documents deleted
 */
async function deleteFromCollection(
  collectionName: string,
  patientId: string
): Promise<number> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }

    // Use batch delete for efficiency (Firestore limit: 500 operations per batch)
    const batch = writeBatch(db);
    let deletedCount = 0;
    const batchSize = 500;

    snapshot.docs.forEach((docSnapshot, index) => {
      if (index < batchSize) {
        batch.delete(docSnapshot.ref);
        deletedCount++;
      }
    });

    await batch.commit();

    // If there are more documents, delete them in additional batches
    if (snapshot.docs.length > batchSize) {
      const remainingDocs = snapshot.docs.slice(batchSize);
      for (let i = 0; i < remainingDocs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = remainingDocs.slice(i, i + batchSize);
        batchDocs.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
          deletedCount++;
        });
        await batch.commit();
      }
    }

    return deletedCount;
  } catch (error) {
    console.error(`[DataErasure] Error deleting from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Deletes patient data from all relevant collections
 * 
 * @param patientId Patient ID
 * @returns Record of deleted counts per collection
 */
async function performBatchDeletion(patientId: string): Promise<Record<string, number>> {
  const deletedCounts: Record<string, number> = {};

  // Delete from each patient data collection
  for (const [key, collectionName] of Object.entries(PATIENT_DATA_COLLECTIONS)) {
    try {
      const count = await deleteFromCollection(collectionName, patientId);
      deletedCounts[collectionName] = count;
    } catch (error) {
      console.error(`[DataErasure] Failed to delete from ${collectionName}:`, error);
      deletedCounts[collectionName] = 0;
    }
  }

  // Delete patient record itself (if exists in patients collection)
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);
    if (patientSnap.exists()) {
      await deleteDoc(patientRef);
      deletedCounts['patients'] = 1;
    }
  } catch (error) {
    console.error('[DataErasure] Failed to delete patient record:', error);
  }

  return deletedCounts;
}

/**
 * Deletes audit logs related to the patient (with legal retention handling)
 * 
 * @param patientId Patient ID
 * @returns Number of audit logs deleted
 */
async function deleteAuditLogs(patientId: string): Promise<number> {
  try {
    // Note: Audit logs are typically retained for legal compliance (10 years)
    // This function should only delete logs that are beyond retention period
    // For now, we'll mark them for deletion but retain them
    
    // TODO: Implement retention period check
    // Only delete audit logs older than retention period (10 years)
    
    // For immediate deletion requests, we'll log the deletion but retain the logs
    // This ensures compliance while respecting the right to be forgotten
    
    return 0; // No logs deleted (retained for legal compliance)
  } catch (error) {
    console.error('[DataErasure] Failed to delete audit logs:', error);
    return 0;
  }
}

/**
 * Deletes media files from Firebase Storage
 * 
 * @param patientId Patient ID
 * @returns Number of files deleted
 */
async function deleteMediaFiles(patientId: string): Promise<number> {
  try {
    const patientFilesRef = ref(storage, `patients/${patientId}`);
    
    // List all files in the patient's folder
    const listResult = await listAll(patientFilesRef);
    
    let deletedCount = 0;
    for (const itemRef of listResult.items) {
      try {
        await deleteObject(itemRef);
        deletedCount++;
      } catch (error) {
        console.error(`[DataErasure] Failed to delete file ${itemRef.fullPath}:`, error);
      }
    }

    // Delete files in subdirectories
    for (const prefixRef of listResult.prefixes) {
      const subListResult = await listAll(prefixRef);
      for (const itemRef of subListResult.items) {
        try {
          await deleteObject(itemRef);
          deletedCount++;
        } catch (error) {
          console.error(`[DataErasure] Failed to delete file ${itemRef.fullPath}:`, error);
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('[DataErasure] Failed to delete media files:', error);
    return 0;
  }
}

/**
 * Generates a verification hash for the deletion certificate
 * 
 * @param patientId Patient ID
 * @param deletedCounts Record of deleted counts
 * @param timestamp Deletion timestamp
 * @returns Verification hash
 */
async function generateHash(
  patientId: string,
  deletedCounts: Record<string, number>,
  timestamp: Date
): Promise<string> {
  // Simple hash generation (in production, use crypto.subtle.digest)
  const data = `${patientId}-${JSON.stringify(deletedCounts)}-${timestamp.toISOString()}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generates a deletion certificate
 * 
 * @param patientId Patient ID
 * @param deletedBy User ID who performed deletion
 * @param deletedCounts Record of deleted counts
 * @returns Deletion certificate
 */
async function generateDeletionCertificate(
  patientId: string,
  deletedBy: string,
  deletedCounts: Record<string, number>
): Promise<DeletionCertificate> {
  const deletedAt = new Date();
  const verificationHash = await generateHash(patientId, deletedCounts, deletedAt);

  const certificate: DeletionCertificate = {
    id: `cert-${patientId}-${Date.now()}`,
    patientId,
    deletedAt,
    deletedBy,
    deletedCollections: Object.keys(deletedCounts),
    deletedCounts,
    verificationHash,
    retainedData: {
      auditLogs: true, // Audit logs retained for legal compliance
      certificates: true, // Certificates retained for 10 years
    },
  };

  return certificate;
}

/**
 * Stores deletion certificate in Firestore
 * 
 * @param certificate Deletion certificate
 * @returns Certificate ID
 */
async function storeDeletionCertificate(certificate: DeletionCertificate): Promise<string> {
  try {
    const certificatesRef = collection(db, RETENTION_COLLECTIONS.deletionCertificates);
    const docRef = await addDoc(certificatesRef, {
      ...certificate,
      deletedAt: Timestamp.fromDate(certificate.deletedAt),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('[DataErasure] Failed to store deletion certificate:', error);
    throw error;
  }
}

/**
 * Processes a data erasure request
 * 
 * @param request Erasure request
 * @returns Erasure result
 */
export async function processErasureRequest(
  request: ErasureRequest
): Promise<ErasureResult> {
  const startTime = new Date();

  try {
    // Validate request
    const validation = await validateErasureRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        patientId: request.patientId,
        deletedCollections: [],
        deletedCounts: {},
        error: validation.error,
        timestamp: startTime,
      };
    }

    // Log erasure start
    await FirestoreAuditLogger.logEvent({
      type: 'data_erasure_started',
      userId: request.requestedBy,
      userRole: 'HIC',
      patientId: request.patientId,
      metadata: {
        reason: request.reason,
        timestamp: startTime.toISOString(),
      },
    });

    // Perform batch deletion
    const deletedCounts = await performBatchDeletion(request.patientId);

    // Delete media files
    const deletedFiles = await deleteMediaFiles(request.patientId);
    if (deletedFiles > 0) {
      deletedCounts['storage_files'] = deletedFiles;
    }

    // Handle audit logs (retained for legal compliance)
    const deletedAuditLogs = await deleteAuditLogs(request.patientId);
    if (deletedAuditLogs > 0) {
      deletedCounts['audit_logs'] = deletedAuditLogs;
    }

    // Generate deletion certificate
    const certificate = await generateDeletionCertificate(
      request.patientId,
      request.requestedBy,
      deletedCounts
    );

    // Store certificate
    const certificateId = await storeDeletionCertificate(certificate);

    // Log erasure completion
    await FirestoreAuditLogger.logEvent({
      type: 'data_erasure_completed',
      userId: request.requestedBy,
      userRole: 'HIC',
      patientId: request.patientId,
      metadata: {
        certificateId,
        deletedCounts,
        verificationHash: certificate.verificationHash,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      patientId: request.patientId,
      deletedCollections: Object.keys(deletedCounts),
      deletedCounts,
      certificateId,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log erasure failure
    await FirestoreAuditLogger.logEvent({
      type: 'data_erasure_failed',
      userId: request.requestedBy,
      userRole: 'HIC',
      patientId: request.patientId,
      metadata: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: false,
      patientId: request.patientId,
      deletedCollections: [],
      deletedCounts: {},
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Retrieves a deletion certificate by ID
 * 
 * @param certificateId Certificate ID
 * @returns Deletion certificate or null if not found
 */
export async function getDeletionCertificate(
  certificateId: string
): Promise<DeletionCertificate | null> {
  try {
    const certificateRef = doc(db, RETENTION_COLLECTIONS.deletionCertificates, certificateId);
    const certificateSnap = await getDoc(certificateRef);
    
    if (!certificateSnap.exists()) {
      return null;
    }

    const data = certificateSnap.data();
    return {
      ...data,
      deletedAt: data.deletedAt?.toDate() || new Date(),
    } as DeletionCertificate;
  } catch (error) {
    console.error('[DataErasure] Failed to retrieve deletion certificate:', error);
    return null;
  }
}

/**
 * Checks if a patient's data has been deleted
 * 
 * @param patientId Patient ID
 * @returns true if patient data has been deleted, false otherwise
 */
export async function isPatientDeleted(patientId: string): Promise<boolean> {
  try {
    const certificatesRef = collection(db, RETENTION_COLLECTIONS.deletionCertificates);
    const q = query(certificatesRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('[DataErasure] Failed to check deletion status:', error);
    return false;
  }
}

