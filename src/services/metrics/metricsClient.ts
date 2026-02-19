/**
 * WO-METRICS-00: Metrics client - calls metricsIngest Cloud Function
 * Auto-attaches appVersion, env, browserSessionId. Never sends UID.
 *
 * Uses fetch (HTTP) instead of Firebase Functions SDK to avoid
 * "Service functions is not available" in production builds.
 * Same pattern as FirebaseWhisperService.
 */

import { auth } from '@/lib/firebase';
import { APP_VERSION, APP_ENV } from '@/utils/buildInfo';
import { getOrCreateBrowserSessionId } from './sessionIds';

const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
const METRICS_INGEST_URL = `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/metricsIngest`;

const MAX_STRING_LENGTH = 64;
const FORBIDDEN_KEYS = new Set([
  'transcript', 'soap', 'text', 'note', 'subjective', 'objective',
  'assessment', 'plan', 'prompt', 'content', 'email', 'phone', 'name',
  'patientId', 'patient_id', 'uid', 'userId', 'user_id',
]);

function validatePayload(payload: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(payload)) {
    const key = k.toLowerCase();
    if (FORBIDDEN_KEYS.has(key)) {
      console.warn('[metrics] Rejected forbidden key:', k);
      return false;
    }
    if (typeof v === 'string' && v.length > MAX_STRING_LENGTH) {
      console.warn('[metrics] Rejected long string:', k);
      return false;
    }
  }
  return true;
}

export interface TrackPayload {
  eventName: string;
  workflowSessionId: string;
  visitType?: 'initial' | 'follow-up' | 'discharge';
  jurisdiction?: 'CA-ON';
  context?: { route?: string; tab?: string };
  metrics?: Record<string, number | boolean | string>;
}

/** Kill switch: when true, track() is a no-op (legacy metrics disabled). Use telemetry_sessions instead. */
const LEGACY_METRICS_DISABLED =
  import.meta.env.VITE_DISABLE_LEGACY_METRICS === 'true' || import.meta.env.VITE_DISABLE_LEGACY_METRICS === true;

/**
 * Track a metrics event via Cloud Function (HTTP fetch).
 * Non-blocking: never throws to caller.
 * Requires authenticated user (metricsIngest rejects unauthenticated).
 * No-op when VITE_DISABLE_LEGACY_METRICS=true (pilot: use telemetry_sessions only).
 */
export async function track(payload: TrackPayload): Promise<void> {
  if (LEGACY_METRICS_DISABLED) return;

  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return; // metricsIngest requires auth; skip silently
    }

    const { context, metrics, ...rest } = payload;
    // Strip schemaVersion from metrics — backend adds it; avoids 400 if backend whitelist mismatch
    const safeMetrics = metrics
      ? Object.fromEntries(Object.entries(metrics).filter(([k]) => k.toLowerCase() !== 'schemaversion'))
      : undefined;
    const fullPayload = {
      ...rest,
      appVersion: APP_VERSION,
      env: APP_ENV,
      browserSessionId: getOrCreateBrowserSessionId(),
      ...(context && { context }),
      ...(safeMetrics && Object.keys(safeMetrics).length > 0 && { metrics: safeMetrics }),
    };

    if (metrics && !validatePayload(metrics as Record<string, unknown>)) {
      return;
    }
    if (context && !validatePayload(context as Record<string, unknown>)) {
      return;
    }

    const idToken = await currentUser.getIdToken();
    const response = await fetch(METRICS_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data: fullPayload }),
      signal: AbortSignal.timeout(10000),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || json?.error) {
      const errMsg = json?.error?.message || json?.message || `HTTP ${response.status}`;
      console.warn('[metrics] track failed (non-blocking):', errMsg);
    }
  } catch (err) {
    console.warn('[metrics] track failed (non-blocking):', err);
  }
}
