import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '');
  
  // Valores por defecto para producción
  const defaultEnvVars = {
    VITE_SUPABASE_URL: 'https://demo.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'demo_key_for_build_only',
    VITE_ANALYTICS_ENABLED: 'false',
    VITE_ANALYTICS_PILOT_MODE: 'false',
    VITE_AUDIT_LOGGING_ENABLED: 'false',
    VITE_ENCRYPTION_ENABLED: 'false',
    VITE_FEATURE_AGENT_SUGGESTIONS: 'false',
    VITE_FEATURE_AUDIO_CAPTURE: 'true',
    VITE_FEATURE_MCP_INTEGRATION: 'false',
    VITE_FEATURE_SOAP_EDITOR: 'true',
    VITE_LANGFUSE_PUBLIC_KEY: 'demo',
    VITE_LANGFUSE_SECRET_KEY: 'demo',
    VITE_PILOT_FEEDBACK_ENABLED: 'false',
    VITE_SHOW_PILOT_BANNER: 'false'
  };

  // En producción, usar valores por defecto si no están definidos
  const envVars = mode === 'production' 
    ? { ...defaultEnvVars, ...env }
    : env;

  return {
    plugins: [react(), basicSsl()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html',
        },
      },
      // Copiar archivos de configuración de Netlify
      copyPublicDir: true,
    },
    server: {
      https: {
        // Usar certificados autogenerados por basicSsl
        enabled: true
      },
      host: 'localhost',
      port: 5174,
    },
    define: {
      // Inyectar variables de entorno
      ...Object.keys(envVars).reduce((acc, key) => {
        if (key.startsWith('VITE_')) {
          acc[`process.env.${key}`] = JSON.stringify(envVars[key]);
        }
        return acc;
      }, {})
    }
  };
});
