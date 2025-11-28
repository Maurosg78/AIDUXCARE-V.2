/**
 * Hook for automatic backup restoration
 * 
 * Sprint 2: Priority 2 - Data Integrity & Clinical Vault
 * 
 * Automatically attempts to restore pending backups when app loads
 * and periodically checks for failed saves.
 */

import { useEffect, useState } from 'react';
import { restoreAllBackups, getPendingBackups } from '../services/PersistenceServiceEnhanced';

export interface BackupRestorationStatus {
  isChecking: boolean;
  totalBackups: number;
  restored: number;
  failed: number;
  lastCheck: Date | null;
}

export function useBackupRestoration(autoRestore: boolean = true) {
  const [status, setStatus] = useState<BackupRestorationStatus>({
    isChecking: false,
    totalBackups: 0,
    restored: 0,
    failed: 0,
    lastCheck: null,
  });

  const checkAndRestore = async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const backups = getPendingBackups();
      setStatus(prev => ({ ...prev, totalBackups: backups.length }));

      if (backups.length === 0) {
        setStatus(prev => ({
          ...prev,
          isChecking: false,
          lastCheck: new Date(),
        }));
        return;
      }

      const result = await restoreAllBackups();

      setStatus({
        isChecking: false,
        totalBackups: result.total,
        restored: result.restored,
        failed: result.failed,
        lastCheck: new Date(),
      });

      // Log results
      if (result.restored > 0) {
        console.log(`[BackupRestoration] Successfully restored ${result.restored} backup(s)`);
      }
      if (result.failed > 0) {
        console.warn(`[BackupRestoration] Failed to restore ${result.failed} backup(s)`);
      }
    } catch (error) {
      console.error('[BackupRestoration] Error during restoration:', error);
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        lastCheck: new Date(),
      }));
    }
  };

  useEffect(() => {
    if (autoRestore) {
      // Check immediately on mount
      checkAndRestore();

      // Check every 5 minutes
      const interval = setInterval(() => {
        checkAndRestore();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRestore]);

  return {
    status,
    checkAndRestore,
  };
}

