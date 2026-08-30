import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Hito 2c (AiDux Air): verifica que useTranscript toma la rama correcta
 * según isNativeAudioAvailable() — plugin nativo cuando corre como app
 * nativa, MediaRecorder/getUserMedia (sin cambios) en caso contrario.
 *
 * Crítico: el segundo caso es el que corre HOY en producción en
 * pilot.aiduxcare.com — no se mockea Firebase (persistAudioBackup /
 * FirebaseWhisperService.transcribe se dejan correr contra la config real
 * de test, y se les permite fallar internamente; el hook ya captura esos
 * errores con setError en vez de lanzar, así que no rompen el test). Solo
 * se mockea @/core/audio/nativeAudioBridge, que es código nuevo de este
 * mismo commit, no infraestructura de terceros.
 */

const isNativeAudioAvailableMock = vi.fn();
const startNativeRecordingMock = vi.fn();
const stopNativeRecordingMock = vi.fn();
const base64ToBlobMock = vi.fn();
const showRecordingLockScreenNotificationMock = vi.fn();
const dismissRecordingLockScreenNotificationMock = vi.fn();
const onRecordingStopRequestedFromNotificationMock = vi.fn();
const watchAppBackgroundToShowRecordingNotificationMock = vi.fn();

vi.mock('@/core/audio/nativeAudioBridge', () => ({
  isNativeAudioAvailable: () => isNativeAudioAvailableMock(),
  startNativeRecording: () => startNativeRecordingMock(),
  stopNativeRecording: () => stopNativeRecordingMock(),
  base64ToBlob: (...args: unknown[]) => base64ToBlobMock(...args),
  showRecordingLockScreenNotification: (...args: unknown[]) => showRecordingLockScreenNotificationMock(...args),
  dismissRecordingLockScreenNotification: () => dismissRecordingLockScreenNotificationMock(),
  onRecordingStopRequestedFromNotification: (cb: () => void) => onRecordingStopRequestedFromNotificationMock(cb),
  watchAppBackgroundToShowRecordingNotification: () => watchAppBackgroundToShowRecordingNotificationMock(),
}));

import { useTranscript } from '../useTranscript';

describe('useTranscript — Hito 2c native/web branch selection', () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isNativeAudioAvailableMock.mockReset().mockReturnValue(false);
    startNativeRecordingMock.mockReset().mockResolvedValue(undefined);
    stopNativeRecordingMock.mockReset().mockResolvedValue({
      filePath: '/tmp/aidux_air_test.m4a',
      base64Audio: 'AAAA',
      mimeType: 'audio/mp4',
    });
    base64ToBlobMock.mockReset().mockReturnValue(new Blob(['x'], { type: 'audio/mp4' }));
    showRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    dismissRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    onRecordingStopRequestedFromNotificationMock.mockReset().mockReturnValue(() => {});
    watchAppBackgroundToShowRecordingNotificationMock.mockReset().mockReturnValue(() => {});

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
      filePath: '/tmp/aidux_air_test.m4a',
      base64Audio: 'AAAA',
      mimeType: 'audio/mp4',
    });
    base64ToBlobMock.mockReset().mockReturnValue(new Blob(['x'], { type: 'audio/mp4' }));
    showRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    dismissRecordingLockScreenNotificationMock.mockReset().mockResolvedValue(undefined);
    onRecordingStopRequestedFromNotificationMock.mockReset().mockReturnValue(() => {});
    watchAppBackgroundToShowRecordingNotificationMock.mockReset().mockReturnValue(() => {});

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
});
