/**
 * Utilidad para verificar la conexión con Supabase
 */
import supabase from '@/core/auth/supabaseClient';
import { SUPABASE_URL } from '@/config/env';

/**
 * Verifica si podemos conectar con Supabase realizando una petición simple
 * @returns Un objeto indicando si hay conexión y detalles
 */
export async function checkSupabaseConnection(): Promise<{
  isConnected: boolean;
  url: string;
  error?: string;
  latency?: number;
}> {
  try {
    if (!SUPABASE_URL) {
      return {
        isConnected: false,
        url: 'No URL configurada',
        error: 'La URL de Supabase no está configurada'
      };
    }

    // Medir latencia
    const startTime = performance.now();
    
    // Usar auth.getSession() en lugar de consultar una tabla específica
    // Este método siempre está disponible y no depende de esquemas personalizados
    const { error } = await supabase.auth.getSession();
    
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (error) {
      return {
        isConnected: false,
        url: SUPABASE_URL,
        error: `Error conectando a Supabase: ${error.message}`,
        latency
      };
    }

    return {
      isConnected: true,
      url: SUPABASE_URL,
      latency
    };
  } catch (e) {
    return {
      isConnected: false,
      url: SUPABASE_URL,
      error: e instanceof Error ? e.message : 'Error desconocido'
    };
  }
}

/**
 * Imprime en consola un diagnóstico de la conexión a Supabase
 */
export async function logSupabaseConnectionStatus(): Promise<void> {
  console.log('⏳ Verificando conexión a Supabase...');
  
  try {
    const result = await checkSupabaseConnection();
    
    if (result.isConnected) {
      console.log(
        `✅ Conexión a Supabase OK: ${result.url} (${result.latency}ms)`
      );
    } else {
      console.error(
        `❌ Error conectando a Supabase: ${result.url}\n  ${result.error}`
      );
    }
  } catch (e) {
    console.error('❌ Error intentando verificar conexión:', e);
  }
}

// Ejecutar en desarrollo automáticamente
if (import.meta.env.DEV) {
  logSupabaseConnectionStatus().catch(console.error);
} 