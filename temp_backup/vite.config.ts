import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo (desarrollo, producción)
  const env = loadEnv(mode, process.cwd(), '');
  
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://mchyxyuaegsbrwodengr.supabase.co';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
  
  console.log('🔄 Cargando configuración de Vite con variables de entorno:');
  console.log(`- SUPABASE_URL: ${env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ No encontrada'}`);
  console.log(`- SUPABASE_ANON_KEY: ${env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No encontrada'}`);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_LANGFUSE_PUBLIC_KEY': JSON.stringify(env.VITE_LANGFUSE_PUBLIC_KEY || 'pk-lf-57c6e2ec-8603-44cf-b030-cddcef1f1f3d'),
      'import.meta.env.VITE_LANGFUSE_SECRET_KEY': JSON.stringify(env.VITE_LANGFUSE_SECRET_KEY || 'sk-lf-c1872960-86af-4899-b275-b7de8d536794')
    }
  };
});
