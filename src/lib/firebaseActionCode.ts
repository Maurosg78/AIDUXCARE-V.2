// @ts-nocheck
// src/lib/firebaseActionCode.ts
import type { ActionCodeSettings } from 'firebase/auth';

// Unica fuente de verdad. Nunca uses window.location.origin aquí.
export function getEmailVerificationSettings(): ActionCodeSettings {
  // Preferir URL pública declarada por entorno UAT
  // Ejemplo esperado: https://aiduxcare-mvp-uat.web.app
  const base =
    import.meta.env.VITE_PUBLIC_ACTION_URL ??
    import.meta.env.VITE_PUBLIC_BASE_URL; // fallback si se define así

  if (!base) {
    // Falla ruidosa en dev para evitar enlaces incorrectos a localhost
    throw new Error(
      '[EmailVerification] Missing VITE_PUBLIC_ACTION_URL (or VITE_PUBLIC_BASE_URL). Configure UAT public URL.'
    );
  }

  // --- Guardarraíles de ActionCodeSettings (añadir en src/lib/firebaseActionCode.ts) ---
  const ENV_TARGET = (import.meta.env.VITE_ENV_TARGET || '').toUpperCase().trim();
  const ACTION_URL = (import.meta.env.VITE_PUBLIC_ACTION_URL || '').trim();

  if (!ACTION_URL) {
    throw new Error('[ActionCode Guardrails] VITE_PUBLIC_ACTION_URL ausente');
  }
  if (ENV_TARGET === 'UAT' && !/uat/i.test(ACTION_URL)) {
    throw new Error(`[ActionCode Guardrails] URL de acción no corresponde a UAT: ${ACTION_URL}`);
  }
  if (ENV_TARGET === 'PROD' && /uat/i.test(ACTION_URL)) {
    throw new Error(`[ActionCode Guardrails] URL de acción de PROD no debe contener UAT: ${ACTION_URL}`);
  }
  // --- Fin guardarraíles ---

  return {
    url: `${base}/activate`,
    handleCodeInApp: true,
    // Opcional si está configurado en el proyecto
    dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN || undefined,
  };
}