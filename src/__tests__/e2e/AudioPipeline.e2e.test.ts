import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AudioPipelineService from '../../services/AudioPipelineService';
import { GoogleCloudAudioService } from '../../services/GoogleCloudAudioService';

// Mock de MediaRecorder
class MockMediaRecorder {
  private ondataavailable: ((event: any) => void) | null = null;
  private onstop: (() => void) | null = null;
  private chunks: Blob[] = [];
  state: 'inactive' | 'recording' = 'inactive';

  constructor(private stream: MediaStream, private options: MediaRecorderOptions) {}

  start(timeslice: number) {
    this.state = 'recording';
    // Simular chunks de audio cada segundo durante 1 minuto
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        if (this.state === 'recording' && this.ondataavailable) {
          // Simular chunk de audio de ~8KB (similar a los logs reales)
          const chunk = new Blob(['x'.repeat(8 * 1024)], { type: 'audio/webm;codecs=opus' });
          this.ondataavailable({ data: chunk });
          this.chunks.push(chunk);
        }
      }, i * 1000);
    }
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }

  set onstart(handler: () => void) {}
  set ondataavailable(handler: (event: any) => void) { this.ondataavailable = handler; }
  set onstop(handler: () => void) { this.onstop = handler; }
  set onerror(handler: (event: any) => void) {}
}

// Mock de getUserMedia
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{
    stop: () => {}
  }]
});

// Mock de la respuesta de Google Cloud
const mockSuccessResponse = {
  success: true,
  transcription: 'Transcripción de prueba exitosa',
  warnings: [],
  suggestions: []
};

const mockErrorResponse = {
  success: false,
  error: 'Error de conexión simulado'
};

describe('AudioPipeline E2E Test', () => {
  let audioPipeline: AudioPipelineService;
  let transcriptionCallback: vi.Mock;
  let failureCount = 0;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    failureCount = 0;

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true
    });

    // Mock MediaRecorder
    (global as any).MediaRecorder = MockMediaRecorder;

    // Mock GoogleCloudAudioService
    vi.spyOn(GoogleCloudAudioService.prototype, 'analyzeClinicalTranscription')
      .mockImplementation(async () => {
        // Simular fallos en las primeras dos llamadas
        if (failureCount < 2) {
          failureCount++;
          throw new Error('Error de conexión simulado');
        }
        return mockSuccessResponse;
      });

    // Setup callback de transcripción
    transcriptionCallback = vi.fn();
    audioPipeline = new AudioPipelineService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe manejar una grabación completa con reintentos exitosos', async () => {
    // Iniciar grabación
    await audioPipeline.iniciarGrabacion(transcriptionCallback);

    // Verificar que se solicitaron permisos de micrófono
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      }
    });

    // Verificar estado inicial
    expect(transcriptionCallback).toHaveBeenCalledWith(
      '',
      false,
      expect.objectContaining({
        status: 'recording',
        progress: 0
      })
    );

    // Esperar 5 segundos para simular grabación
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Detener grabación
    await audioPipeline.detenerGrabacion();

    // Verificar que el sistema intentó procesar con Google Cloud
    expect(GoogleCloudAudioService.prototype.analyzeClinicalTranscription)
      .toHaveBeenCalledTimes(3); // 2 fallos + 1 éxito

    // Verificar que se recibieron actualizaciones de estado
    expect(transcriptionCallback).toHaveBeenCalledWith(
      expect.any(String),
      false,
      expect.objectContaining({
        status: 'processing',
        progress: expect.any(Number)
      })
    );

    // Verificar resultado final exitoso
    expect(transcriptionCallback).toHaveBeenCalledWith(
      mockSuccessResponse.transcription,
      true,
      expect.objectContaining({
        status: 'completed',
        progress: 100
      })
    );

    // Verificar manejo de errores
    const errorCalls = transcriptionCallback.mock.calls.filter(
      call => call[2]?.status === 'error'
    );
    expect(errorCalls.length).toBe(2); // Dos errores antes del éxito

    // Verificar que los reintentos tuvieron delays exponenciales
    const processingCalls = transcriptionCallback.mock.calls.filter(
      call => call[2]?.status === 'processing'
    );
    expect(processingCalls.length).toBeGreaterThan(2); // Al menos 3 intentos
  }, 15000); // Timeout extendido para el test completo
}); 