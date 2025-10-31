/**
 * AiDuxCare — MetricsService mock for CI & UI test stability
 */
export async function track(event: string, metadata: Record<string, any> = {}) {
  console.log("[Metrics] tracking:", event, metadata);
}
