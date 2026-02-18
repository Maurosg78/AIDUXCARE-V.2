/**
 * WO-METRICS-PILOT-01: Telemetry session client for pilot metrics
 *
 * Tracks workflow events to telemetry_sessions (Firestore).
 * No PHI. Kill switch via config/telemetry.
 */

import { doc, setDoc, updateDoc, increment, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelemetryConfig, isTelemetryEnabledForUser } from './telemetryConfig';
import { pseudonymizeUserId } from '@/services/pseudonymizationService';

const SCHEMA_VERSION = 1;

function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** WO-SOAP-UX-02: Narrative metrics - internal only */
export interface NarrativeMetrics {
  narrativeCompressionRatio: number | null; // finalChars / originalTranscriptChars
  sectionLengthDeviation: { subjective: number; objective: number; assessment: number; plan: number };
  originalTranscriptChars: number;
  finalSoapChars: number;
}

export interface TelemetrySessionClient {
  start(workflowType: 'initial' | 'followup', userId: string): Promise<void>;
  finalize(reason: 'completed' | 'unload' | 'timeout'): Promise<void>;
  soapGenerateClicked(): Promise<void>;
  incValidationError(): Promise<void>;
  soapGenerateResult(success: boolean, latencyMs: number): Promise<void>;
  markBlockRendered(blockId: string, originalChars: number): Promise<void>;
  markBlockAccepted(
    blockId: string,
    mode: 'as_is' | 'after_edit',
    finalChars: number,
    deltaAdded: number,
    deltaRemoved: number
  ): Promise<void>;
  incRegenerate(): Promise<void>;
  /** WO-SOAP-UX-02: Record NCR + Section Length Deviation (internal metrics) */
  recordNarrativeMetrics(metrics: NarrativeMetrics): Promise<void>;
}

let _client: TelemetrySessionClient | null = null;

