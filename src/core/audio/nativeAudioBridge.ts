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

export interface NativeAudioSegment {
  filePath: string;
  base64Audio: string;
}

export interface NativeAudioResult {
  segments: NativeAudioSegment[];
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
      schedule?: { at: Date };
    }>;
  }): Promise<{ notifications: Array<{ id: number }> }>;
  cancel(options: { notifications: Array<{ id: number }> }): Promise<void>;
  addListener(
    eventName: 'localNotificationActionPerformed',
    listenerFunc: (action: LocalNotificationsActionPerformed) => void
  ): Promise<LocalNotificationsListenerHandle>;
}

interface AppStateChange {
  isActive: boolean;
}

interface AppNativePlugin {
  addListener(
    eventName: 'appStateChange',
    listenerFunc: (state: AppStateChange) => void
  ): Promise<LocalNotificationsListenerHandle>;
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        BackgroundAudio?: BackgroundAudioNativePlugin;
        LocalNotifications?: LocalNotificationsNativePlugin;
        App?: AppNativePlugin;
      };
    };
  }
}

function getNativePlugin(): BackgroundAudioNativePlugin | null {
  if (typeof window === 'undefined') return null;
  const capacitor = window.Capacitor;
  const plugins = capacitor?.Plugins;
  const plugin = plugins?.BackgroundAudio ?? null;
  return plugin;
}

function getLocalNotificationsPlugin(): LocalNotificationsNativePlugin | null {
  if (typeof window === 'undefined') return null;
  const capacitor = window.Capacitor;
  const plugins = capacitor?.Plugins;
  const plugin = plugins?.LocalNotifications ?? null;
  return plugin;
}

function getAppPlugin(): AppNativePlugin | null {
  if (typeof window === 'undefined') return null;
  const capacitor = window.Capacitor;
  const plugins = capacitor?.Plugins;
  const plugin = plugins?.App ?? null;
  return plugin;
}

/** True solo cuando corre como app nativa (Capacitor iOS/Android) y el plugin está registrado. */
export function isNativeAudioAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = window.Capacitor;
  const isNativePlatform = capacitor?.isNativePlatform?.() ?? false;
  const plugin = getNativePlugin();
  const pluginIsRegistered = plugin !== null;
  return isNativePlatform && pluginIsRegistered;
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

/** Formatea segundos como mm:ss para el cuerpo de la notificación. */
function formatElapsedTime(elapsedSeconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minutesPadded = minutes.toString().padStart(2, '0');
  const secondsPadded = seconds.toString().padStart(2, '0');
  return `${minutesPadded}:${secondsPadded}`;
}

function buildRecordingNotificationBody(elapsedSeconds: number): string {
  const elapsedLabel = formatElapsedTime(elapsedSeconds);
  return `Grabando... ${elapsedLabel}. Toca "Detener grabación" para finalizarla sin desbloquear el teléfono.`;
}

/**
 * Muestra (o actualiza) la notificación de "grabando" con el botón de
 * acción. No-op fuera de un entorno nativo. Deliberadamente no-throw hacia
 * el llamador — si la notificación falla (permiso denegado, etc.) la
 * grabación en sí no debe verse afectada, solo se pierde ese control visual
 * adicional.
 *
 * `elapsedSeconds` (default 0): decisión CTO 2026-08-30 (Opción B del
 * documento de propuesta, ver docs/proposals/lock-screen-feedback-and-
 * interruption-handling.md) — mostrar tiempo transcurrido reagendando la
 * misma notificación periódicamente, en vez de una Live Activity (Fase 2).
 * `startRecordingNotificationUpdates` es quien llama con el valor real.
 *
 * `delaySeconds` (default 0 = comportamiento normal, inmediato): existe para
 * la investigación de por qué la notificación no aparece en pantalla
 * bloqueada (ver docs/investigations/lock-screen-notification-not-showing.md,
 * hipótesis 1). Hoy la notificación siempre se agenda con la app en
 * foreground (el usuario recién tocó "Iniciar grabación"), así que
 * `willPresent` siempre corre en foreground. Con un delay, la entrega real
 * puede caer con el teléfono ya bloqueado — un escenario que nunca se probó.
 */
export async function showRecordingLockScreenNotification(
  elapsedSeconds = 0,
  delaySeconds = 0
): Promise<void> {
  const plugin = getLocalNotificationsPlugin();
  if (!plugin) return;
  try {
    await ensureRecordingActionTypeRegistered(plugin);
    const hasDelay = delaySeconds > 0;
    let schedule: { at: Date } | undefined;
    if (hasDelay) {
      const delayMs = delaySeconds * 1000;
      const scheduledAt = new Date(Date.now() + delayMs);
      schedule = { at: scheduledAt };
    }
    const body = buildRecordingNotificationBody(elapsedSeconds);
    await plugin.schedule({
      notifications: [
        {
          id: RECORDING_NOTIFICATION_ID,
          title: 'AiDux Air — grabando',
          body,
          actionTypeId: RECORDING_ACTION_TYPE_ID,
          schedule,
        },
      ],
    });
  } catch (err) {
    console.warn('[nativeAudioBridge] No se pudo mostrar la notificación de grabación:', err);
  }
}

