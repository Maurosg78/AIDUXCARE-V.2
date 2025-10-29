export const trackComplianceEvent = (event: string, meta?: any) => {
  console.info("[COMPLIANCE EVENT]", event, meta || {});
};

// placeholder class so "Analytics" import in main.tsx" resolves
export class Analytics {
  static enable() { console.info("[Analytics] enabled"); }
  static init() { console.info("[Analytics] initialized"); }
}
