import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Hito 2c (AiDux Air): verifica que useTranscript toma la rama correcta
 * según isNativeAudioAvailable() — plugin nativo cuando corre como app
 * nativa, MediaRecorder/getUserMedia (sin cambios) en caso contrario.
 *
 * Crítico: el segundo caso es el que corre HOY en producción en
 * pilot.aiduxcare.com — en los dos primeros describe, no se mockea
 * Firebase (persistAudioBackup / FirebaseWhisperService.transcribe se
 * dejan correr contra la config real de test, y se les permite fallar
 * internamente; el hook ya captura esos errores con setError en vez de
 * lanzar, así que no rompen el test) — nunca se llega a esas funciones
 * de todas formas, porque el blob simulado (1 byte) siempre cae en el
 * guard de MIN_AUDIO_SIZE_BYTES antes de necesitarlas.
 *
 * TD-012 (Hito 2f): el tercer describe SÍ mockea persistAudioBackup/
 * FirebaseWhisperService.transcribe — es la única forma de probar de
 * forma determinística el loop de transcripción por segmento
 * (concatenación en orden, resiliencia ante un segmento que falla).
 * Van todos en este mismo archivo, no en uno aparte: con el aislamiento
 * de Vitest desactivado (`isolate: false` en vitest.stable.config.ts,
 * el que realmente corre en CI), dos archivos mockeando el mismo
 * módulo @/core/audio/nativeAudioBridge por separado colisionan de
 * forma garantizada — se confirmó al intentarlo.
 */

const isNativeAudioAvailableMock = vi.fn();
const startNativeRecordingMock = vi.fn();
const stopNativeRecordingMock = vi.fn();
const base64ToBlobMock = vi.fn();
const showRecordingLockScreenNotificationMock = vi.fn();
const dismissRecordingLockScreenNotificationMock = vi.fn();
const onRecordingStopRequestedFromNotificationMock = vi.fn();
const watchAppBackgroundToShowRecordingNotificationMock = vi.fn();
const startRecordingNotificationUpdatesMock = vi.fn();

vi.mock('@/core/audio/nativeAudioBridge', () => ({
  isNativeAudioAvailable: () => isNativeAudioAvailableMock(),
  startNativeRecording: () => startNativeRecordingMock(),
  stopNativeRecording: () => stopNativeRecordingMock(),
  base64ToBlob: (...args: unknown[]) => base64ToBlobMock(...args),
  showRecordingLockScreenNotification: (...args: unknown[]) => showRecordingLockScreenNotificationMock(...args),
  dismissRecordingLockScreenNotification: () => dismissRecordingLockScreenNotificationMock(),
  onRecordingStopRequestedFromNotification: (cb: () => void) => onRecordingStopRequestedFromNotificationMock(cb),
  watchAppBackgroundToShowRecordingNotification: () => watchAppBackgroundToShowRecordingNotificationMock(),
  startRecordingNotificationUpdates: (...args: unknown[]) => startRecordingNotificationUpdatesMock(...args),
}));

// TD-012 (Hito 2f) — solo lo usa el tercer describe, ver comentario arriba.
const persistAudioBackupMock = vi.fn();
const updateAudioBackupTranscriptionStatusMock = vi.fn();

vi.mock('../../services/audioBackupService', () => ({
  persistAudioBackup: (...args: unknown[]) => persistAudioBackupMock(...args),
  updateAudioBackupTranscriptionStatus: (...args: unknown[]) => updateAudioBackupTranscriptionStatusMock(...args),
}));

const transcribeMock = vi.fn();

vi.mock('../../services/FirebaseWhisperService', () => ({
  FirebaseWhisperService: {
    transcribe: (...args: unknown[]) => transcribeMock(...args),
  },
}));

import { useTranscript } from '../useTranscript';

