/**
 * WO-METRICS-01: Active Time Tracker
 * Counts activity time only (keydown, click, etc.), not tab-open time.
 * Idle threshold: 180s. Pauses when document is hidden.
 */

const IDLE_THRESHOLD_MS = 180_000; // 3 min
const HEARTBEAT_INTERVAL_MS = 45_000; // 45s

export type HeartbeatCallback = (activeSinceLastBeatMs: number) => void;

export class ActiveTimeTracker {
  private lastActivityAt = 0;
  private lastHeartbeatAt = 0;
  private lastHeartbeatActiveMs = 0;
  private activeAccumulatedMs = 0;
  private idleAccumulatedMs = 0;
  private sessionStartAt = 0;
  private isIdle = false;
  private isPaused = false;
  private lastTickAt = 0;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatCallback: HeartbeatCallback | null = null;

  private visibilityHandler = (): void => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible') {
      this.resume();
    } else {
      this.pause();
    }
  };

  start(): void {
    const now = Date.now();
    this.sessionStartAt = now;
    this.lastActivityAt = now;
    this.lastHeartbeatAt = now;
    this.lastTickAt = now;
    this.activeAccumulatedMs = 0;
    this.idleAccumulatedMs = 0;
    this.isIdle = false;
    this.isPaused = typeof document !== 'undefined' && document.visibilityState !== 'visible';

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  recordActivity(): void {
    const now = Date.now();
    if (this.isPaused) return;

    // Flush accumulated time since last tick
    this.flushToAccumulators(now);

    this.lastActivityAt = now;
    this.isIdle = false;
  }

  pause(): void {
    const now = Date.now();
    this.flushToAccumulators(now);
    this.isPaused = true;
  }

  resume(): void {
    const now = Date.now();
    this.lastTickAt = now;
    this.lastActivityAt = now;
    this.isPaused = false;
  }

  private flushToAccumulators(now: number): void {
    if (this.sessionStartAt === 0 || this.isPaused) return;

    const elapsed = now - this.lastTickAt;
    const periodStart = this.lastTickAt;
    this.lastTickAt = now;

    const transitionAt = this.lastActivityAt + IDLE_THRESHOLD_MS;
    if (now <= transitionAt) {
      this.activeAccumulatedMs += elapsed;
    } else if (periodStart >= transitionAt) {
      this.idleAccumulatedMs += elapsed;
      this.isIdle = true;
    } else {
      const activePart = transitionAt - periodStart;
      const idlePart = now - transitionAt;
      this.activeAccumulatedMs += activePart;
      this.idleAccumulatedMs += idlePart;
      this.isIdle = true;
    }
  }

  getActiveMs(): number {
    this.flushToAccumulators(Date.now());
    return Math.round(this.activeAccumulatedMs);
  }

  getIdleMs(): number {
    this.flushToAccumulators(Date.now());
    return Math.round(this.idleAccumulatedMs);
  }

  getTotalDurationMs(): number {
    if (this.sessionStartAt === 0) return 0;
    return Date.now() - this.sessionStartAt;
  }

  getActiveSinceLastBeatMs(): number {
    this.flushToAccumulators(Date.now());
    const current = this.activeAccumulatedMs;
    const delta = Math.max(0, current - this.lastHeartbeatActiveMs);
    this.lastHeartbeatActiveMs = current;
    return Math.round(delta);
  }

  reset(): void {
    this.stopHeartbeat();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.lastActivityAt = 0;
    this.lastHeartbeatAt = 0;
    this.lastHeartbeatActiveMs = 0;
    this.activeAccumulatedMs = 0;
    this.idleAccumulatedMs = 0;
    this.sessionStartAt = 0;
    this.lastTickAt = 0;
    this.isIdle = false;
    this.isPaused = false;
  }

  /**
   * Start heartbeat: every 45s, if activity recent, call callback with activeSinceLastBeatMs.
   * Does not cause React re-renders.
   */
  startHeartbeat(callback: HeartbeatCallback): void {
    this.stopHeartbeat();
    this.heartbeatCallback = callback;
    this.lastHeartbeatAt = Date.now();
    this.lastHeartbeatActiveMs = this.activeAccumulatedMs;

    this.heartbeatIntervalId = setInterval(() => {
      const sinceLastActivity = Date.now() - this.lastActivityAt;
      if (sinceLastActivity < IDLE_THRESHOLD_MS && this.heartbeatCallback) {
        const activeSince = this.getActiveSinceLastBeatMs();
        if (activeSince > 0) {
          this.heartbeatCallback(activeSince);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.heartbeatCallback = null;
  }

  /** Check if there was recent activity (for heartbeat decision) */
  hasRecentActivity(): boolean {
    return Date.now() - this.lastActivityAt < IDLE_THRESHOLD_MS;
  }
}
