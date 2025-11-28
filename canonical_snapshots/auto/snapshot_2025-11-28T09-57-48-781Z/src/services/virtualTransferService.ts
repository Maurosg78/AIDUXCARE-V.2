/**
 * Virtual Transfer Service - PHIPA Compliant
 * 
 * Handles the virtual transfer process: changing access permissions
 * instead of moving data. This ensures compliance with PHIPA/PIPEDA
 * by maintaining a single Canadian database with multiple access views.
 * 
 * ISO 27001 Compliance:
 * - A.8.2.3: Handling of assets (transfer process)
 * - A.12.4.1: Event logging (all transfers logged)
 * 
 * PHIPA Compliance:
 * - No data duplication (single Canadian database)
 * - Virtual transfer (permission change only)
 * - Complete audit trail
 * - 100% Canadian data residency
 */

import EpisodeService, { EpisodeTransferResult } from './episodeService';
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

export interface TransferConfirmation {
  episodeId: string;
  patientTraceNumber: string;
  physiotherapistId: string;
  patientId?: string;
  confirmed: boolean;
}

export interface TransferVerification {
  success: boolean;
  episodeId: string;
  patientTraceNumber: string;
  notesTransferred: number;
  accessChanged: {
    from: 'inpatient';
    to: 'outpatient';
  };
  newAccessUrl: string;
}

export class VirtualTransferService {
  /**
   * Initiate virtual transfer process
   * This changes access permissions, NOT data location
   */
  static async initiateTransfer(
    episodeId: string,
    physiotherapistId: string,
    patientId?: string
  ): Promise<EpisodeTransferResult> {
    try {
      // Verify episode exists and is transferable
      const episode = await EpisodeService.getEpisode(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      if (episode.status === 'transferred') {
        throw new Error('Episode already transferred');
      }

      // Perform virtual transfer (changes access permissions)
      const result = await EpisodeService.virtualTransfer(
        episodeId,
        physiotherapistId,
        patientId
      );

      // ✅ ISO 27001 AUDIT: Log transfer initiation
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'virtual_transfer_initiated',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        metadata: {
          episodeId,
          patientTraceNumber: episode.patientTraceNumber,
          patientId,
          transferType: 'virtual', // No data movement
          dataLocation: 'Canada-Central (unchanged)',
          accessChanged: {
            from: 'inpatient',
            to: 'outpatient',
          },
          securityLevel: 'critical',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      return result;
    } catch (error) {
      console.error('[VirtualTransfer] Error initiating transfer:', error);
      
      // ✅ ISO 27001 AUDIT: Log error
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'virtual_transfer_failed',
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
   * Verify transfer completion
   */
  static async verifyTransfer(episodeId: string): Promise<TransferVerification> {
    try {
      const episode = await EpisodeService.getEpisode(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      if (episode.status !== 'transferred') {
        return {
          success: false,
          episodeId,
          patientTraceNumber: episode.patientTraceNumber,
          notesTransferred: episode.notes.count || 0,
          accessChanged: {
            from: 'inpatient',
            to: 'outpatient',
          },
          newAccessUrl: episode.access.outpatientUrl || '',
        };
      }

      // Verify access permissions changed correctly
      const accessChanged = 
        !episode.access.canAccessInpatient && 
        episode.access.canAccessOutpatient;

      return {
        success: accessChanged,
        episodeId,
        patientTraceNumber: episode.patientTraceNumber,
        notesTransferred: episode.notes.count || 0,
        accessChanged: {
          from: 'inpatient',
          to: 'outpatient',
        },
        newAccessUrl: episode.access.outpatientUrl || '',
      };
    } catch (error) {
      console.error('[VirtualTransfer] Error verifying transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer status for an episode
   */
  static async getTransferStatus(episodeId: string): Promise<{
    canTransfer: boolean;
    status: 'admitted' | 'discharged' | 'transferred';
    currentPortal: 'inpatient' | 'outpatient';
    accessUrl: string;
  }> {
    try {
      const episode = await EpisodeService.getEpisode(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      return {
        canTransfer: episode.status === 'admitted',
        status: episode.status,
        currentPortal: episode.access.currentPortal,
        accessUrl: episode.status === 'admitted'
          ? episode.access.inpatientUrl
          : episode.access.outpatientUrl || '',
      };
    } catch (error) {
      console.error('[VirtualTransfer] Error getting transfer status:', error);
      throw error;
    }
  }

  /**
   * Check if patient trace number can access inpatient portal
   */
  static async canAccessInpatient(patientTraceNumber: string): Promise<boolean> {
    try {
      const episode = await EpisodeService.getEpisodeByTraceNumber(patientTraceNumber);
      if (!episode) {
        return false;
      }

      return episode.access.canAccessInpatient && episode.status === 'admitted';
    } catch (error) {
      console.error('[VirtualTransfer] Error checking inpatient access:', error);
      return false;
    }
  }

  /**
   * Check if patient trace number can access outpatient portal
   */
  static async canAccessOutpatient(patientTraceNumber: string): Promise<boolean> {
    try {
      const episodes = await EpisodeService.getPatientEpisodes(patientTraceNumber);
      if (episodes.length === 0) {
        return false;
      }

      // Check if any episode is transferred or if patient exists in main system
      return episodes.some(ep => 
        ep.status === 'transferred' || ep.access.canAccessOutpatient
      );
    } catch (error) {
      console.error('[VirtualTransfer] Error checking outpatient access:', error);
      return false;
    }
  }

  /**
   * Get redirect URL based on episode status
   */
  static async getRedirectUrl(patientTraceNumber: string): Promise<{
    shouldRedirect: boolean;
    redirectUrl: string;
    reason: string;
  }> {
    try {
      const episode = await EpisodeService.getEpisodeByTraceNumber(patientTraceNumber);
      if (!episode) {
        return {
          shouldRedirect: false,
          redirectUrl: '',
          reason: 'Episode not found',
        };
      }

      // If transferred, redirect to outpatient portal
      if (episode.status === 'transferred' && episode.access.outpatientUrl) {
        return {
          shouldRedirect: true,
          redirectUrl: episode.access.outpatientUrl,
          reason: 'Episode transferred to outpatient portal',
        };
      }

      // If still admitted, allow inpatient access
      if (episode.status === 'admitted' && episode.access.canAccessInpatient) {
        return {
          shouldRedirect: false,
          redirectUrl: episode.access.inpatientUrl,
          reason: 'Episode still active in inpatient portal',
        };
      }

      return {
        shouldRedirect: false,
        redirectUrl: '',
        reason: 'No redirect needed',
      };
    } catch (error) {
      console.error('[VirtualTransfer] Error getting redirect URL:', error);
      return {
        shouldRedirect: false,
        redirectUrl: '',
        reason: 'Error checking status',
      };
    }
  }
}

export default VirtualTransferService;

