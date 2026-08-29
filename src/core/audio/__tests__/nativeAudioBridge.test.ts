import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  base64ToBlob,
  isNativeAudioAvailable,
  startNativeRecording,
  stopNativeRecording,
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
        filePath: '/tmp/aidux_air_123.wav',
        base64Audio: 'AAAA',
        mimeType: 'audio/wav',
      });
      window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: { BackgroundAudio: { startRecording, stopRecording } },
      };

      await startNativeRecording();
      expect(startRecording).toHaveBeenCalledTimes(1);

      const result = await stopNativeRecording();
      expect(stopRecording).toHaveBeenCalledTimes(1);
      expect(result.mimeType).toBe('audio/wav');
    });
  });

  describe('base64ToBlob', () => {
    it('decodes base64 into a Blob with the given mimeType and matching byte length', async () => {
      // "hola" en base64
      const blob = base64ToBlob('aG9sYQ==', 'audio/wav');
      expect(blob.type).toBe('audio/wav');
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
});