/** Cada cuánto se reagenda la notificación con el tiempo transcurrido actualizado. */
const RECORDING_NOTIFICATION_UPDATE_INTERVAL_MS = 30000;

/**
 * Arranca la actualización periódica de la notificación con el tiempo
 * transcurrido (Opción B, decisión CTO 2026-08-30). Devuelve una función de
 * limpieza que detiene las actualizaciones.
 */
export function startRecordingNotificationUpdates(recordingStartedAtMs: number): () => void {
  const intervalId = setInterval(() => {
    const nowMs = Date.now();
    const elapsedMs = nowMs - recordingStartedAtMs;
    const elapsedSeconds = elapsedMs / 1000;
    void showRecordingLockScreenNotification(elapsedSeconds);
  }, RECORDING_NOTIFICATION_UPDATE_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
  };
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
 *
 * BUG REAL encontrado en dispositivo (2026-08-30): esto originalmente
 * encadenaba `.then()/.catch()` directo sobre `plugin.addListener(...)`, y
 * crasheaba con `TypeError: ...addListener(...).then is not a function` —
 * capturado por el ErrorBoundary de nivel de ruta, dejando al usuario sin
 * poder ni volver a la lista de pacientes. Causa: el propio bridge de
 * Capacitor (`@capacitor/core`) advierte explícitamente "Using addListener()
 * without 'await' is deprecated" — en el path nativo real (`pluginHeader`
 * truthy, que es el caso en el dispositivo, a diferencia de cualquier mock
 * de test) el valor que devuelve `addListener` no es un `.then()` encadenable
 * de forma segura. Usar `await` dentro de una función async es la forma
 * oficial y además es inmune al problema de raíz: `await` sobre cualquier
 * valor (sea o no thenable) simplemente lo resuelve, nunca revienta con
 * "X.then is not a function".
 */
export function onRecordingStopRequestedFromNotification(callback: () => void): () => void {
  const plugin = getLocalNotificationsPlugin();
  if (!plugin) return () => {};

  let handle: LocalNotificationsListenerHandle | null = null;
  let cancelled = false;

  const handleNotificationAction = (action: LocalNotificationsActionPerformed) => {
    const isStopAction = action.actionId === STOP_RECORDING_ACTION_ID;
    if (isStopAction) {
      callback();
    }
  };

  (async () => {
    try {
      const h = await plugin.addListener('localNotificationActionPerformed', handleNotificationAction);
      if (cancelled) {
        h.remove();
      } else {
        handle = h;
      }
    } catch (err) {
      console.warn('[nativeAudioBridge] No se pudo suscribir al listener de acciones de notificación:', err);
    }
  })();

  return () => {
    cancelled = true;
    handle?.remove();
  };
}

/**
 * Muestra la notificación de "grabando" específicamente cuando la app pasa
 * a background (pantalla bloqueada, cambio de app, etc.) — no en un timer
 * fijo desde que arrancó la grabación.
 *
 * Reemplaza la hipótesis del delay fijo (ver
 * docs/investigations/lock-screen-notification-not-showing.md, hipótesis
 * 1): confirmado en dispositivo real que un delay arbitrario SÍ hace que la
 * notificación aparezca en pantalla bloqueada (antes nunca se entregaba con
 * el teléfono ya bloqueado, siempre en foreground) — pero un timer fijo no
 * es robusto: el usuario puede bloquear la pantalla en cualquier momento de
 * la grabación, no dentro de una ventana arbitraria de N segundos. La causa
 * raíz real era "la notificación nunca se entregaba con el teléfono
 * bloqueado"; la solución real es entregarla exactamente en ese momento,
 * usando `@capacitor/app`'s `appStateChange` (isActive: false = la app dejó
 * de estar activa — pantalla bloqueada o cambio de app).
 */
export function watchAppBackgroundToShowRecordingNotification(): () => void {
  const appPlugin = getAppPlugin();
  if (!appPlugin) return () => {};

  let handle: LocalNotificationsListenerHandle | null = null;
  let cancelled = false;

  const handleAppStateChange = (state: AppStateChange) => {
    const wentToBackground = !state.isActive;
    if (wentToBackground) {
      void showRecordingLockScreenNotification();
    }
  };

  (async () => {
    try {
      const h = await appPlugin.addListener('appStateChange', handleAppStateChange);
      if (cancelled) {
        h.remove();
      } else {
        handle = h;
      }
    } catch (err) {
      console.warn('[nativeAudioBridge] No se pudo suscribir a appStateChange:', err);
    }
  })();

  return () => {
    cancelled = true;
    handle?.remove();
  };
}
