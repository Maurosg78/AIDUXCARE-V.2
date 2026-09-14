import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * TD-026 (2026-09-15): whisperProxy en sí tiene timeoutSeconds: 300 del lado
 * del servidor, pero el fetch del cliente no tenía ningún límite — si la
 * promesa nunca se resolvía ni rechazaba (la app pasa a background justo
 * mientras espera la respuesta), el respaldo de audio quedaba en
 * `transcriptionStatus: 'pending'` para siempre, sin error. Incidente real:
 * sesión de una paciente, servidor transcribió con éxito en 11s pero el
 * cliente nunca procesó la respuesta — el texto se recuperó a mano después.
 * Esta suite cubre el timeout nuevo (AbortController) que convierte ese
 * cuelgue silencioso en un error explícito y accionable.
 */

vi.mock('../../lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-id', getIdToken: vi.fn().mockResolvedValue('fake-id-token') } },
}));

import { FirebaseWhisperService } from '../FirebaseWhisperService';

function makeAudioBlob(): Blob {
  return new Blob(['fake-audio-bytes'], { type: 'audio/mp4' });
}

/**
 * blobToBase64 usa FileReader real (no depende de setTimeout, por eso no
 * hace falta fakearlo) — pero sí corre en su propio tick. Antes de avanzar
 * el timer fake del fetch, hay que dejarle espacio real para completar y
 * para que `transcribe()` llegue a registrar el setTimeout del abort.
 * setImmediate no está en el set fakeado (solo setTimeout/clearTimeout).
 */
async function waitUntilFetchIsCalled(fetchMock: ReturnType<typeof vi.fn>): Promise<void> {
  for (let attempt = 0; attempt < 50 && fetchMock.mock.calls.length === 0; attempt++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

describe('FirebaseWhisperService.transcribe', () => {
  beforeEach(() => {
    // Solo setTimeout/clearTimeout — dejar el resto del reloj real, porque
    // FileReader en jsdom (usado por blobToBase64) depende de scheduling
    // real y se cuelga si se fakea el reloj completo.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resuelve normalmente cuando el servidor responde antes del timeout', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { text: 'hola doctor', language: 'es', duration: 5 } }),
    }) as unknown as typeof fetch;

    const result = await FirebaseWhisperService.transcribe(makeAudioBlob());

    expect(result.text).toBe('hola doctor');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('TD-026: aborta con un error explícito si el fetch no resuelve dentro del timeout, en vez de quedar colgado para siempre', async () => {
    global.fetch = vi.fn((_url: string, options?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
        // Nunca resuelve por su cuenta — simula exactamente el escenario
        // real: la respuesta del servidor nunca llega a procesarse del
        // lado del cliente.
      });
    }) as unknown as typeof fetch;

    const transcribePromise = FirebaseWhisperService.transcribe(makeAudioBlob());
    // Que la promesa quede pendiente indefinidamente sin el fix sería
    // exactamente el bug — con el fix, avanzar el timer debe resolverla.
    const assertion = expect(transcribePromise).rejects.toThrow(/180s/);
    await waitUntilFetchIsCalled(global.fetch as ReturnType<typeof vi.fn>);
    await vi.advanceTimersByTimeAsync(180_000);
    await assertion;
  });

  it('el error de timeout es distinguible de un error de servidor real (no es solo "AbortError" crudo)', async () => {
    global.fetch = vi.fn((_url: string, options?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    }) as unknown as typeof fetch;

    const transcribePromise = FirebaseWhisperService.transcribe(makeAudioBlob());
    const assertion = expect(transcribePromise).rejects.toThrow(/reintentar la transcripción/);
    await waitUntilFetchIsCalled(global.fetch as ReturnType<typeof vi.fn>);
    await vi.advanceTimersByTimeAsync(180_000);
    await assertion;
  });
});
