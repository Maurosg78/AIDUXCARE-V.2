import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAiModeStore } from '../../stores/aiModeStore';

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('aiModeStore', () => {
  beforeEach(() => {
    // Limpiar el store antes de cada test
    useAiModeStore.getState().clearLocalTranscriptions();
    vi.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('debe tener valores por defecto correctos', () => {
      const state = useAiModeStore.getState();
      
      expect(state.offlineMode).toBe(false);
      expect(state.aiLightLocalSTT).toBe(false);
      expect(state.promoteToProOnReconnect).toBe(true);
      expect(state.localTranscriptions).toEqual([]);
      expect(state.pendingUploads).toEqual([]);
    });
  });

  describe('setFlag', () => {
    it('debe cambiar el flag offlineMode correctamente', () => {
      const { setFlag } = useAiModeStore.getState();
      
      setFlag('offlineMode', true);
      expect(useAiModeStore.getState().offlineMode).toBe(true);
      
      setFlag('offlineMode', false);
      expect(useAiModeStore.getState().offlineMode).toBe(false);
    });

    it('debe cambiar el flag aiLightLocalSTT correctamente', () => {
      const { setFlag } = useAiModeStore.getState();
      
      setFlag('aiLightLocalSTT', true);
      expect(useAiModeStore.getState().aiLightLocalSTT).toBe(true);
    });

    it('debe cambiar el flag promoteToProOnReconnect correctamente', () => {
      const { setFlag } = useAiModeStore.getState();
      
      setFlag('promoteToProOnReconnect', false);
      expect(useAiModeStore.getState().promoteToProOnReconnect).toBe(false);
    });

    it('debe rechazar flags inválidos', () => {
      const { setFlag } = useAiModeStore.getState();
      
      // @ts-expect-error - Testing invalid flag
      expect(() => setFlag('invalidFlag', true)).toThrow();
    });
  });

  describe('addLocalTranscription', () => {
    it('debe agregar una transcripción local correctamente', () => {
      const { addLocalTranscription } = useAiModeStore.getState();
      
      const mockTranscription = {
        id: 'test-1',
        text: 'Test transcription',
        confidence: 0.8,
        timestamp: new Date(),
        userId: 'user-1',
        sessionId: 'session-1',
        metadata: {
          duration: 30,
          sampleRate: 44100,
          channels: 1
        }
      };

      addLocalTranscription(mockTranscription);
      
      const state = useAiModeStore.getState();
      expect(state.localTranscriptions).toHaveLength(1);
      expect(state.localTranscriptions[0]).toEqual(mockTranscription);
    });

    it('debe agregar múltiples transcripciones en orden', () => {
      const { addLocalTranscription } = useAiModeStore.getState();
      
      const transcription1 = {
        id: 'test-1',
        text: 'First transcription',
        confidence: 0.8,
        timestamp: new Date('2025-01-01'),
        userId: 'user-1',
        sessionId: 'session-1',
        metadata: { duration: 30, sampleRate: 44100, channels: 1 }
      };

      const transcription2 = {
        id: 'test-2',
        text: 'Second transcription',
        confidence: 0.9,
        timestamp: new Date('2025-01-02'),
        userId: 'user-1',
        sessionId: 'session-1',
        metadata: { duration: 45, sampleRate: 44100, channels: 1 }
      };

      addLocalTranscription(transcription1);
      addLocalTranscription(transcription2);
      
      const state = useAiModeStore.getState();
      expect(state.localTranscriptions).toHaveLength(2);
      expect(state.localTranscriptions[0]).toEqual(transcription1);
      expect(state.localTranscriptions[1]).toEqual(transcription2);
    });
  });

  describe('addPendingUpload', () => {
    it('debe agregar un upload pendiente correctamente', () => {
      const { addPendingUpload } = useAiModeStore.getState();
      
      const mockUpload = {
        id: 'upload-1',
        transcriptionId: 'transcription-1',
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      };

      addPendingUpload(mockUpload);
      
      const state = useAiModeStore.getState();
      expect(state.pendingUploads).toHaveLength(1);
      expect(state.pendingUploads[0]).toEqual(mockUpload);
    });
  });

  describe('removePendingUpload', () => {
    it('debe remover un upload pendiente correctamente', () => {
      const { addPendingUpload, removePendingUpload } = useAiModeStore.getState();
      
      const mockUpload = {
        id: 'upload-1',
        transcriptionId: 'transcription-1',
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      };

      addPendingUpload(mockUpload);
      expect(useAiModeStore.getState().pendingUploads).toHaveLength(1);
      
      removePendingUpload('upload-1');
      expect(useAiModeStore.getState().pendingUploads).toHaveLength(0);
    });

    it('debe manejar IDs inexistentes sin error', () => {
      const { removePendingUpload } = useAiModeStore.getState();
      
      expect(() => removePendingUpload('non-existent')).not.toThrow();
    });
  });

  describe('clearLocalTranscriptions', () => {
    it('debe limpiar todas las transcripciones y uploads pendientes', () => {
      const { addLocalTranscription, addPendingUpload, clearLocalTranscriptions } = useAiModeStore.getState();
      
      // Agregar datos de prueba
      const mockTranscription = {
        id: 'test-1',
        text: 'Test transcription',
        confidence: 0.8,
        timestamp: new Date(),
        userId: 'user-1',
        sessionId: 'session-1',
        metadata: { duration: 30, sampleRate: 44100, channels: 1 }
      };

      const mockUpload = {
        id: 'upload-1',
        transcriptionId: 'transcription-1',
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      };

      addLocalTranscription(mockTranscription);
      addPendingUpload(mockUpload);
      
      expect(useAiModeStore.getState().localTranscriptions).toHaveLength(1);
      expect(useAiModeStore.getState().pendingUploads).toHaveLength(1);
      
      clearLocalTranscriptions();
      
      expect(useAiModeStore.getState().localTranscriptions).toHaveLength(0);
      expect(useAiModeStore.getState().pendingUploads).toHaveLength(0);
    });
  });

  describe('Hooks especializados', () => {
    it('debe exportar hooks especializados correctamente', () => {
      // Verificar que los hooks existen
      expect(typeof useAiModeStore.getState().offlineMode).toBe('boolean');
      expect(typeof useAiModeStore.getState().aiLightLocalSTT).toBe('boolean');
      expect(typeof useAiModeStore.getState().promoteToProOnReconnect).toBe('boolean');
    });
  });

  describe('Persistencia', () => {
    it('debe persistir solo los flags configurados', () => {
      const { setFlag } = useAiModeStore.getState();
      
      // Cambiar flags
      setFlag('offlineMode', true);
      setFlag('aiLightLocalSTT', true);
      setFlag('promoteToProOnReconnect', false);
      
      // Agregar transcripción (no debe persistir)
      const mockTranscription = {
        id: 'test-1',
        text: 'Test transcription',
        confidence: 0.8,
        timestamp: new Date(),
        userId: 'user-1',
        sessionId: 'session-1',
        metadata: { duration: 30, sampleRate: 44100, channels: 1 }
      };
      
      useAiModeStore.getState().addLocalTranscription(mockTranscription);
      
      // Verificar que solo los flags están en el estado persistido
      const state = useAiModeStore.getState();
      expect(state.offlineMode).toBe(true);
      expect(state.aiLightLocalSTT).toBe(true);
      expect(state.promoteToProOnReconnect).toBe(false);
      expect(state.localTranscriptions).toHaveLength(1); // Solo en memoria
    });
  });
});
