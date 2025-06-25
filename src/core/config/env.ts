// src/core/config/env.ts

// Carga URL y KEY de Supabase desde variables de entorno de Vite
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  '';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

// Validación opcional para desarrollo (no bloquear en producción)
if (import.meta.env.DEV && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn('WARNING: Missing Supabase environment variables - some features may not work');
}
