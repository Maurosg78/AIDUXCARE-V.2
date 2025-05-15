import { createClient } from '@supabase/supabase-js';

// TODO: Reemplazar estos valores con variables de entorno reales en producción
// Estos son valores temporales solo para desarrollo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mhkjfldawdwydvczqdzp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oa2pmbGRhd2R3eWR2Y3pxZHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA1MDgxNDUsImV4cCI6MjAyNjA4NDE0NX0.HBVTnuVWyBmS-GiVeN6IuCF00pynMLQEA7NTZZDboJM';

// Advertencia en desarrollo
console.log('⚠️ ATENCIÓN: Usando credenciales de prueba para Supabase. Esto no es seguro para producción.');

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase; 