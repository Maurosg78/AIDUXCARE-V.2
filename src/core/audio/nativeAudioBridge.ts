/**
 * Puente hacia el plugin nativo de audio en background (AiDux Air, Hito 2c).
 *
 * Deliberadamente SIN dependencia de npm de Capacitor — este repo es la web
 * app que se despliega a pilot.aiduxcare.com, y no debe ganar una
 * dependencia nueva ni un cambio de bundle por soportar un shell nativo que
 * vive en un repo aparte (aidux-air). En su lugar, se detecta en runtime si
 * `window.Capacitor` existe (Capacitor lo inyecta solo cuando la app corre
 * dentro del WebView nativo) y se accede al plugin ya registrado por su
 * nombre en `window.Capacitor.Plugins`.
 *
 * Consecuencia: en cualquier navegador normal (incluido pilot.aiduxcare.com
 * en producción hoy), `window.Capacitor` es `undefined` y todas las
 * funciones de este módulo son no-op / devuelven `false` — el path web
 * (MediaRecorder) queda exactamente igual que antes de este archivo existir.
 */

export interface NativeAudioResult {
  filePath: string;
  base64Audio: string;
  mimeType: string;
}

interface BackgroundAudioNativePlugin {
  startRecording(): Promise<void>;
  stopRecording(): Promise<NativeAudioResult>;
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        BackgroundAudio?: BackgroundAudioNativePlugin;
      };
    };
  }
}

function getNativePlugin(): BackgroundAudioNativePlugin | null {
  if (typeof window === 'undefined') return null;
  return window.Capacitor?.Plugins?.BackgroundAudio ?? null;
}

/** True solo cuando corre como app nativa (Capacitor iOS/Android) y el plugin está registrado. */
export function isNativeAudioAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = window.Capacitor;
  return Boolean(capacitor?.isNativePlatform?.() && getNativePlugin());
}

export async function startNativeRecording(): Promise<void> {
  const plugin = getNativePlugin();
  if (!plugin) {
    throw new Error('Plugin nativo BackgroundAudio no disponible en este entorno.');
  }
  await plugin.startRecording();
}

export async function stopNativeRecording(): Promise<NativeAudioResult> {
  const plugin = getNativePlugin();
  if (!plugin) {
    throw new Error('Plugin nativo BackgroundAudio no disponible en este entorno.');
  }
  return plugin.stopRecording();
}

/** Decodifica el base64 que devuelve el plugin nativo a un Blob usable por FirebaseWhisperService.transcribe(). */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
