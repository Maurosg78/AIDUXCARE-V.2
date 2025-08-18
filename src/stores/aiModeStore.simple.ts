// Store simplificado para AI Light + Offline Mode
// Versión sin dependencias externas para testing

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

export interface AiModeState {
  offlineMode: boolean;
  aiLightLocalSTT: boolean;
  promoteToProOnReconnect: boolean;
  localTranscriptions: LocalTranscription[];
  pendingUploads: PendingUpload[];
}

// Store simple usando localStorage directamente
class SimpleAiModeStore {
  private state: AiModeState = {
    offlineMode: false,
    aiLightLocalSTT: false,
    promoteToProOnReconnect: true,
    localTranscriptions: [],
    pendingUploads: []
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai-mode-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state.offlineMode = parsed.offlineMode || false;
        this.state.aiLightLocalSTT = parsed.aiLightLocalSTT || false;
        this.state.promoteToProOnReconnect = parsed.promoteToProOnReconnect !== false;
      }
    } catch (error) {
      console.warn('Error loading AI mode state:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const toSave = {
        offlineMode: this.state.offlineMode,
        aiLightLocalSTT: this.state.aiLightLocalSTT,
        promoteToProOnReconnect: this.state.promoteToProOnReconnect
      };
      localStorage.setItem('ai-mode-storage', JSON.stringify(toSave));
    } catch (error) {
      console.warn('Error saving AI mode state:', error);
    }
  }

  getState(): AiModeState {
    return { ...this.state };
  }

  setFlag(flag: keyof Pick<AiModeState, 'offlineMode' | 'aiLightLocalSTT' | 'promoteToProOnReconnect'>, value: boolean): void {
    this.state[flag] = value;
    this.saveToStorage();
  }

  addLocalTranscription(transcription: LocalTranscription): void {
    this.state.localTranscriptions.push(transcription);
  }

  addPendingUpload(upload: PendingUpload): void {
    this.state.pendingUploads.push(upload);
  }

  removePendingUpload(id: string): void {
    this.state.pendingUploads = this.state.pendingUploads.filter(upload => upload.id !== id);
  }

  clearLocalTranscriptions(): void {
    this.state.localTranscriptions = [];
    this.state.pendingUploads = [];
  }
}

// Instancia global
export const aiModeStore = new SimpleAiModeStore();

// Hooks simplificados
export const useOfflineMode = () => aiModeStore.getState().offlineMode;
export const useAiLightLocalSTT = () => aiModeStore.getState().aiLightLocalSTT;
export const usePromoteToProOnReconnect = () => aiModeStore.getState().promoteToProOnReconnect;
export const useLocalTranscriptions = () => aiModeStore.getState().localTranscriptions;
export const usePendingUploads = () => aiModeStore.getState().pendingUploads;
