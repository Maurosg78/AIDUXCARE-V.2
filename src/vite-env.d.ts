/// <reference types="vite/client" />

// Global translation function declaration
declare function t(key: string): string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_HUGGINGFACE_API_KEY: string;
  readonly VITE_APP_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 