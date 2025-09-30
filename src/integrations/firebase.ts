// Minimal alias for tests.
// Default to stubbed "disabled" firebase.
export const isFirebaseEnabled = false;
export const db: unknown = {};
export function getFunctions() { return {} as any; }
export default { db, getFunctions, isFirebaseEnabled };
