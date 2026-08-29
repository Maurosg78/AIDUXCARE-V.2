/**
 * Puente hacia el plugin nativo de audio en background (AiDux Air, Hito 2c)
 * y hacia el control de "Detener grabación" desde la pantalla de bloqueo
 * (Hito 2e, vía @capacitor/local-notifications).
 *
 * Deliberadamente SIN dependencia de npm de Capacitor — este repo es la web
 * app que se despliega a pilot.aiduxcare.com, y no debe ganar una
 * dependencia nueva ni un cambio de bundle por soportar un shell nativo que
 * vive en un repo aparte (aidux-air). En su lugar, se detecta en runtime si
 * `window.Capacitor` existe (Capacitor lo inyecta solo cuando la app corre
 * dentro del WebView nativo) y se accede a los plugins ya registrados por su
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

interface LocalNotificationsActionPerformed {
  actionId: string;
  notification: { id: number };
}

interface LocalNotificationsListenerHandle {
  remove(): void;
}

interface LocalNotificationsNativePlugin {
  requestPermissions(): Promise<{ display: string }>;
  registerActionTypes(options: {
    types: Array<{
      id: string;
      actions: Array<{
        id: string;
        title: string;
        requiresAuthentication?: boolean;
        foreground?: boolean;
        destructive?: boolean;
      }>;
    }>;
  }): Promise<void>;
  schedule(options: {
    notifications: Array<{
      id: number;
      title: string;
      body: string;
      actionTypeId?: string;
    }>;
  }): Promise<{ notifications: Array<{ id: number }> }>;
  cancel(options: { notifications: Array<{ id: number }> }): Promise<void>;
  addListener(
    eventName: 'localNotificationActionPerformed',
    listenerFunc: (action: LocalNotificationsActionPerformed) => void
  ): Promise<LocalNotificationsListenerHandle>;
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        BackgroundAudio?: BackgroundAudioNativePlugin;
        LocalNotifications?: LocalNotificationsNativePlugin;
      };
    };
  }
}

function getNativePlugin(): BackgroundAudioNativePlugin | null {
  if (typeof window === 'undefined') return null;
  return window.Capacitor?.Plugins?.BackgroundAudio ?? null;
}

function getLocalNotificationsPlugin(): LocalNotificationsNativePlugin | null {
  if (typeof window === 'undefined') return null;
  return window.Capacitor?.Plugins?.LocalNotifications ?? null;
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

// ─── Hito 2e: "Detener grabación" desde la pantalla de bloqueo ────────────
//
// Feedback real de la prueba de bolsillo: no tener forma de detener la
// grabación sin desbloquear el teléfono generaba incertidumbre, aunque
// técnicamente todo funcionara bien por dentro. Esto no es matching de
// identidad ni comando de voz — es una notificación local con un botón de
// acción.
//
// requiresAuthentication: false (el default del plugin, seteado acá igual
// de forma explícita porque es justamente la razón de ser de esta
// notificación) hace que la acción se ejecute directo, sin pedir
// desbloqueo — confirmado contra la documentación de
// @capacitor/local-notifications y el comportamiento documentado de
// UNNotificationActionOptions en iOS: sin esa opción, la acción corre en
// background incluso con la pantalla bloqueada.
//
// Por qué esto debería andar de forma confiable en esta app en particular:
// como ya corre con UIBackgroundModes: audio activo durante la grabación
// (confirmado empíricamente por la prueba de bolsillo de varios minutos),
// el proceso no se suspende — el mismo tiempo de ejecución en background
// que sostiene AVAudioEngine es el que mantiene al WebView/JS capaz de
// reaccionar al listener de la notificación, no es un mecanismo aparte.
//
// Nota realista: `ongoing` (notificación no descartable) es Android-only
// en este plugin — iOS no tiene un equivalente real vía LocalNotifications.
// El usuario SÍ puede deslizarla para descartarla manualmente; eso no
// detiene la grabación, solo hace desaparecer el control visual. No se
// puede prometer "no descartable" en iOS con esta API.

const RECORDING_ACTION_TYPE_ID = 'aidux_air_recording_controls';
const STOP_RECORDING_ACTION_ID = 'stop_recording';
const RECORDING_NOTIFICATION_ID = 778821; // fijo — mismo id reemplaza/cancela la instancia anterior

let recordingActionTypeRegistered = false;

async function ensureRecordingActionTypeRegistered(plugin: LocalNotificationsNativePlugin): Promise<void> {
  if (recordingActionTypeRegistered) return;
  await plugin.requestPermissions();
  await plugin.registerActionTypes({
    types: [
      {
        id: RECORDING_ACTION_TYPE_ID,
        actions: [
          {
            id: STOP_RECORDING_ACTION_ID,
            title: 'Detener grabación',
            requiresAuthentication: false,
            foreground: false,
            destructive: true,
          },
        ],
      },
    ],
  });
  recordingActionTypeRegistered = true;
}

/**
 * Muestra la notificación de "grabando" con el botón de acción. No-op fuera
 * de un entorno nativo. Deliberadamente no-throw hacia el llamador — si la
 * notificación falla (permiso denegado, etc.) la grabación en sí no debe
 * verse afectada, solo se pierde ese control visual adicional.
 */
export async function showRecordingLockScreenNotification(): Promise<void> {
  const plugin = getLocalNotificationsPlugin();
  if (!plugin) return;
  try {
    await ensureRecordingActionTypeRegistered(plugin);
    await plugin.schedule({
      notifications: [
        {
          id: RECORDING_NOTIFICATION_ID,
          title: 'AiDux Air — grabando',
          body: 'Sesión clínica en curso. Tocá "Detener grabación" para finalizarla sin desbloquear el teléfono.',
          actionTypeId: RECORDING_ACTION_TYPE_ID,
        },
      ],
    });
  } catch (err) {
    console.warn('[nativeAudioBridge] No se pudo mostrar la notificación de grabación:', err);
  }
}

/** Cancela la notificación de "grabando". Se llama al detener por cualquier vía (in-app o desde la propia notificación). */
export async function dismissRecordingLockScreenNotification(): Promise<void> {
  const plugin = getLocalNotificationsPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: [{ id: RECORDING_NOTIFICATION_ID }] });
  } catch (err) {
    console.warn('[nativeAudioBridge] No se pudo cancelar la notificación de grabación:', err);
  }
}

/**
 * Suscribe `callback` a la acción "Detener grabación" tocada desde la
 * notificación. Devuelve una función de limpieza. El llamador (useTranscript)
 * pasa acá exactamente su propio stopRecording — no hay una segunda
 * implementación de "detener" en este archivo.
 */
export function onRecordingStopRequestedFromNotification(callback: () => void): () => void {
  const plugin = getLocalNotificationsPlugin();
  if (!plugin) return () => {};

  let handle: LocalNotificationsListenerHandle | null = null;
  let cancelled = false;

  plugin
    .addListener('localNotificationActionPerformed', (action) => {
      if (action.actionId === STOP_RECORDING_ACTION_ID) {
        callback();
      }
    })
    .then((h) => {
      if (cancelled) {
        h.remove();
      } else {
        handle = h;
      }
    })
    .catch((err) => {
      console.warn('[nativeAudioBridge] No se pudo suscribir al listener de acciones de notificación:', err);
    });

  return () => {
    cancelled = true;
    handle?.remove();
  };
}
