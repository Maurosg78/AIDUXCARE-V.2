import { vi } from 'vitest';

// Polyfill básico de fetch con json()
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  })) as unknown as typeof fetch;
} else {
  // Si ya existe, envuelve para permitir mocks de respuesta en cada test
  const realFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(realFetch) as unknown as typeof fetch;
}

// Geolocation mock seguro
if (!('navigator' in globalThis)) {
  // @ts-expect-error jsdom
  globalThis.navigator = {} as Navigator;
}

if (!('geolocation' in navigator)) {
  // @ts-expect-error jsdom
  navigator.geolocation = {
    getCurrentPosition: (success, error) => {
      // por defecto simulamos "no disponible"
      error?.({ code: 2, message: 'Position unavailable' } as GeolocationPositionError);
    },
    watchPosition: () => 0,
    clearWatch: () => {},
  } as unknown as Geolocation;
}
