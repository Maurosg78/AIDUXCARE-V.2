/**
 * Detección del piloto España (ES-ES).
 *
 * Fuente única de verdad para: idioma por defecto (es), jurisdicción ES-ES,
 * consentimiento verbal español, textos SOAP normativa española.
 *
 * Señales (en orden de prioridad):
 * 1. Variable de entorno en build: VITE_ENABLE_ES_PILOT=true (más robusto para deploy)
 * 2. Hostname permitido: pilot.aiduxcare.com, es.aiduxcare.com
 * 3. Path: /pilot o /es (ej. aiduxcare.com/pilot o aiduxcare.com/es)
 *
 * No usamos IP: el navegador no expone la IP al JS; geolocalización por IP
 * requiere una petición externa, es inexacta (VPN, proxies) y tiene implicaciones de privacidad.
 */

const PILOT_HOSTS = /^(pilot|es)\.aiduxcare\.com$/i;
const PILOT_PATHS = /^\/(pilot|es)(\/|$)/;

function getHostname(): string {
  if (typeof window === 'undefined' || !window.location) return '';
  return window.location.hostname || '';
}

function getPathname(): string {
  if (typeof window === 'undefined' || !window.location) return '';
  return window.location.pathname || '';
}

/**
 * true si la app debe comportarse como piloto España (idioma es, jurisdicción ES-ES).
 */
export function isSpainPilot(): boolean {
  // 1. Build-time (más fiable en producción)
  const fromEnv =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_ENABLE_ES_PILOT === 'true';
  if (fromEnv) return true;

  // 2. Node / tests
  if (typeof process !== 'undefined' && process.env.VITE_ENABLE_ES_PILOT === 'true') {
    return true;
  }

  // 3. Runtime: hostname (subdominio dedicado al piloto)
  if (PILOT_HOSTS.test(getHostname())) return true;

  // 4. Runtime: path (mismo build en aiduxcare.com/pilot o /es)
  if (PILOT_PATHS.test(getPathname())) return true;

  return false;
}
