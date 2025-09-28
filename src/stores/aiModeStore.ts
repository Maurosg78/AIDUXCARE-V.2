// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AiModeState {
  // Flags de modo offline
  offlineMode: boolean;
  aiLightLocalSTT: boolean;
  promoteToProOnReconnect: boolean;
  
  // Estado de transcripciones locales
  localTranscriptions: LocalTranscription[];
  pendingUploads: PendingUpload[];
  
  // Métodos para modificar estado
  setFlag: (flag: keyof Pick<AiModeState, 'offlineMode' | 'aiLightLocalSTT' | 'promoteToProOnReconnect'>, value: boolean) => void;
  addLocalTranscription: (transcription: LocalTranscription) => void;
  addPendingUpload: (upload: PendingUpload) => void;
  removePendingUpload: (id: string) => void;
  clearLocalTranscriptions: () => void;
}

export interface LocalTranscription {
  id: string;
  audioBlob?: Blob;
  text: string;
  confidence: number;
  timestamp: Date;
  userId: string;
  sessionId: string;
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
}

export interface PendingUpload {
  id: string;
  transcriptionId: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

// Store principal con persistencia opcional
export const useAiModeStore = create<AiModeState>()(
  persist(
    (set) => ({
      // Estado inicial
      offlineMode: false,
      aiLightLocalSTT: false,
      promoteToProOnReconnect: true,
      localTranscriptions: [],
      pendingUploads: [],
      
      // Métodos
      setFlag: (flag, value) => {
        // Validar que el flag sea válido
        const validFlags = ['offlineMode', 'aiLightLocalSTT', 'promoteToProOnReconnect'];
        if (!validFlags.includes(flag)) {
          throw new Error(`Flag inválido: ${flag}. Flags válidos: ${validFlags.join(', ')}`);
        }
        
        set((state) => ({
          ...state,
          [flag]: value
        }));
      },
      
      addLocalTranscription: (transcription) => {
        set((state) => ({
          ...state,
          localTranscriptions: [...state.localTranscriptions, transcription]
        }));
      },
      
      addPendingUpload: (upload) => {
        set((state) => ({
          ...state,
          pendingUploads: [...state.pendingUploads, upload]
        }));
      },
      
      removePendingUpload: (id) => {
        set((state) => ({
          ...state,
          pendingUploads: state.pendingUploads.filter(upload => upload.id !== id)
        }));
      },
      
      clearLocalTranscriptions: () => {
        set((state) => ({
          ...state,
          localTranscriptions: [],
          pendingUploads: []
        }));
      }
    }),
    {
      name: 'ai-mode-storage',
      partialize: (state) => ({
        offlineMode: state.offlineMode,
        aiLightLocalSTT: state.aiLightLocalSTT,
        promoteToProOnReconnect: state.promoteToProOnReconnect
      })
    }
  )
);

// Hooks especializados para mejor DX
export const useOfflineMode = () => useAiModeStore((state) => state.offlineMode);
export const useAiLightLocalSTT = () => useAiModeStore((state) => state.aiLightLocalSTT);
export const usePromoteToProOnReconnect = () => useAiModeStore((state) => state.promoteToProOnReconnect);
export const useLocalTranscriptions = () => useAiModeStore((state) => state.localTranscriptions);
export const usePendingUploads = () => useAiModeStore((state) => state.pendingUploads);