export function getTelemetrySessionClient(): TelemetrySessionClient {
  if (_client) return _client;

  let sessionDocId: string | null = null;
  let userIdHash: string | null = null;
  let enabled = false;

  async function ensureEnabled(userId: string): Promise<boolean> {
    if (!db) return false;
    try {
      const config = await getTelemetryConfig();
      const hash = await pseudonymizeUserId(userId);
      if (!isTelemetryEnabledForUser(config, hash)) return false;
      userIdHash = hash;
      enabled = true;
      return true;
    } catch {
      return false;
    }
  }

  async function start(workflowType: 'initial' | 'followup', userId: string): Promise<void> {
    if (!db) return;
    try {
      const ok = await ensureEnabled(userId);
      if (!ok || !userIdHash) return;

      sessionDocId = randomUUID();
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await setDoc(ref, {
        schemaVersion: SCHEMA_VERSION,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userIdHash,
        sessionId: sessionDocId,
        workflowType,
        finalized: false,
        endedReason: null,
        soapGenerateClickedCount: 0,
        soapGenerateSuccessCount: 0,
        soapGenerateFailureCount: 0,
        soapGenerateLatencyMsMax: 0,
        regenerateCount: 0,
        validationErrorCount: 0,
        blocks: {
          soap_subjective: { renderedCount: 0, acceptAsIsCount: 0, acceptAfterEditCount: 0, originalCharsTotal: 0, finalCharsTotal: 0, editDeltaAdded: 0, editDeltaRemoved: 0 },
          soap_objective: { renderedCount: 0, acceptAsIsCount: 0, acceptAfterEditCount: 0, originalCharsTotal: 0, finalCharsTotal: 0, editDeltaAdded: 0, editDeltaRemoved: 0 },
          soap_assessment: { renderedCount: 0, acceptAsIsCount: 0, acceptAfterEditCount: 0, originalCharsTotal: 0, finalCharsTotal: 0, editDeltaAdded: 0, editDeltaRemoved: 0 },
          soap_plan: { renderedCount: 0, acceptAsIsCount: 0, acceptAfterEditCount: 0, originalCharsTotal: 0, finalCharsTotal: 0, editDeltaAdded: 0, editDeltaRemoved: 0 },
        },
        narrativeCompressionRatio: null,
        sectionLengthDeviation: null,
      });
    } catch {
      /* silent */
    }
  }

  async function finalize(reason: 'completed' | 'unload' | 'timeout'): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await updateDoc(ref, {
        finalized: true,
        endedReason: reason,
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  async function soapGenerateClicked(): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await updateDoc(ref, {
        soapGenerateClickedCount: increment(1),
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  async function incValidationError(): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await updateDoc(ref, {
        validationErrorCount: increment(1),
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  async function soapGenerateResult(success: boolean, latencyMs: number): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        const currentMax = (data?.soapGenerateLatencyMsMax as number) ?? 0;
        const newMax = Math.max(currentMax, latencyMs);
        tx.update(ref, {
          updatedAt: Date.now(),
          [success ? 'soapGenerateSuccessCount' : 'soapGenerateFailureCount']: increment(1),
          soapGenerateLatencyMsMax: newMax,
        });
      });
    } catch {
      /* silent */
    }
  }

  async function markBlockRendered(blockId: string, originalChars: number): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      const blockKey = blockId.startsWith('soap_') ? blockId : `soap_${blockId}`;
      const snap = await getDoc(ref);
      const data = snap.data();
      const blocks = data?.blocks ?? {};
      const block = blocks[blockKey] ?? {
        renderedCount: 0,
        acceptAsIsCount: 0,
        acceptAfterEditCount: 0,
        originalCharsTotal: 0,
        finalCharsTotal: 0,
        editDeltaAdded: 0,
        editDeltaRemoved: 0,
      };
      await updateDoc(ref, {
        [`blocks.${blockKey}.renderedCount`]: (block.renderedCount ?? 0) + 1,
        [`blocks.${blockKey}.originalCharsTotal`]: originalChars,
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  async function markBlockAccepted(
    blockId: string,
    mode: 'as_is' | 'after_edit',
    finalChars: number,
    deltaAdded: number,
    deltaRemoved: number
  ): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      const blockKey = blockId.startsWith('soap_') ? blockId : `soap_${blockId}`;
      const snap = await getDoc(ref);
      const data = snap.data();
      const blocks = data?.blocks ?? {};
      const block = blocks[blockKey] ?? {};
      const acceptAsIs = (block.acceptAsIsCount ?? 0) + (mode === 'as_is' ? 1 : 0);
      const acceptAfterEdit = (block.acceptAfterEditCount ?? 0) + (mode === 'after_edit' ? 1 : 0);
      await updateDoc(ref, {
        [`blocks.${blockKey}.acceptAsIsCount`]: acceptAsIs,
        [`blocks.${blockKey}.acceptAfterEditCount`]: acceptAfterEdit,
        [`blocks.${blockKey}.finalCharsTotal`]: finalChars,
        [`blocks.${blockKey}.editDeltaAdded`]: (block.editDeltaAdded ?? 0) + deltaAdded,
        [`blocks.${blockKey}.editDeltaRemoved`]: (block.editDeltaRemoved ?? 0) + deltaRemoved,
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  async function incRegenerate(): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await updateDoc(ref, {
        regenerateCount: increment(1),
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  async function recordNarrativeMetrics(metrics: NarrativeMetrics): Promise<void> {
    if (!db || !sessionDocId || !enabled) return;
    try {
      const ref = doc(db, 'telemetry_sessions', sessionDocId);
      await updateDoc(ref, {
        narrativeCompressionRatio: metrics.narrativeCompressionRatio,
        sectionLengthDeviation: metrics.sectionLengthDeviation,
        originalTranscriptChars: metrics.originalTranscriptChars,
        finalSoapChars: metrics.finalSoapChars,
        updatedAt: Date.now(),
      });
    } catch {
      /* silent */
    }
  }

  _client = {
    start,
    finalize,
    soapGenerateClicked,
    incValidationError,
    soapGenerateResult,
    markBlockRendered,
    markBlockAccepted,
    incRegenerate,
    recordNarrativeMetrics,
  };

  return _client;
}
