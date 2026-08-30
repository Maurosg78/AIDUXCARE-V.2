import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  base64ToBlob,
  dismissRecordingLockScreenNotification,
  isNativeAudioAvailable,
  onRecordingStopRequestedFromNotification,
  showRecordingLockScreenNotification,
  startNativeRecording,
  stopNativeRecording,
  watchAppBackgroundToShowRecordingNotification,
} from '../nativeAudioBridge';

describe('nativeAudioBridge', () => {
  afterEach(() => {
    // @ts-expect-error — cleanup del global inyectado en cada test
    delete window.Capacitor;
  });

  describe('isNativeAudioAvailable', () => {
    it('is false when window.Capacitor does not exist (caso web normal, pilot.aiduxcare.com hoy)', () => {
      expect(isNativeAudioAvailable()).toBe(false);
    });

    it('is false when Capacitor exists but isNativePlatform() is false (navegador dentro de un contexto Capacitor no nativo)', () => {
      window.Capacitor = {
        isNativePlatform: () => false,
        Plugins: { BackgroundAudio: { startRecording: vi.fn(), stopRecording: vi.fn() } },
      };
      expect(isNativeAudioAvailable()).toBe(false);
    });

    it('is false when native but the plugin is not registered', () => {
      window.Capacitor = { isNativePlatform: () => true, Plugins: {} };
      expect(isNativeAudioAvailable()).toBe(false);
    });

    it('is true when native and the plugin is registered', () => {
      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: { BackgroundAudio: { startRecording: vi.fn(), stopRecording: vi.fn() } },
      };
      expect(isNativeAudioAvailable()).toBe(true);
    });
  });

  describe('startNativeRecording / stopNativeRecording', () => {
    it('throws if called without the native plugin available', async () => {
      await expect(startNativeRecording()).rejects.toThrow(/no disponible/);
      await expect(stopNativeRecording()).rejects.toThrow(/no disponible/);
    });

    it('delegates to the registered plugin methods', async () => {
      const startRecording = vi.fn().mockResolvedValue(undefined);
      const stopRecording = vi.fn().mockResolvedValue({
        filePath: '/tmp/aidux_air_123.m4a',
        base64Audio: 'AAAA',
        mimeType: 'audio/mp4',
      });
      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: { BackgroundAudio: { startRecording, stopRecording } },
      };

      await startNativeRecording();
      expect(startRecording).toHaveBeenCalledTimes(1);

      const result = await stopNativeRecording();
      expect(stopRecording).toHaveBeenCalledTimes(1);
      expect(result.mimeType).toBe('audio/mp4');
    });
  });

  describe('base64ToBlob', () => {
    it('decodes base64 into a Blob with the given mimeType and matching byte length', async () => {
      // "hola" en base64
      const blob = base64ToBlob('aG9sYQ==', 'audio/mp4');
      expect(blob.type).toBe('audio/mp4');
      expect(blob.size).toBe(4);

      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
      expect(text).toBe('hola');
    });
  });

  describe('onRecordingStopRequestedFromNotification — regresión del crash real en dispositivo (2026-08-30)', () => {
    it('no revienta cuando addListener() devuelve un objeto plano SIN .then (el bug real: TypeError ...addListener(...).then is not a function, capturado por el ErrorBoundary de /workflow)', async () => {
      const removeMock = vi.fn().mockResolvedValue(undefined);
      // Reproduce exactamente la forma que devuelve el bridge nativo real de
      // Capacitor para addListener en el path nativo (pluginHeader truthy):
      // un objeto { remove } sincrónico, NO una Promise/thenable.
      const addListenerNonThenable = vi.fn(() => ({ remove: removeMock }));

      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            registerActionTypes: vi.fn().mockResolvedValue(undefined),
            schedule: vi.fn().mockResolvedValue({ notifications: [] }),
            cancel: vi.fn().mockResolvedValue(undefined),
            // @ts-expect-error — deliberadamente no-Promise, para probar el caso real
            addListener: addListenerNonThenable,
          },
        },
      };

      const callback = vi.fn();
      // Esto NO debe lanzar — antes del fix, tirar .then() sobre el valor de
      // addListenerNonThenable() era exactamente lo que crasheaba en el
      // dispositivo real.
      expect(() => onRecordingStopRequestedFromNotification(callback)).not.toThrow();

      // Darle un tick al IIFE async interno para que corra.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(addListenerNonThenable).toHaveBeenCalledTimes(1);
    });

    it('sigue funcionando normal cuando addListener() SÍ devuelve una Promise (comportamiento esperado documentado por Capacitor)', async () => {
      const removeMock = vi.fn().mockResolvedValue(undefined);
      let capturedCallback: ((action: { actionId: string }) => void) | null = null;
      const addListenerThenable = vi.fn((_eventName: string, cb: (action: { actionId: string }) => void) => {
        capturedCallback = cb;
        return Promise.resolve({ remove: removeMock });
      });

      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            registerActionTypes: vi.fn().mockResolvedValue(undefined),
            schedule: vi.fn().mockResolvedValue({ notifications: [] }),
            cancel: vi.fn().mockResolvedValue(undefined),
            addListener: addListenerThenable,
          },
        },
      };

      const callback = vi.fn();
      const unsubscribe = onRecordingStopRequestedFromNotification(callback);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(capturedCallback).not.toBeNull();
      capturedCallback!({ actionId: 'stop_recording' });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(removeMock).toHaveBeenCalledTimes(1);
    });

    it('no hace nada (no throw) cuando LocalNotifications no está disponible', () => {
      expect(() => onRecordingStopRequestedFromNotification(vi.fn())()).not.toThrow();
    });
  });

  describe('showRecordingLockScreenNotification / dismissRecordingLockScreenNotification', () => {
    it('no revienta hacia el llamador si el plugin no está disponible', async () => {
      await expect(showRecordingLockScreenNotification()).resolves.toBeUndefined();
      await expect(dismissRecordingLockScreenNotification()).resolves.toBeUndefined();
    });

    it('registra el tipo de acción y agenda la notificación con el plugin real', async () => {
      const requestPermissions = vi.fn().mockResolvedValue({ display: 'granted' });
      const registerActionTypes = vi.fn().mockResolvedValue(undefined);
      const schedule = vi.fn().mockResolvedValue({ notifications: [{ id: 778821 }] });
      const cancel = vi.fn().mockResolvedValue(undefined);

      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: { requestPermissions, registerActionTypes, schedule, cancel, addListener: vi.fn() },
        },
      };

      await showRecordingLockScreenNotification();
      expect(requestPermissions).toHaveBeenCalledTimes(1);
      expect(registerActionTypes).toHaveBeenCalledTimes(1);
      expect(schedule).toHaveBeenCalledTimes(1);

      await dismissRecordingLockScreenNotification();
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('sin delaySeconds no manda schedule.at (comportamiento normal, inmediato)', async () => {
      const schedule = vi.fn().mockResolvedValue({ notifications: [{ id: 778821 }] });
      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            registerActionTypes: vi.fn().mockResolvedValue(undefined),
            schedule,
            cancel: vi.fn(),
            addListener: vi.fn(),
          },
        },
      };

      await showRecordingLockScreenNotification();

      const scheduledNotification = schedule.mock.calls[0][0].notifications[0];
      expect(scheduledNotification.schedule).toBeUndefined();
    });

    it('con delaySeconds agenda schedule.at en el futuro (hipótesis 1 de la investigación)', async () => {
      const schedule = vi.fn().mockResolvedValue({ notifications: [{ id: 778821 }] });
      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            registerActionTypes: vi.fn().mockResolvedValue(undefined),
            schedule,
            cancel: vi.fn(),
            addListener: vi.fn(),
          },
        },
      };

      const before = Date.now();
      await showRecordingLockScreenNotification(8);
      const after = Date.now();

      const scheduledNotification = schedule.mock.calls[0][0].notifications[0];
      const scheduledAt = scheduledNotification.schedule.at as Date;
      expect(scheduledAt.getTime()).toBeGreaterThanOrEqual(before + 8000);
      expect(scheduledAt.getTime()).toBeLessThanOrEqual(after + 8000);
    });
  });

  describe('watchAppBackgroundToShowRecordingNotification — fix real (reemplaza la hipótesis del delay fijo)', () => {
    it('no revienta cuando el plugin App no está disponible', () => {
      expect(() => watchAppBackgroundToShowRecordingNotification()()).not.toThrow();
    });

    it('muestra la notificación cuando appStateChange reporta isActive: false (la app pasó a background)', async () => {
      let capturedCallback: ((state: { isActive: boolean }) => void) | null = null;
      const appAddListener = vi.fn((_eventName: string, cb: (state: { isActive: boolean }) => void) => {
        capturedCallback = cb;
        return Promise.resolve({ remove: vi.fn() });
      });
      const schedule = vi.fn().mockResolvedValue({ notifications: [{ id: 778821 }] });

      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          App: { addListener: appAddListener },
          LocalNotifications: {
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            registerActionTypes: vi.fn().mockResolvedValue(undefined),
            schedule,
            cancel: vi.fn(),
            addListener: vi.fn(),
          },
        },
      };

      watchAppBackgroundToShowRecordingNotification();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(capturedCallback).not.toBeNull();
      capturedCallback!({ isActive: false });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(schedule).toHaveBeenCalledTimes(1);
    });

    it('NO muestra la notificación cuando appStateChange reporta isActive: true (la app volvió a foreground)', async () => {
      let capturedCallback: ((state: { isActive: boolean }) => void) | null = null;
      const appAddListener = vi.fn((_eventName: string, cb: (state: { isActive: boolean }) => void) => {
        capturedCallback = cb;
        return Promise.resolve({ remove: vi.fn() });
      });
      const schedule = vi.fn().mockResolvedValue({ notifications: [{ id: 778821 }] });

      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          App: { addListener: appAddListener },
          LocalNotifications: {
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            registerActionTypes: vi.fn().mockResolvedValue(undefined),
            schedule,
            cancel: vi.fn(),
            addListener: vi.fn(),
          },
        },
      };

      watchAppBackgroundToShowRecordingNotification();
      await new Promise((resolve) => setTimeout(resolve, 0));

      capturedCallback!({ isActive: true });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(schedule).not.toHaveBeenCalled();
    });

    it('la función de limpieza remueve el listener de appStateChange', async () => {
      const removeMock = vi.fn();
      const appAddListener = vi.fn().mockResolvedValue({ remove: removeMock });

      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          App: { addListener: appAddListener },
        },
      };

      const unsubscribe = watchAppBackgroundToShowRecordingNotification();
      await new Promise((resolve) => setTimeout(resolve, 0));

      unsubscribe();
      expect(removeMock).toHaveBeenCalledTimes(1);
    });
  });
});
