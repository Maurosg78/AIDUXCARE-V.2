import React from 'react';
import { useLocale } from '@/i18n/ui';
import normalizeVertexResponse, { normalizePhrases } from '@/utils/cleanVertexResponse';
import { correctMedicationText, correctMedicationList } from '@/utils/medicationCorrections';

interface AnalysisResultsProps {
  results: any;
  onSelect?: (selected: string[]) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, onSelect }) => {
  const { locale, t } = useLocale();

  // Normalizar el objeto antes de renderizar (no muta el crudo usado para trazas)
  const model = normalizeVertexResponse(results);

  const normalizedFindings = normalizePhrases(model.hallazgos_clinicos || [], locale);
  const normalizedRedFlags = normalizePhrases(model.red_flags || [], locale);
  const normalizedPsychosocial = normalizePhrases(model.contexto_psicosocial || [], locale);

  // Selección local de hallazgos (no afecta trazabilidad)
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggle = (item: string) => {
    setSelected(prev => {
      const has = prev.includes(item);
      const next = has ? prev.filter(x => x !== item) : [...prev, item];
      onSelect?.(next);
      return next;
    });
  };

  // Tests sugeridos: SOLO nombres (+ S/E si existen); técnica NO se muestra aquí
  const testsSrc = Array.isArray(model.evaluaciones_fisicas_sugeridas) ? model.evaluaciones_fisicas_sugeridas : [];
  const testItems = testsSrc.map((t: any, i: number) => {
    const name = typeof t === 'string' ? t : (t?.name || t?.test || t?.nombre || 'N/D');
    const s = typeof t?.sensibilidad === 'number' ? Math.round(t.sensibilidad * 100) + '%' :
              typeof t?.sensitivity === 'number' ? Math.round(t.sensitivity * 100) + '%' : 'N/D';
    const e = typeof t?.especificidad === 'number' ? Math.round(t.especificidad * 100) + '%' :
              typeof t?.specificity === 'number' ? Math.round(t.specificity * 100) + '%' : 'N/D';
    return <li key={i}>{name} · S: {s} · E: {e}</li>;
  });

  return (
    <section className="space-y-6">
      <div>
        <h3 className="font-semibold">{t('findings') ?? 'Hallazgos Clínicos'}</h3>
        <ul className="mt-2 space-y-1">
          {normalizedFindings.length ? normalizedFindings.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input
                aria-label={`select ${f}`}
                type="checkbox"
                checked={selected.includes(f)}
                onChange={() => toggle(f)}
              />
              <span>{f}</span>
            </li>
          )) : <li>{t('no_data') ?? 'Sin datos'}</li>}
        </ul>
      <details className="mt-4 border rounded p-3 bg-gray-50 text-xs">
        <summary style={{cursor:"pointer"}}>Salida del modelo (raw)</summary>
        <pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(results, null, 2)}</pre>
      </details>
      </div>

      <div>
        <h3 className="font-semibold">Red Flags</h3>
        <ul className="mt-2 space-y-1">
          {normalizedRedFlags.length ? normalizedRedFlags.map((f, i) => (<li key={i}>{f}</li>)) : <li>{t('no_data') ?? 'Sin datos'}</li>}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Tests sugeridos</h3>
        <ul className="mt-2 space-y-1">
          {testItems.length ? testItems : <li>{t('no_data') ?? 'Sin datos'}</li>}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">{t('follow_up') ?? 'Seguimiento'}</h3>
        <ul className="mt-2 space-y-1">
          {normalizedPsychosocial.length ? normalizedPsychosocial.map((p, i) => (<li key={i}>{p}</li>)) : <li>{t('no_data') ?? 'Sin datos'}</li>}
        </ul>
      </div>
    </section>
  );
};

export default AnalysisResults;
