/**
 * ✅ WO-CONSENT-VERBAL-NON-BLOCKING-01: Disclosure Service
 * 
 * Manages disclosure delivery separately from consent.
 * Disclosure is a compliance obligation, NOT a condition for consent validity.
 * 
 * Legal basis:
 * - PHIPA: Consent verbal es válido, disclosure es evidencia complementaria
 * - PIPEDA: "Meaningful consent" ≠ "written consent", pero debe haber acceso a información
 */

import { db } from '../lib/firebase';
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { SMSService } from './smsService';

export type DisclosureStatus = 'sent' | 'pending' | 'failed';
export type DisclosureChannel = 'email' | 'sms';

export interface DisclosureRecord {
  patientId: string;
  professionalId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  status: DisclosureStatus;
  channel: DisclosureChannel;
  documentVersion: string;
  attempts: number;
  lastAttemptAt: Timestamp | Date;
  lastError?: string;
  sentAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
}

export class DisclosureService {
  private static readonly COLLECTION_NAME = 'patient_disclosures';
  private static readonly DOCUMENT_VERSION = 'v1.0';

  /**
   * Attempt to deliver disclosure document to patient
   * This is NON-BLOCKING - consent is valid regardless of disclosure delivery status
   * 
   * @param patientId - Patient ID
   * @param professionalId - Professional ID
   * @param patientName - Patient name
   * @param preferredChannel - Preferred channel ('email' or 'sms')
   * @param patientEmail - Patient email (if available)
   * @param patientPhone - Patient phone (if available)
   * @returns Promise<DisclosureStatus> - Result of delivery attempt
   */
  static async attemptDisclosureDelivery(
    patientId: string,
    professionalId: string,
    patientName: string,
    preferredChannel: DisclosureChannel = 'email',
    patientEmail?: string,
    patientPhone?: string
  ): Promise<DisclosureStatus> {
    try {
      // Get existing disclosure record (if any)
      const existing = await this.getDisclosureRecord(patientId, professionalId);

      const attempts = existing ? existing.attempts + 1 : 1;

      // Try to send disclosure
      let status: DisclosureStatus = 'pending';
      let lastError: string | undefined;
      let sentAt: any = null;

      try {
        if (preferredChannel === 'email' && patientEmail) {
          // TODO: Implement email sending via Cloud Function
          // For now, mark as pending if email service not available
          console.log('[Disclosure] Email delivery not yet implemented, marking as pending', {
            patientId,
            patientEmail
          });
          status = 'pending';
        } else if (preferredChannel === 'sms' && patientPhone) {
          // Try SMS delivery
          try {
            await SMSService.sendDisclosureLink(
              patientPhone,
              patientName,
              patientId
            );
            status = 'sent';
            sentAt = serverTimestamp();
            console.log('[Disclosure] ✅ SMS disclosure sent successfully', {
              patientId,
              patientPhone
            });
          } catch (smsError: any) {
            status = 'failed';
            lastError = smsError?.message || 'SMS delivery failed';
            console.warn('[Disclosure] ❌ SMS delivery failed', {
              patientId,
              error: lastError
            });
          }
        } else {
          // No valid channel available
          status = 'pending';
          lastError = `No valid ${preferredChannel} channel available (email: ${!!patientEmail}, phone: ${!!patientPhone})`;
          console.warn('[Disclosure] ⚠️ No valid channel available', {
            patientId,
            preferredChannel,
            hasEmail: !!patientEmail,
            hasPhone: !!patientPhone
          });
        }
      } catch (error: any) {
        status = 'failed';
        lastError = error?.message || 'Unknown error during disclosure delivery';
        console.error('[Disclosure] ❌ Error during disclosure delivery', {
          patientId,
          error: lastError
        });
      }

      // Save disclosure record
      // Use separate object for Firestore to handle serverTimestamp() properly
      const disclosureRecord: any = {
        patientId,
        professionalId,
        patientName,
        patientEmail: patientEmail || null,
        patientPhone: patientPhone || null,
        status,
        channel: preferredChannel,
        documentVersion: this.DOCUMENT_VERSION,
        attempts,
        lastAttemptAt: serverTimestamp(),
        lastError: lastError || null,
        sentAt: sentAt || null,
      };

      // Only set createdAt if it's a new record
      if (!existing) {
        disclosureRecord.createdAt = serverTimestamp();
      }

      const disclosureRef = doc(db, this.COLLECTION_NAME, `${patientId}_${professionalId}`);
      await setDoc(disclosureRef, disclosureRecord, { merge: true });

      console.log('[Disclosure] Disclosure record saved', {
        patientId,
        status,
        attempts,
        channel: preferredChannel
      });

      return status;
    } catch (error: any) {
      console.error('[Disclosure] ❌ Error attempting disclosure delivery', {
        patientId,
        error: error?.message || 'Unknown error'
      });
      // Return 'failed' but don't throw - consent is still valid
      return 'failed';
    }
  }

  /**
   * Get disclosure record for a patient
   * 
   * @param patientId - Patient ID
   * @param professionalId - Professional ID
   * @returns Promise<DisclosureRecord | null>
   */
  static async getDisclosureRecord(
    patientId: string,
    professionalId: string
  ): Promise<DisclosureRecord | null> {
    try {
      const disclosureRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        disclosureRef,
        where('patientId', '==', patientId),
        where('professionalId', '==', professionalId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return doc.data() as DisclosureRecord;
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.code === 'missing-or-insufficient-permissions') {
        console.debug('[Disclosure] Permission error (expected if collection doesn\'t exist yet):', error.code);
        return null;
      }
      console.warn('[Disclosure] Error getting disclosure record:', error?.message || 'Unknown error');
      return null;
    }
  }

  /**
   * Check if patient has pending disclosure
   * Domain helper - does NOT block UI
   * 
   * @param patientId - Patient ID
   * @param professionalId - Professional ID
   * @returns Promise<boolean>
   */
  static async hasPendingDisclosure(
    patientId: string,
    professionalId: string
  ): Promise<boolean> {
    try {
      const record = await this.getDisclosureRecord(patientId, professionalId);
      if (!record) {
        return false;
      }
      return record.status === 'pending' || record.status === 'failed';
    } catch (error) {
      console.warn('[Disclosure] Error checking pending disclosure:', error);
      return false;
    }
  }

  /**
   * Retry disclosure delivery
   * 
   * @param patientId - Patient ID
   * @param professionalId - Professional ID
   * @param channel - Channel to use ('email' or 'sms')
   * @param patientEmail - Patient email (if available)
   * @param patientPhone - Patient phone (if available)
   * @returns Promise<DisclosureStatus>
   */
  static async retryDisclosure(
    patientId: string,
    professionalId: string,
    channel: DisclosureChannel,
    patientEmail?: string,
    patientPhone?: string
  ): Promise<DisclosureStatus> {
    try {
      const record = await this.getDisclosureRecord(patientId, professionalId);
      if (!record) {
        throw new Error('No disclosure record found');
      }

      return await this.attemptDisclosureDelivery(
        patientId,
        professionalId,
        record.patientName,
        channel,
        patientEmail || record.patientEmail,
        patientPhone || record.patientPhone
      );
    } catch (error: any) {
      console.error('[Disclosure] ❌ Error retrying disclosure:', {
        patientId,
        error: error?.message || 'Unknown error'
      });
      return 'failed';
    }
  }
}