/**
 * WO-METRICS-00: Metrics client - calls metricsIngest Cloud Function
 * Auto-attaches appVersion, env, browserSessionId. Never sends UID.
 */

import { httpsCallable } from 'firebase/functions';
import { getFunctionsInstance } from '@/lib/firebase';
import { APP_VERSION, APP_ENV } from '@/utils/buildInfo';
import { getOrCreateBrowserSessionId } from './sessionIds';

const MAX_STRING_LENGTH = 64;
const FORBIDDEN_KEYS = new Set([
  'transcript', 'soap', 'text', 'note', 'subjective', 'objective',
  'assessment', 'plan', 'prompt', 'content', 'email', 'phone', 'name',
  'patientId', 'patient_id', 'uid', 'userId', 'user_id',
]);

let metricsIngestFn: ReturnType<typeof httpsCallable> | null = null;

function getMetricsIngest() {
  if (!metricsIngestFn) {
    const functions = getFunctionsInstance();
    metricsIngestFn = httpsCallable(functions, 'metricsIngest', { timeout: 10000 });
  }
  return metricsIngestFn;
}

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

/**
 * Track a metrics event via Cloud Function.
 * Non-blocking: never throws to caller.
 */
export async function track(payload: TrackPayload): Promise<void> {
  try {
    const { context, metrics, ...rest } = payload;
    const fullPayload = {
      ...rest,
      appVersion: APP_VERSION,
      env: APP_ENV,
      browserSessionId: getOrCreateBrowserSessionId(),
      ...(context && { context }),
      ...(metrics && { metrics }),
    };

    if (metrics && !validatePayload(metrics as Record<string, unknown>)) {
      return;
    }
    if (context && !validatePayload(context as Record<string, unknown>)) {
      return;
    }

    const fn = getMetricsIngest();
    await fn(fullPayload);
  } catch (err) {
    console.warn('[metrics] track failed (non-blocking):', err);
  }
}