describe('useTranscript — Hito 2c native/web branch selection', () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isNativeAudioAvailableMock.mockReset().mockReturnValue(false);
    startNativeRecordingMock.mockReset().mockResolvedValue(undefined);
    stopNativeRecordingMock.mockReset().mockResolvedValue({
      segments: [{ filePath: '/tmp/aidux_air_test.m4a', base64Audio: 'AAAA' }],
      mimeType: 'audio/mp4',
    });
    base64ToBlobMock.mockReset().mockReturnValue(new Blob(['x'], { type: 'audio/mp4' }));
    showRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    dismissRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    onRecordingStopRequestedFromNotificationMock.mockReset().mockReturnValue(() => {});
    watchAppBackgroundToShowRecordingNotificationMock.mockReset().mockReturnValue(() => {});
    startRecordingNotificationUpdatesMock.mockReset().mockReturnValue(() => {});

    getUserMediaMock = vi.fn().mockResolvedValue({
      active: true,
      getTracks: () => [],
    });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
    });

    class FakeMediaRecorder {
      static isTypeSupported() {
        return true;
      }
      state = 'inactive';
      stream: unknown;
      ondataavailable: unknown = null;
      onstop: unknown = null;
      constructor(stream: unknown) {
        this.stream = stream;
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
      }
    }
    // @ts-expect-error stub mínimo para jsdom, que no implementa MediaRecorder
    global.MediaRecorder = FakeMediaRecorder;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usa el plugin nativo (no getUserMedia) cuando isNativeAudioAvailable() es true', async () => {
    isNativeAudioAvailableMock.mockReturnValue(true);
    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(startNativeRecordingMock).toHaveBeenCalledTimes(1);
    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);

    // Evita dejar el finalize nativo colgando al desmontar (WO-MIC-LIFECYCLE-001).
    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
    });
    unmount();
  });

  it('usa getUserMedia/MediaRecorder (no el plugin nativo) cuando isNativeAudioAvailable() es false — el path que corre hoy en producción', async () => {
    isNativeAudioAvailableMock.mockReturnValue(false);
    const { result } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(startNativeRecordingMock).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it('stopRecording delega en el plugin nativo cuando la grabación activa es nativa', async () => {
    isNativeAudioAvailableMock.mockReturnValue(true);
    const { result } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
      // finalizeNativeRecording es fire-and-forget (void) — darle un tick.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(stopNativeRecordingMock).toHaveBeenCalledTimes(1);
  });

  it('stopRecording NO llama al plugin nativo cuando la grabación activa es la del navegador', async () => {
    isNativeAudioAvailableMock.mockReturnValue(false);
    const { result } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
    });

    expect(stopNativeRecordingMock).not.toHaveBeenCalled();
  });
});

