
// --- Normalizador de flag de emuladores (acepta ambos nombres .env) ---
function getUseEmulatorsFlag(): boolean {
  const fe = getUseEmulatorsFlag();
  const ue = getUseEmulatorsFlag();
  // Prioriza FIREBASE_USE_EMULATORS si existe; si no, usa USE_EMULATORS
  const raw = (fe !== undefined ? fe : ue) ?? 'false';
  const val = String(raw).toLowerCase().trim();
  return val === '1' || val === 'true' || val === 'yes';
}
