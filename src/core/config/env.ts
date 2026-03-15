import logger from '@/shared/utils/logger';
// src/core/config/env.ts

// Vite env is available in the browser build as import.meta.env, but in Node
// (e.g. simulators, scripts) it may not exist. Normalise into a single object.
const viteEnv =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) || (process?.env as Record<string, any>) || {};

// Carga URL y KEY de Supabase desde variables de entorno (Vite o Node)
export const SUPABASE_URL = viteEnv.VITE_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY = viteEnv.VITE_SUPABASE_ANON_KEY || '';

// Validación opcional para desarrollo (no bloquear en producción)
const isDev = Boolean(viteEnv.DEV) || process.env.NODE_ENV === 'development';

if (isDev && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  // Usa logger si está disponible; si no, cae a console.warn
  try {
    logger.warn?.('⚠️ Missing Supabase environment variables - some features may not work');
  } catch {
    console.warn('⚠️ Missing Supabase environment variables - some features may not work');
  }
}