describe('useTranscript — Hito 2e lock screen stop control', () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isNativeAudioAvailableMock.mockReset().mockReturnValue(true);
    startNativeRecordingMock.mockReset().mockResolvedValue(undefined);
    stopNativeRecordingMock.mockReset().mockResolvedValue({
      segments: [{ filePath: '/tmp/aidux_air_test.m4a', base64Audio: 'AAAA' }],
      mimeType: 'audio/mp4',
    });
    base64ToBlobMock.mockReset().mockReturnValue(new Blob(['x'], { type: 'audio/mp4' }));
    showRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    dismissRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    onRecordingStopRequestedFromNotificationMock.mockReset().mockReturnValue(() => {});
    watchAppBackgroundToShowRecordingNotificationMock.mockReset().mockReturnValue(() => {});
    startRecordingNotificationUpdatesMock.mockReset().mockReturnValue(() => {});

    getUserMediaMock = vi.fn().mockResolvedValue({ active: true, getTracks: () => [] });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra la notificación al arrancar una grabación nativa', async () => {
    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(showRecordingLockScreenNotificationMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
    });
    unmount();
  });

  it('NO muestra la notificación cuando la grabación es la del navegador (no nativa)', async () => {
    isNativeAudioAvailableMock.mockReturnValue(false);
    const { result } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(showRecordingLockScreenNotificationMock).not.toHaveBeenCalled();
  });

  it('cancela la notificación al detener desde el botón in-app', async () => {
    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(dismissRecordingLockScreenNotificationMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('se suscribe UNA sola vez a la acción de la notificación, sin reimplementar "detener": el callback suscripto termina llamando al mismo stopNativeRecording que usa el botón in-app', async () => {
    const { result, unmount } = renderHook(() => useTranscript());

    // Esperar a que el useEffect de suscripción corra.
    await act(async () => {
      await Promise.resolve();
    });

    expect(onRecordingStopRequestedFromNotificationMock).toHaveBeenCalledTimes(1);
    const registeredCallback = onRecordingStopRequestedFromNotificationMock.mock.calls[0][0] as () => void;

    await act(async () => {
      await result.current.startRecording();
    });

    // Simula: el usuario tocó "Detener grabación" en la notificación de la
    // pantalla de bloqueo — esto invoca exactamente el mismo stopRecording
    // que usa el botón dentro de la app, no una segunda implementación.
    await act(async () => {
      registeredCallback();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(stopNativeRecordingMock).toHaveBeenCalledTimes(1);
    expect(dismissRecordingLockScreenNotificationMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('se suscribe a appStateChange al arrancar una grabación nativa (fix real: mostrar la notificación cuando la app pasa a background de verdad, no en un timer fijo)', async () => {
    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(watchAppBackgroundToShowRecordingNotificationMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
    });
    unmount();
  });

  it('se desuscribe de appStateChange al detener la grabación nativa', async () => {
    const unsubscribeMock = vi.fn();
    watchAppBackgroundToShowRecordingNotificationMock.mockReturnValue(unsubscribeMock);

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(unsubscribeMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('arranca las actualizaciones periódicas de tiempo transcurrido (Opción B) al iniciar grabación nativa, y las detiene al parar', async () => {
    const unsubscribeMock = vi.fn();
    startRecordingNotificationUpdatesMock.mockReturnValue(unsubscribeMock);

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(startRecordingNotificationUpdatesMock).toHaveBeenCalledTimes(1);
    expect(unsubscribeMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    unmount();
  });
});

describe('useTranscript — troceo de audio nativo por segmentos (TD-012)', () => {
  /** Cada segmento simulado es "grande" a propósito — MIN_AUDIO_SIZE_BYTES es 40000. */
  const LARGE_ENOUGH_BLOB_SIZE = 100000;

  function buildSegments(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      filePath: `/tmp/aidux_air_segment_${i}.m4a`,
      base64Audio: `segment-${i}-base64`,
    }));
  }

  beforeEach(() => {
    isNativeAudioAvailableMock.mockReset().mockReturnValue(true);
    startNativeRecordingMock.mockReset().mockResolvedValue(undefined);
    showRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    dismissRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    onRecordingStopRequestedFromNotificationMock.mockReset().mockReturnValue(() => {});
    watchAppBackgroundToShowRecordingNotificationMock.mockReset().mockReturnValue(() => {});
    startRecordingNotificationUpdatesMock.mockReset().mockReturnValue(() => {});

    base64ToBlobMock.mockReset().mockImplementation((base64: string) => new Blob([base64.padEnd(LARGE_ENOUGH_BLOB_SIZE, '0')]));

    persistAudioBackupMock.mockReset().mockImplementation(async () => ({
      id: `backup-${Math.random()}`,
      recordingId: `recording-${Math.random()}`,
      storagePath: 'session-audio-backups/fake/path.m4a',
    }));
    updateAudioBackupTranscriptionStatusMock.mockReset().mockResolvedValue(undefined);
    transcribeMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('concatena los segmentos exitosos en orden cronológico', async () => {
    stopNativeRecordingMock.mockResolvedValue({
      segments: buildSegments(3),
      mimeType: 'audio/mp4',
    });
    transcribeMock
      .mockResolvedValueOnce({ text: 'Primera parte.' })
      .mockResolvedValueOnce({ text: 'Segunda parte.' })
      .mockResolvedValueOnce({ text: 'Tercera parte.' });

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(transcribeMock).toHaveBeenCalledTimes(3);
    expect(result.current.transcript).toBe('Primera parte. Segunda parte. Tercera parte.');
    expect(result.current.error).toBeNull();
    unmount();
  });

  it('un segmento que falla no descarta los demás — resiliencia real, no todo-o-nada', async () => {
    stopNativeRecordingMock.mockResolvedValue({
      segments: buildSegments(3),
      mimeType: 'audio/mp4',
    });
    transcribeMock
      .mockResolvedValueOnce({ text: 'Primera parte.' })
      .mockRejectedValueOnce(new Error('Total number of tokens in instructions + audio is too large for this model'))
      .mockResolvedValueOnce({ text: 'Tercera parte.' });

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.transcript).toBe('Primera parte. Tercera parte.');
    expect(result.current.error).toContain('Parte de la grabación no se pudo transcribir');

    const failedCall = updateAudioBackupTranscriptionStatusMock.mock.calls.find(
      (call) => call[1] === 'failed_retryable',
    );
    expect(failedCall).toBeDefined();
    unmount();
  });

  it('todos los segmentos fallando deja transcript vacío pero avisa que el audio quedó respaldado', async () => {
    stopNativeRecordingMock.mockResolvedValue({
      segments: buildSegments(2),
      mimeType: 'audio/mp4',
    });
    transcribeMock.mockRejectedValue(new Error('network error'));

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.error).toContain('quedó respaldada');
    unmount();
  });

  it('descarta segmentos con alucinación (audio corto/silencioso) sin romper la concatenación del resto', async () => {
    stopNativeRecordingMock.mockResolvedValue({
      segments: buildSegments(2),
      mimeType: 'audio/mp4',
    });
    transcribeMock
      .mockResolvedValueOnce({ text: 'This is a clinical conversation between a healthcare professional...' })
      .mockResolvedValueOnce({ text: 'Texto real del segundo segmento.' });

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.transcript).toBe('Texto real del segundo segmento.');
    unmount();
  });

  it('persiste cada segmento como su propio respaldo, no uno combinado', async () => {
    stopNativeRecordingMock.mockResolvedValue({
      segments: buildSegments(3),
      mimeType: 'audio/mp4',
    });
    transcribeMock.mockResolvedValue({ text: 'texto' });

    const { result, unmount } = renderHook(() => useTranscript());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      result.current.stopRecording();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(persistAudioBackupMock).toHaveBeenCalledTimes(3);
    unmount();
  });
});
