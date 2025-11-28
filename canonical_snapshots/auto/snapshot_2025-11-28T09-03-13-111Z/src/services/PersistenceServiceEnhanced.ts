/**
 * Enhanced Persistence Service with Retry Logic and Backup Mechanisms
 * 
 * Sprint 2: Priority 2 - Data Integrity & Clinical Vault
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Local storage backup for failed saves
 * - Data integrity validation
 * - Monitoring and error tracking
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import PersistenceService, { SavedNote } from './PersistenceService';
import type { SOAPData } from './PersistenceService';

export interface PersistenceResult {
  success: boolean;
  noteId?: string;
  error?: string;
  retries?: number;
  usedBackup?: boolean;
}

export interface PersistenceOptions {
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  enableBackup?: boolean;
  validateBeforeSave?: boolean;
}

const DEFAULT_OPTIONS: Required<PersistenceOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enableBackup: true,
  validateBeforeSave: true,
};

/**
 * Validates SOAP data before saving
 */
function validateSOAPData(soapData: SOAPData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!soapData.subjective || soapData.subjective.trim().length === 0) {
    errors.push('Subjective section is required');
  }

  if (!soapData.objective || soapData.objective.trim().length === 0) {
    errors.push('Objective section is required');
  }

  if (!soapData.assessment || soapData.assessment.trim().length === 0) {
    errors.push('Assessment section is required');
  }

  if (!soapData.plan || soapData.plan.trim().length === 0) {
    errors.push('Plan section is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Saves SOAP note to local storage as backup
 */
function saveToLocalBackup(soapData: SOAPData, patientId: string, sessionId: string): string {
  try {
    const backupKey = `soap_backup_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const backupData = {
      soapData,
      patientId,
      sessionId,
      timestamp: new Date().toISOString(),
      retryAttempt: 0,
    };

    // Get existing backups
    const existingBackups = localStorage.getItem('soap_backups');
    const backups = existingBackups ? JSON.parse(existingBackups) : [];
    
    // Add new backup
    backups.push({
      key: backupKey,
      ...backupData,
    });

    // Keep only last 10 backups
    const trimmedBackups = backups.slice(-10);
    localStorage.setItem('soap_backups', JSON.stringify(trimmedBackups));
    localStorage.setItem(backupKey, JSON.stringify(backupData));

    console.log(`[PersistenceServiceEnhanced] Saved backup to localStorage: ${backupKey}`);
    return backupKey;
  } catch (error) {
    console.error('[PersistenceServiceEnhanced] Failed to save backup:', error);
    return '';
  }
}

/**
 * Attempts to restore from local backup
 */
async function restoreFromBackup(backupKey: string): Promise<PersistenceResult | null> {
  try {
    const backupDataStr = localStorage.getItem(backupKey);
    if (!backupDataStr) {
      return null;
    }

    const backupData = JSON.parse(backupDataStr);
    const result = await saveSOAPNoteWithRetry(
      backupData.soapData,
      backupData.patientId,
      backupData.sessionId,
      {
        maxRetries: 1, // Only one retry for backup restoration
        enableBackup: false, // Don't create backup of backup
      }
    );

    if (result.success) {
      // Remove backup after successful restoration
      localStorage.removeItem(backupKey);
      const backups = JSON.parse(localStorage.getItem('soap_backups') || '[]');
      const filteredBackups = backups.filter((b: any) => b.key !== backupKey);
      localStorage.setItem('soap_backups', JSON.stringify(filteredBackups));
      console.log(`[PersistenceServiceEnhanced] Successfully restored and removed backup: ${backupKey}`);
    }

    return result;
  } catch (error) {
    console.error('[PersistenceServiceEnhanced] Failed to restore from backup:', error);
    return null;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Saves SOAP note with automatic retry and backup mechanisms
 */
export async function saveSOAPNoteWithRetry(
  soapData: SOAPData,
  patientId: string = 'default-patient',
  sessionId: string = 'default-session',
  options: PersistenceOptions = {}
): Promise<PersistenceResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let backupKey: string | null = null;

  // Validate before saving
  if (opts.validateBeforeSave) {
    const validation = validateSOAPData(soapData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }
  }

  // Save to backup before attempting save
  if (opts.enableBackup) {
    backupKey = saveToLocalBackup(soapData, patientId, sessionId);
  }

  // Retry loop
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const noteId = await PersistenceService.saveSOAPNote(soapData, patientId, sessionId);
      
      // Success - remove backup if exists
      if (backupKey) {
        localStorage.removeItem(backupKey);
        const backups = JSON.parse(localStorage.getItem('soap_backups') || '[]');
        const filteredBackups = backups.filter((b: any) => b.key !== backupKey);
        localStorage.setItem('soap_backups', JSON.stringify(filteredBackups));
      }

      return {
        success: true,
        noteId,
        retries: attempt,
        usedBackup: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log retry attempt
      console.warn(`[PersistenceServiceEnhanced] Save attempt ${attempt + 1}/${opts.maxRetries + 1} failed:`, lastError.message);

      // If not last attempt, wait before retrying
      if (attempt < opts.maxRetries) {
        const delay = opts.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`[PersistenceServiceEnhanced] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Failed to save after all retries',
    retries: opts.maxRetries,
    usedBackup: !!backupKey,
  };
}

/**
 * Gets all pending backups from local storage
 */
export function getPendingBackups(): Array<{
  key: string;
  soapData: SOAPData;
  patientId: string;
  sessionId: string;
  timestamp: string;
}> {
  try {
    const backups = JSON.parse(localStorage.getItem('soap_backups') || '[]');
    return backups.map((b: any) => ({
      key: b.key,
      soapData: b.soapData,
      patientId: b.patientId,
      sessionId: b.sessionId,
      timestamp: b.timestamp,
    }));
  } catch (error) {
    console.error('[PersistenceServiceEnhanced] Failed to get backups:', error);
    return [];
  }
}

/**
 * Attempts to restore all pending backups
 */
export async function restoreAllBackups(): Promise<{
  total: number;
  restored: number;
  failed: number;
  results: Array<{ key: string; success: boolean; error?: string }>;
}> {
  const backups = getPendingBackups();
  const results: Array<{ key: string; success: boolean; error?: string }> = [];
  let restored = 0;
  let failed = 0;

  for (const backup of backups) {
    const result = await restoreFromBackup(backup.key);
    if (result?.success) {
      restored++;
      results.push({ key: backup.key, success: true });
    } else {
      failed++;
      results.push({
        key: backup.key,
        success: false,
        error: result?.error || 'Unknown error',
      });
    }
  }

  return {
    total: backups.length,
    restored,
    failed,
    results,
  };
}

/**
 * Validates data integrity of saved notes
 */
export async function validateDataIntegrity(): Promise<{
  isValid: boolean;
  issues: Array<{ noteId: string; issue: string }>;
}> {
  const issues: Array<{ noteId: string; issue: string }> = [];

  try {
    const notes = await PersistenceService.getAllNotes();

    for (const note of notes) {
      // Check required fields
      if (!note.id) {
        issues.push({ noteId: note.id || 'unknown', issue: 'Missing ID' });
      }

      if (!note.soapData) {
        issues.push({ noteId: note.id, issue: 'Missing SOAP data' });
        continue;
      }

      // Validate SOAP structure
      const validation = validateSOAPData(note.soapData);
      if (!validation.isValid) {
        issues.push({
          noteId: note.id,
          issue: `Invalid SOAP data: ${validation.errors.join(', ')}`,
        });
      }

      // Check encryption
      if (!note.encryptedData || !note.encryptedData.encryptedData) {
        issues.push({ noteId: note.id, issue: 'Missing encrypted data' });
      }

      // Check timestamps
      if (!note.createdAt) {
        issues.push({ noteId: note.id, issue: 'Missing createdAt timestamp' });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error('[PersistenceServiceEnhanced] Data integrity check failed:', error);
    return {
      isValid: false,
      issues: [{ noteId: 'system', issue: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
    };
  }
}

