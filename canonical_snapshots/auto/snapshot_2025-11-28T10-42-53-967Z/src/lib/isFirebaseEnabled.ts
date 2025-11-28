/**
 * Feature flag para habilitar integraciones Firebase en tests/app.
 * Mantener falso por defecto salvo que un test lo active explícitamente vía process.env.
 */
export function isFirebaseEnabled(): boolean {
  return process.env.AIDUX_FIREBASE_ENABLED === 'true';
}
export default isFirebaseEnabled;
