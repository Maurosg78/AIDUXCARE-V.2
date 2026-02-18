/**
 * WO-METRICS-PILOT-01: Feature flag for telemetry (config/telemetry)
 * Default OFF. Kill switch. Fail-safe: if Firestore fails → OFF.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TelemetryConfig {
  enabled: boolean;
  sampleRate: number;
  enabledUserHashes?: string[];
}

const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: false,
  sampleRate: 1.0,
};

let cachedConfig: TelemetryConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 min

async function loadConfigFromFirestore(): Promise<TelemetryConfig> {
  if (!db) return DEFAULT_CONFIG;
  try {
    const snap = await getDoc(doc(db, 'config', 'telemetry'));
    if (!snap.exists()) return DEFAULT_CONFIG;
    const d = snap.data();
    return {
      enabled: d?.enabled === true,
      sampleRate: typeof d?.sampleRate === 'number' ? Math.max(0, Math.min(1, d.sampleRate)) : 1.0,
      enabledUserHashes: Array.isArray(d?.enabledUserHashes) ? d.enabledUserHashes : undefined,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function getTelemetryConfig(): Promise<TelemetryConfig> {
  const now = Date.now();
  if (cachedConfig !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }
  const config = await loadConfigFromFirestore();
  cachedConfig = config;
  cacheTimestamp = now;
  return config;
}

export function isTelemetryEnabledForUser(config: TelemetryConfig, userIdHash: string): boolean {
  if (!config.enabled) return false;
  // Si enabledUserHashes está definido (array): modo allowlist. [] = nadie (SAFE).
  if (Array.isArray(config.enabledUserHashes)) {
    return config.enabledUserHashes.includes(userIdHash);
  }
  // Si no hay allowlist: usar sampleRate
  return config.sampleRate >= 1 || Math.random() < config.sampleRate;
}
