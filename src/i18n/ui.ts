import { useCallback, useEffect, useMemo, useState } from 'react';

const dict = {
  es: {
    findings: 'Hallazgos Clínicos',
    relevant_findings: 'Hallazgos Relevantes',
    diagnoses: 'Diagnósticos Probables',
    differential: 'Diagnósticos Diferenciales',
    plan: 'Plan y Cierre del Día',
    plan_short: 'Plan',
    immediate_plan: 'Plan Inmediato',
    short_term: 'Corto Plazo',
    long_term: 'Largo Plazo',
    follow_up: 'Seguimiento',
    red_flags: 'Red Flags',
    analysis: 'Análisis',
    soap: 'SOAP',
    section_p: 'Plan (P)',
    language: 'Idioma',
    no_data: 'Sin datos',
  },
  en: {
    findings: 'Clinical Findings',
    relevant_findings: 'Relevant Findings',
    diagnoses: 'Probable Diagnoses',
    differential: 'Differential Diagnoses',
    plan: 'Plan & Day Wrap-up',
    plan_short: 'Plan',
    immediate_plan: 'Immediate Plan',
    short_term: 'Short Term',
    long_term: 'Long Term',
    follow_up: 'Follow-up',
    red_flags: 'Red Flags',
    analysis: 'Analysis',
    soap: 'SOAP',
    section_p: 'Plan (P)',
    language: 'Language',
    no_data: 'No data',
  }
} as const;

type Locale = keyof typeof dict;
type DictKey = keyof typeof dict['es'];

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aidux_locale') as Locale | null;
      if (saved === 'es' || saved === 'en') setLocaleState(saved);
    } catch {}
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('aidux_locale', l); } catch {}
  }, []);

  // t() acepta claves tipadas y también cualquier string (fallback a la propia key)
  const t = useCallback((key: DictKey | string): string => {
    const table = dict[locale] as Record<string, string>;
    return table[key] ?? String(key);
  }, [locale]);

  const api = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);
  return api;
}
