import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isSpainPilot } from './core/pilotDetection';
import en from './locales/en.json';
import es from './locales/es.json';

/**
 * i18n bootstrap
 *
 * Default language:
 * - Si piloto España (env, host pilot/es.aiduxcare.com, o path /pilot|/es) → 'es'
 * - Else VITE_LANGUAGE o 'en'
 */
const explicitLanguage =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LANGUAGE) || undefined;

const defaultLanguage = isSpainPilot() ? 'es' : explicitLanguage || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
