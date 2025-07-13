import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioPipelineService } from '../../services/AudioPipelineService';
import { GoogleCloudAudioService } from '../../services/GoogleCloudAudioService';

interface MockMediaRecorderEventHandler {
  (event: { data: Blob }): void;
}

describe('AudioPipeline E2E Test', () => {
  let audioPipeline: AudioPipelineService;
  let transcriptionCallback: ReturnType<typeof vi.fn>;
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let failureCount = 0;

  beforeEach(() => {
    vi.restoreAllMocks();
    failureCount = 0;

    // Asegurar que navigator.mediaDevices existe
    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {};
    }
    // Spy y mock de getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: () => {} }],
      id: 'mock-stream',
      active: true,
      addTrack: () => {},
      removeTrack: () => {},
      getAudioTracks: () => [],
      getVideoTracks: () => [],
      getTrackById: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    } as unknown as MediaStream);
    (navigator.mediaDevices as any).getUserMedia = mockGetUserMedia;
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockImplementation(mockGetUserMedia as any);

    // Spy y mock de MediaRecorder
    class MockMediaRecorder {
      private _ondataavailable: MockMediaRecorderEventHandler | null = null;
      private _onstop: (() => void) | null = null;
      private chunks: Blob[] = [];
      state: 'inactive' | 'recording' = 'inactive';
      constructor(private stream: MediaStream, private options: MediaRecorderOptions) {}
      start() {
        this.state = 'recording';
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (this.state === 'recording' && this._ondataavailable) {
              const chunk = new Blob(['x'.repeat(8 * 1024)], { type: 'audio/webm;codecs=opus' });
              this._ondataavailable({ data: chunk });
              this.chunks.push(chunk);
            }
          }, i * 1000);
        }
      }
      stop() {
        this.state = 'inactive';
        if (this._onstop) this._onstop();
      }
      set onstart(handler: () => void) {}
      set ondataavailable(handler: MockMediaRecorderEventHandler) { this._ondataavailable = handler; }
      set onstop(handler: () => void) { this._onstop = handler; }
      set onerror(handler: (event: any) => void) {}
    }
    (global as any).MediaRecorder = MockMediaRecorder;

    // Spy y mock de GoogleCloudAudioService.processAudio
    vi.spyOn(GoogleCloudAudioService.prototype, 'processAudio')
      .mockImplementation(async () => {
        if (failureCount < 2) {
          failureCount++;
          throw new Error('Error de conexión simulado');
        }
        return {
          text: 'Transcripción de prueba exitosa',
          isFinal: true,
          confidence: 0.95
        };
      });

    // Callback de transcripción
    transcriptionCallback = vi.fn();
    audioPipeline = new AudioPipelineService({
      onTranscriptionStart: () => transcriptionCallback('', false, { status: 'recording', progress: 0 }),
      onTranscriptionEnd: () => {},
      onTranscriptionResult: (result) => transcriptionCallback(result.text, result.isFinal, { status: 'processing', progress: 50 }),
      onTranscriptionError: (error) => transcriptionCallback(error.message, false, { status: 'error', progress: 0 })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe manejar una grabación completa con reintentos exitosos', async () => {
    await audioPipeline.startRecording();
    await new Promise((resolve, reject) => {
      const maxWait = 6000;
      const interval = 50;
      let waited = 0;
      const check = () => {
        if (transcriptionCallback.mock.calls.length >= 4) {
          resolve(undefined);
        } else if (waited >= maxWait) {
          reject(new Error('No se recibieron los 4 callbacks esperados a tiempo.'));
        } else {
          waited += interval;
          setTimeout(check, interval);
        }
      };
      check();
    });
    audioPipeline.stopRecording();
    expect(transcriptionCallback).toHaveBeenNthCalledWith(1,
      '',
      false,
      expect.objectContaining({
        status: 'recording',
        progress: 0
      })
    );
    expect(transcriptionCallback).toHaveBeenNthCalledWith(2,
      'Error de conexión simulado',
      false,
      expect.objectContaining({
        status: 'error',
        progress: 0
      })
    );
    expect(transcriptionCallback).toHaveBeenNthCalledWith(3,
      'Error de conexión simulado',
      false,
      expect.objectContaining({
        status: 'error',
        progress: 0
      })
    );
    expect(transcriptionCallback).toHaveBeenNthCalledWith(4,
      'Transcripción de prueba exitosa',
      true,
      expect.objectContaining({
        status: 'processing',
        progress: 50
      })
    );
    expect(GoogleCloudAudioService.prototype.processAudio)
      .toHaveBeenCalledTimes(3);
  }, 15000);
}); 