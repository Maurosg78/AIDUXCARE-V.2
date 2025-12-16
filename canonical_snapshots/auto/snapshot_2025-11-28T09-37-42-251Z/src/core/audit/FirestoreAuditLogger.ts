import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

import { db } from '../firebase/firebaseClient';
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
   */
  static async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      // Cifrar metadatos sensibles si existen
      let encryptedMetadata: string | undefined;
      if (event.metadata) {
        encryptedMetadata = await encryptMetadata(JSON.stringify(event.metadata));
      }

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...event,
        metadata: encryptedMetadata, // Metadatos cifrados
        timestamp: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw new Error(`Failed to log audit event: ${error}`);
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
      let q = query(collection(db, this.collectionName));
      if (userId) q = query(q, where('userId', '==', userId));
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
      const snapshot = await getDocs(collection(db, this.collectionName));
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