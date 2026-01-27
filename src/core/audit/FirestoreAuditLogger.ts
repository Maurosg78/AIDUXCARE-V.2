import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

import { db } from '../firebase/firebaseClient';
import { auth } from '@/lib/firebase';
import { encryptMetadata, decryptMetadata, isEncrypted } from '../security/encryption';

import logger from '@/shared/utils/logger';

/**
 * Interfaz de un evento de auditoría clínica
 */
export interface AuditEvent {
  id?: string;
  type: string; // Ej: 'login', 'view_patient', 'edit_record', 'export_data', etc.
  userId: string;
  userRole: string;
  patientId?: string;
  visitId?: string;
  // Bloque 2: Campos opcionales para security audit (hospital portal)
  resourceType?: string; // Tipo de recurso accedido (ej: 'hospital_portal_note')
  resourceId?: string; // ID del recurso específico
  action?: string; // Acción realizada (ej: 'authenticate', 'view', 'edit')
  success?: boolean; // Indica si la acción fue exitosa
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Servicio de auditoría clínica enterprise sobre Firestore
 * Cumple HIPAA/GDPR: logging inmutable, trazabilidad, retención, cifrado, exportación y soporte para revisión externa.
 */
export class FirestoreAuditLogger {
  static collectionName = 'audit_logs';

  /**
   * Registra un evento de auditoría inmutable con cifrado de metadatos
   * Circuit breaker: auditoría nunca bloquea workflow clínico
   */
  static async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const currentUser = auth.currentUser;

      // Guard 1 — Auth aún no hidratada (race condition)
      if (!currentUser) {
        console.warn('[AuditLogger] Auth not ready — audit skipped (non-blocking)', {
          eventType: event.type,
        });
        return;
      }

      // Guard 2 — userId mismatch → corregir, no fallar
      let correctedEvent = event;
      if (event.userId !== currentUser.uid) {
        console.error('[AuditLogger] userId mismatch corrected', {
          eventUserId: event.userId,
          authUserId: currentUser.uid,
          eventType: event.type,
        });

        correctedEvent = {
          ...event,
          userId: currentUser.uid,
          metadata: {
            ...event.metadata,
            _userCorrected: true,
            _originalUserId: event.userId,
          },
        };
      }

      // Cifrar metadatos sensibles si existen
      let encryptedMetadata: string | undefined;
      if (correctedEvent.metadata) {
        encryptedMetadata = await encryptMetadata(JSON.stringify(correctedEvent.metadata));
      }

      // Best-effort write (NO throw)
      await addDoc(collection(db, this.collectionName), {
        ...correctedEvent,
        userId: currentUser.uid, // WO-FS-DATA-03: Always set from authenticated user
        metadata: encryptedMetadata, // Metadatos cifrados
        timestamp: Timestamp.now(),
        status: 'logged',
      });

    } catch (error: any) {
      // Circuit breaker — auditoría nunca rompe workflow
      console.error('[AuditLogger] Audit write failed (non-blocking)', {
        eventType: event?.type,
        message: error?.message,
      });
    }
  }

  /**
   * Obtiene eventos de auditoría filtrados por usuario, paciente, visita o tipo
   */
  static async getEvents({
    userId,
    patientId,
    visitId,
    type,
    limit = 100
  }: {
    userId?: string;
    patientId?: string;
    visitId?: string;
    type?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      // WO-FS-QUERY-01: Always filter by current user's userId for security
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Use current user's UID, ignore provided userId if different (security)
      const filterUserId = currentUser.uid;
      
      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', filterUserId)
      );
      if (patientId) q = query(q, where('patientId', '==', patientId));
      if (visitId) q = query(q, where('visitId', '==', visitId));
      if (type) q = query(q, where('type', '==', type));
      
      const snapshot = await getDocs(q);
      const events = await Promise.all(
        snapshot.docs.slice(0, limit).map(async (doc) => {
          const data = doc.data();
          let metadata = data.metadata;
          
          // Descifrar metadatos si están cifrados
          if (metadata && typeof metadata === 'string' && isEncrypted(metadata)) {
            try {
              const decrypted = await decryptMetadata(metadata);
              metadata = JSON.parse(decrypted);
            } catch (error) {
              console.error('Error descifrando metadatos:', error);
              metadata = { error: 'Failed to decrypt metadata' };
            }
          }
          
          return {
            id: doc.id,
            ...data,
            metadata,
            timestamp: data.timestamp?.toDate?.() || new Date()
          } as AuditEvent;
        })
      );
      
      return events;
    } catch (error) {
      console.error('Error getting audit events:', error);
      throw new Error(`Failed to get audit events: ${error}`);
    }
  }

  /**
   * Exporta todos los logs para revisión externa (auditoría Deloitte/Bureau Veritas)
   */
  static async exportAllLogs(): Promise<AuditEvent[]> {
    try {
      // WO-FS-QUERY-01: Only export logs for current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const events = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let metadata = data.metadata;
          
          // Descifrar metadatos si están cifrados
          if (metadata && typeof metadata === 'string' && isEncrypted(metadata)) {
            try {
              const decrypted = await decryptMetadata(metadata);
              metadata = JSON.parse(decrypted);
            } catch (error) {
              console.error('Error descifrando metadatos:', error);
              metadata = { error: 'Failed to decrypt metadata' };
            }
          }
          
          return {
            id: doc.id,
            ...data,
            metadata,
            timestamp: data.timestamp?.toDate?.() || new Date()
          } as AuditEvent;
        })
      );
      
      return events;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw new Error(`Failed to export audit logs: ${error}`);
    }
  }
}

/**
 * NOTA:
 * - Los logs son inmutables: no se permite edición ni borrado por diseño.
 * - Cumple retención mínima de 6 años (HIPAA): Firestore soporta políticas de retención y exportación.
 * - Los metadatos sensibles están cifrados con AES-256-GCM para cumplir HIPAA/GDPR.
 * - Este servicio es la base para trazabilidad, auditoría y cumplimiento enterprise.
 */ 