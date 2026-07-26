/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_HUGGINGFACE_API_KEY: string;
  readonly VITE_APP_ENVIRONMENT: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_USE_EMULATOR?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST?: string;
  readonly VITE_FEATURE_AI_PHYSICAL_TEST_SUGGESTIONS?: string;
  readonly VITE_USE_NEW_ACTIONS_PANEL?: string;
  readonly VITEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __AIDUX_APP_VERSION__: string;
declare const __AIDUX_BUILD_ID__: string;
