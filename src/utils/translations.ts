export type Language = 'en' | 'es';

const DICT: Record<Language, Record<string, string>> = {
  en: {
    'language.english': 'English',
    'language.spanish': 'Spanish',
    'language.select': 'Language',
    'ui.loading': 'Loading...',
    'ui.ok': 'OK',
    'ui.cancel': 'Cancel',
    'workflow.tabs.analysis': 'Analysis',
    'workflow.tabs.evaluation': 'Evaluation',
    'workflow.tabs.soap': 'SOAP Note',
    'analysis.results': 'Clinical Analysis Results',
    'analysis.red_flags': 'Red flags',
    'analysis.yellow_flags': 'Yellow flags',
    'analysis.medications': 'Medications',
    'actions.generate_soap': 'Generate SOAP',
    'actions.start_recording': 'Start recording',
    'actions.stop_recording': 'Stop recording',
  },
  es: {
    'language.english': 'Inglés',
    'language.spanish': 'Español',
    'language.select': 'Idioma',
    'ui.loading': 'Cargando...',
    'ui.ok': 'Aceptar',
    'ui.cancel': 'Cancelar',
    'workflow.tabs.analysis': 'Análisis',
    'workflow.tabs.evaluation': 'Evaluación Física',
    'workflow.tabs.soap': 'Nota SOAP',
    'analysis.results': 'Resultados del Análisis Clínico',
    'analysis.red_flags': 'Banderas rojas',
    'analysis.yellow_flags': 'Banderas amarillas',
    'analysis.medications': 'Medicaciones',
    'actions.generate_soap': 'Generar SOAP',
    'actions.start_recording': 'Comenzar grabación',
    'actions.stop_recording': 'Detener grabación',
  }
};

const SPANISH_COUNTRIES = new Set([
  'ES','MX','AR','CO','CL','PE','VE','UY','PY','BO','EC',
  'GT','SV','HN','NI','CR','PA','DO','PR','CU','GQ'
]);

const KEY = 'preferredLanguage';

export function getLanguage(): Language {
  const saved = (typeof window !== 'undefined' && localStorage.getItem(KEY)) as Language | null;
  if (saved === 'en' || saved === 'es') return saved;
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

export function setLanguage(lang: Language, { reload = true } = {}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, lang);
  window.dispatchEvent(new CustomEvent('language-change', { detail: lang }));
  if (reload) window.location.reload();
}

export function t(key: string, fallback?: string): string {
  const lang = getLanguage();
  const value = DICT[lang]?.[key];
  if (value) return value;
  // fallback a misma clave o a fallback explícito
  return fallback ?? key;
}

/** Autodetección por IP (ipapi.co) con fallback a navegador. Solo en primer load. */
async function autoDetectOnce() {
  if (typeof window === 'undefined') return;
  const already = localStorage.getItem(KEY);
  if (already === 'en' || already === 'es') return;

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data: any = await res.json();
      const country = String(data.country || data.country_code || '').toUpperCase();
      if (SPANISH_COUNTRIES.has(country)) {
        setLanguage('es'); // recarga automática
        return;
      } else {
        setLanguage('en'); // recarga automática
        return;
      }
    }
  } catch (_) {
    // ignoramos errores de red/CORS
  }
  // Fallback navegador
  const nav = (navigator.language || 'en').toLowerCase();
  setLanguage(nav.startsWith('es') ? 'es' : 'en');
}

// Ejecuta autodetección al importar el módulo SOLO si no hay preferencia previa
if (typeof window !== 'undefined') {
  autoDetectOnce();
}

export default DICT;
